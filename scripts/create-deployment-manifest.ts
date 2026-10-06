import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { collectFiles, manifestName, parseManifest } from './deployment-manifest.ts'

/** Writes the manifest last, excluding itself to avoid a circular hash dependency. */
async function main(): Promise<void> {
  const [directory, commit] = Deno.args
  if (!directory || !commit || !/^[a-f0-9]{40}$/.test(commit)) {
    throw new Error('Usage: deno run -A scripts/create-deployment-manifest.ts <directory> <full-commit-sha>')
  }

  const files = await collectFiles(directory)
  const bytes = new TextEncoder().encode(`${JSON.stringify({ version: 1, commit, files }, null, 2)}\n`)
  parseManifest(bytes, commit)
  await writeFile(join(directory, manifestName), bytes)
}

await main()
