import { readExaCost } from '@/libs/exa/cost.ts'

export interface ExaPageContent {
  url: string
  title: string | null
  text: string
}

export interface ExaContentStatus {
  id: string
  status: string
}

/** Rejects empty requests and URLs that cannot identify web pages. */
function validateUrls(urls: string[]): void {
  if (!urls.length) throw new Error('At least one page URL is required')

  for (const value of urls) {
    const url = new URL(value)

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('Page URLs must use HTTP or HTTPS')
    }
  }
}

/** Reads full page text for known URLs, preserving per-URL failures even on HTTP 200. */
export async function getExaContents(urls: string[], apiKey: string, signal?: AbortSignal) {
  validateUrls(urls)
  if (!apiKey.trim()) throw new Error('An Exa API key is required')

  const timeout = AbortSignal.timeout(30000)
  const response = await fetch('https://api.exa.ai/contents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ urls, text: true }),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  })

  if (!response.ok) throw new Error(`Exa contents failed: HTTP ${response.status}`)

  const data = await response.json()

  if (!data || !Array.isArray(data.results) || !Array.isArray(data.statuses)) {
    throw new Error('Invalid Exa contents response')
  }

  const results: ExaPageContent[] = []
  const statuses: ExaContentStatus[] = []

  for (const status of data.statuses) {
    if (!status || typeof status.id !== 'string' || typeof status.status !== 'string') {
      throw new Error('Invalid Exa page status')
    }

    statuses.push({ id: status.id, status: status.status })
  }

  for (const result of data.results) {
    if (!result || typeof result.url !== 'string') throw new Error('Invalid Exa page content')

    results.push({
      url: result.url,
      title: typeof result.title === 'string' ? result.title : null,
      text: typeof result.text === 'string' ? result.text : '',
    })
  }

  return { results, statuses, cost: readExaCost(data.costDollars) }
}
