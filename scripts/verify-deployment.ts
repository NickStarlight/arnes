import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { collectFiles, manifestName, parseManifest, sha256, type DeploymentManifest } from './deployment-manifest.ts'
import { download, verifyAttestation } from './libs/deployment.ts'

/** Authenticates the exact downloaded manifest before trusting any of its contents. */
async function authenticate(bytes: Uint8Array, repository: string, commit: string): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), 'arnes-verification-'))

  try {
    const path = join(directory, manifestName)
    await writeFile(path, bytes)
    verifyAttestation(path, repository, commit)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

/** Checks directory indexes at their visitor-facing URLs and other files at their declared paths. */
async function verifyLiveFiles(base: URL, manifest: DeploymentManifest): Promise<void> {
  for (const [path, digest] of Object.entries(manifest.files)) {
    const route = path === 'index.html' || path.endsWith('/index.html') ? path.slice(0, -10) : path
    const bytes = await download(new URL(route, base))
    if (sha256(bytes) !== digest) throw new Error(`Deployed file differs: ${path}`)
  }
}

/** Optionally verifies an independent rebuild, including its complete file inventory. */
async function verifyRebuild(directory: string, manifest: DeploymentManifest): Promise<void> {
  const files = await collectFiles(directory)
  if (Object.keys(files).length !== Object.keys(manifest.files).length) {
    throw new Error('Rebuild file inventory differs')
  }

  for (const [path, digest] of Object.entries(manifest.files)) {
    if (files[path] !== digest) throw new Error(`Rebuilt file differs: ${path}`)
  }
}

/** Requires an independently chosen commit so an older signed deployment cannot silently pass. */
async function main(): Promise<void> {
  const [address, repository, commit, rebuildDirectory] = Deno.args
  if (!address || !repository || !/^[\w.-]+\/[\w.-]+$/.test(repository) || !commit || !/^[a-f0-9]{40}$/.test(commit)) {
    throw new Error('Usage: deno run -A scripts/verify-deployment.ts <site-url> <owner/repo> <full-commit-sha> [rebuild-directory]')
  }

  const base = new URL(address)
  if (base.search || base.hash || base.username || base.password) throw new Error('Use a plain site base URL')
  if (!base.pathname.endsWith('/')) base.pathname += '/'

  const bytes = await download(new URL(manifestName, base))
  await authenticate(bytes, repository, commit)
  const manifest = parseManifest(bytes, commit)
  await verifyLiveFiles(base, manifest)
  if (rebuildDirectory) await verifyRebuild(rebuildDirectory, manifest)

  console.log(`Verified ${Object.keys(manifest.files).length} deployed files for ${repository}@${commit}`)
}

await main()
