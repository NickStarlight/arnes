import { readDataSnapshot } from '@/libs/dexie/data-control.ts'

/** Tags checkpoint bytes explicitly so JSON preserves their type and byte order. */
function serializeBytes(_key: string, value: unknown): unknown {
  if (value instanceof Uint8Array) return { type: 'Uint8Array', data: Array.from(value) }
  return value
}

/** Downloads a complete device backup, including credentials, then releases its object URL. */
export async function exportData(): Promise<void> {
  const snapshot = await readDataSnapshot()
  const blob = new Blob([JSON.stringify(snapshot, serializeBytes, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `arnes-data-${snapshot.exportedAt.replace(/[:.]/g, '-')}.json`
  document.body.append(link)

  try {
    link.click()
  } finally {
    link.remove()
    // Give the browser time to consume the download before releasing the blob.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
}
