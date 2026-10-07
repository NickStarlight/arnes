import type { Checkpoint } from '@langchain/langgraph-checkpoint'
import { database, type ConversationMetadata } from '@/libs/dexie/database.ts'
import { DexieSaver } from '@/libs/dexie/checkpointer.ts'

const saver = new DexieSaver()

/** Loads presentation metadata separately from agent checkpoints. */
export async function listConversationMetadata(): Promise<ConversationMetadata[]> {
  return database.conversations.toArray()
}

/** Merges one edit atomically so renaming and pinning preserve each other's values. */
export async function saveConversationMetadata(threadId: string, changes: Omit<ConversationMetadata, 'threadId'>): Promise<void> {
  await database.transaction('rw', database.conversations,
    /** Reads and writes within one transaction to avoid losing concurrent metadata edits. */
    async () => {
      const existing = await database.conversations.get(threadId)
      await database.conversations.put({ ...existing, ...changes, threadId })
    },
  )
}

/** Removes the entire saved thread and its presentation metadata in one commit. */
export async function deleteConversationRecords(threadId: string): Promise<void> {
  await database.transaction('rw', database.conversations, database.checkpoints, database.writes,
    /** Includes every namespace and pending write so a deleted conversation cannot be resumed. */
    async () => {
      await saver.deleteThread(threadId)
      await database.conversations.delete(threadId)
    },
  )
}

/** Removes every saved thread and all presentation metadata in one commit, keeping other settings intact. */
export async function deleteAllConversationRecords(): Promise<void> {
  await database.transaction('rw', database.conversations, database.checkpoints, database.writes,
    async () => {
      await database.conversations.clear()
      await database.checkpoints.clear()
      await database.writes.clear()
    },
  )
}

/** Reads only the latest root checkpoint per thread, newest first, without loading task writes. */
export async function listConversationCheckpoints(): Promise<{ threadId: string, checkpoint: Checkpoint }[]> {
  const records = await database.checkpoints.orderBy('id').reverse().toArray()
  const seen = new Set<string>()
  const conversations: { threadId: string, checkpoint: Checkpoint }[] = []

  for (const record of records) {
    if (record.namespace || seen.has(record.threadId)) continue

    seen.add(record.threadId)
    const checkpoint = await saver.serde.loadsTyped(...record.checkpoint) as Checkpoint
    conversations.push({ threadId: record.threadId, checkpoint })
  }

  return conversations
}

/** Loads the latest root state so subsequent submissions resume the same persisted thread. */
export async function getConversationCheckpoint(threadId: string): Promise<Checkpoint | undefined> {
  return saver.get({ configurable: { thread_id: threadId, checkpoint_ns: '' } })
}
