import { database } from '@/libs/dexie/database.ts'

/** Loads the accumulated charge independently of compacted agent history. */
export async function getConversationCost(threadId: string): Promise<number> {
  return (await database.conversations.get(threadId))?.totalCost ?? 0
}

/** Adds a completed operation atomically, preserving concurrent title and pin edits. */
export async function addConversationCost(threadId: string, cost: number): Promise<number> {
  return database.transaction('rw', database.conversations,
    /** Reads the latest total inside the write transaction to prevent lost increments. */
    async () => {
      const existing = await database.conversations.get(threadId)
      const totalCost = (existing?.totalCost ?? 0) + cost
      await database.conversations.put({ ...existing, threadId, totalCost })
      return totalCost
    },
  )
}
