import { execFileSync } from 'node:child_process'

/** Fetches fresh HTTPS bytes without following redirects to a different resource. */
export async function download(url: URL): Promise<Uint8Array> {
  if (url.protocol !== 'https:') throw new Error('Deployment verification requires HTTPS')
  const response = await fetch(url, {
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
  return new Uint8Array(await response.arrayBuffer())
}

/** Delegates signature validation to GitHub CLI with explicit repository, workflow, and commit constraints. */
export function verifyAttestation(path: string, repository: string, commit: string): void {
  execFileSync('gh', [
    'attestation', 'verify', path,
    '--repo', repository,
    '--signer-workflow', `${repository}/.github/workflows/pages.yml`,
    '--signer-digest', commit,
    '--source-digest', commit,
    '--source-ref', 'refs/heads/main',
    '--deny-self-hosted-runners',
  ], { stdio: 'inherit' })
}
