import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const manifestName = 'deployment-manifest.json'

export type DeploymentManifest = {
  version: 1
  commit: string
  files: Record<string, string>
}

/** Hashes raw file bytes, independent of HTTP compression and filesystem metadata. */
export function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

/** Collects a stable file inventory and rejects symlinks that could escape the build. */
export async function collectFiles(directory: string, prefix = ''): Promise<Record<string, string>> {
  const files: Record<string, string> = {}
  const entries = await readdir(directory, { withFileTypes: true })
  entries.sort(compareNames)

  for (const entry of entries) {
    const name = `${prefix}${entry.name}`
    const path = join(directory, entry.name)

    if (name === manifestName) continue
    if (entry.isDirectory()) Object.assign(files, await collectFiles(path, `${name}/`))
    else if (entry.isFile()) files[name] = sha256(await readFile(path))
    else throw new Error(`Unsupported build entry: ${name}`)
  }

  return files
}

/** Uses code-point ordering so manifests do not depend on the runner's locale. */
function compareNames(left: { name: string }, right: { name: string }): number {
  return left.name < right.name ? -1 : left.name > right.name ? 1 : 0
}

/** Validates signed data before using its paths for network or filesystem access. */
export function parseManifest(bytes: Uint8Array, commit: string): DeploymentManifest {
  const manifest = JSON.parse(new TextDecoder().decode(bytes)) as DeploymentManifest

  if (!manifest || manifest.version !== 1 || manifest.commit !== commit || !manifest.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files)) {
    throw new Error('Unexpected manifest version, commit, or file inventory')
  }

  for (const [path, digest] of Object.entries(manifest.files)) {
    if (!/^[a-zA-Z0-9_./-]+$/.test(path) || path.startsWith('/') || path === manifestName) {
      throw new Error(`Unsafe manifest path: ${path}`)
    }
    for (const segment of path.split('/')) {
      if (!segment || segment === '.' || segment === '..') throw new Error(`Unsafe manifest path: ${path}`)
    }
    if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) throw new Error(`Invalid digest: ${path}`)
  }

  if (!Object.hasOwn(manifest.files, 'index.html')) throw new Error('Missing index.html')
  return manifest
}
