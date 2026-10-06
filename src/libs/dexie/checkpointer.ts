import {
  BaseCheckpointSaver,
  WRITES_IDX_MAP,
  getCheckpointId,
  type ChannelVersions,
  type Checkpoint,
  type CheckpointListOptions,
  type CheckpointMetadata,
  type CheckpointTuple,
  type PendingWrite,
} from '@langchain/langgraph-checkpoint'
import { createDatabase, database, type CheckpointRecord, type WriteRecord } from '@/libs/dexie/database.ts'

type Config = Parameters<BaseCheckpointSaver['getTuple']>[0]

/** Validates identifiers before using them as IndexedDB keys. */
function scope(config: Config): { threadId: string, namespace: string } {
  const threadId = config.configurable?.thread_id
  const namespace = config.configurable?.checkpoint_ns ?? ''
  if (typeof threadId !== 'string' || !threadId) throw new Error('A non-empty thread_id is required')
  if (typeof namespace !== 'string') throw new Error('checkpoint_ns must be a string')
  return { threadId, namespace }
}

/** Produces the minimal configuration needed to resume a stored checkpoint. */
function checkpointConfig(record: CheckpointRecord, id = record.id): Config {
  return { configurable: { thread_id: record.threadId, checkpoint_ns: record.namespace, checkpoint_id: id } }
}

/** Applies metadata filters using the same top-level equality semantics as LangGraph's memory saver. */
function matchesMetadata(metadata: CheckpointMetadata, filter: CheckpointListOptions['filter']): boolean {
  for (const [key, value] of Object.entries(filter ?? {})) {
    if ((metadata as Record<string, unknown>)[key] !== value) return false
  }
  return true
}

/** Persists LangGraph checkpoints and retry-safe task writes through Dexie. */
export class DexieSaver extends BaseCheckpointSaver {
  private readonly database: ReturnType<typeof createDatabase>

  /** Shares application storage by default and supports isolated databases for tests. */
  constructor(databaseName = 'arnes') {
    super()
    this.database = databaseName === 'arnes' ? database : createDatabase(databaseName)
  }

  /** Loads an explicit checkpoint or the newest checkpoint within a thread and namespace. */
  async getTuple(config: Config): Promise<CheckpointTuple | undefined> {
    const { threadId, namespace } = scope(config)
    const id = getCheckpointId(config)
    const records = this.database.checkpoints

    const record = id
      ? await records.get([threadId, namespace, id])
      : await records.where('[threadId+namespace]').equals([threadId, namespace]).reverse().first()

    return record ? this.restoreTuple(record) : undefined
  }

  /** Lists checkpoints newest first without holding a transaction open across generator yields. */
  async *list(config: Config, options: CheckpointListOptions = {}): AsyncGenerator<CheckpointTuple> {
    const fields = config.configurable
    const id = getCheckpointId(config)
    const before = options.before ? getCheckpointId(options.before) : undefined

    const records = await this.database.checkpoints.orderBy('id').reverse().filter(
      /** Applies thread, namespace, and pagination constraints before deserializing records. */
      record => (fields?.thread_id === undefined || fields.thread_id === record.threadId)
        && (fields?.checkpoint_ns === undefined || fields.checkpoint_ns === record.namespace)
        && (!id || id === record.id)
        && (!before || record.id < before),
    ).toArray()

    let remaining = options.limit ?? Infinity

    for (const record of records) {
      if (remaining <= 0) return

      const metadata = await this.serde.loadsTyped(...record.metadata) as CheckpointMetadata
      if (!matchesMetadata(metadata, options.filter)) continue

      yield await this.restoreTuple(record)
      remaining--
    }
  }

  /** Serializes before writing so asynchronous serialization cannot auto-close a transaction. */
  async put(config: Config, checkpoint: Checkpoint, metadata: CheckpointMetadata, _newVersions?: ChannelVersions): Promise<Config> {
    const record: CheckpointRecord = {
      ...scope(config),
      id: checkpoint.id,
      parentId: getCheckpointId(config) || undefined,
      checkpoint: await this.serde.dumpsTyped(checkpoint),
      metadata: await this.serde.dumpsTyped(metadata),
    }

    await this.database.checkpoints.put(record)
    return checkpointConfig(record)
  }

  /** Retains the first regular write on retries while allowing special error/control writes to be replaced. */
  async putWrites(config: Config, writes: PendingWrite[], taskId: string): Promise<void> {
    const location = scope(config)
    const id = getCheckpointId(config)

    if (!id) throw new Error('checkpoint_id is required for pending writes')

    const records: WriteRecord[] = []

    for (const [index, [channel, value]] of writes.entries()) {
      records.push({
        ...location,
        id,
        taskId,
        index: Object.hasOwn(WRITES_IDX_MAP, channel) ? WRITES_IDX_MAP[channel] : index,
        channel,
        value: await this.serde.dumpsTyped(value),
      })
    }

    await this.database.transaction('rw', this.database.writes,
      /** Checks and writes atomically so concurrent retries cannot replace successful task output. */
      async () => {
        for (const record of records) {
          const key: [string, string, string, string, number] = [record.threadId, record.namespace, id, taskId, record.index]

          if (record.index < 0 || !await this.database.writes.get(key)) {
            await this.database.writes.put(record)
          }
        }
      },
    )
  }

  /** Atomically removes all namespaces and pending writes belonging to one thread. */
  async deleteThread(threadId: string): Promise<void> {
    await this.database.transaction('rw', this.database.checkpoints, this.database.writes,
      /** Keeps checkpoint and task-write deletion in the same commit. */
      async () => {
        await this.database.checkpoints.where('threadId').equals(threadId).delete()
        await this.database.writes.where('threadId').equals(threadId).delete()
      },
    )
  }

  /** Rehydrates serialized messages and task writes through LangGraph's serializer. */
  private async restoreTuple(record: CheckpointRecord): Promise<CheckpointTuple> {
    const writes = await this.database.writes
      .where('[threadId+namespace+id]')
      .equals([record.threadId, record.namespace, record.id])
      .toArray()

    const pendingWrites: NonNullable<CheckpointTuple['pendingWrites']> = []

    for (const write of writes) {
      pendingWrites.push([write.taskId, write.channel, await this.serde.loadsTyped(...write.value)])
    }

    return {
      config: checkpointConfig(record),
      checkpoint: await this.serde.loadsTyped(...record.checkpoint) as Checkpoint,
      metadata: await this.serde.loadsTyped(...record.metadata) as CheckpointMetadata,
      parentConfig: record.parentId ? checkpointConfig(record, record.parentId) : undefined,
      pendingWrites,
    }
  }
}
