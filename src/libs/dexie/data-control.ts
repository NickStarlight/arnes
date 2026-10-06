import { database } from '@/libs/dexie/database.ts'

/** Captures every table in one read transaction, preserving out-of-line settings keys. */
export async function readDataSnapshot() {
  return database.transaction('r', database.tables, async () => {
    const tables: Record<string, { keys: unknown[], values: unknown[] }> = {}

    for (const table of database.tables) {
      tables[table.name] = {
        keys: await table.toCollection().primaryKeys(),
        values: await table.toArray(),
      }
    }

    return { formatVersion: 1, exportedAt: new Date().toISOString(), tables }
  })
}

/** Clears all application tables atomically so a failure cannot leave a partial wipe. */
export async function wipeData(): Promise<void> {
  await database.transaction('rw', database.tables, async () => {
    for (const table of database.tables) await table.clear()
  })
}
