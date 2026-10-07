import Dexie, { type Table } from 'dexie'
import type { ChatMessage } from '@/stores/conversation.ts'

type Serialized = [string, Uint8Array]

export type ConversationMetadata = {
  threadId: string
  title?: string
  pinned?: boolean
  totalCost?: number
  messages?: readonly ChatMessage[]
  updatedAt?: string
}

export type CheckpointRecord = {
  threadId: string
  namespace: string
  id: string
  parentId?: string
  checkpoint: Serialized
  metadata: Serialized
}

export type WriteRecord = {
  threadId: string
  namespace: string
  id: string
  taskId: string
  index: number
  channel: string
  value: Serialized
}

type Database = Dexie & {
  settings: Table<string, string>
  conversations: Table<ConversationMetadata, string>
  checkpoints: Table<CheckpointRecord, [string, string, string]>
  writes: Table<WriteRecord, [string, string, string, string, number]>
}

/** Defines application storage without opening it until the first operation. */
export function createDatabase(name = 'arnes'): Database {
  const database = new Dexie(name) as Database

  database.version(1).stores({
    settings: '',
    checkpoints: '[threadId+namespace+id], threadId, [threadId+namespace], id',
    writes: '[threadId+namespace+id+taskId+index], threadId, [threadId+namespace+id]',
  })

  database.version(2).stores({
    conversations: 'threadId',
  })

  return database
}

export const database = createDatabase()
