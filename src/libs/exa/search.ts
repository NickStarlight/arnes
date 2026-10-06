import { readExaCost } from '@/libs/exa/cost.ts'

export interface ExaSearchResult {
  title?: string | null
  url: string
  highlights?: string[]
}

/** Retrieves source excerpts for the agent using Exa's recommended search request. */
export async function searchExa(query: string, apiKey: string, signal?: AbortSignal) {
  if (!query.trim()) throw new Error('A search query is required')
  if (!apiKey.trim()) throw new Error('An Exa API key is required')

  const timeout = AbortSignal.timeout(30000)
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ query: query.trim(), contents: { highlights: true } }),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  })

  if (!response.ok) throw new Error(`Exa search failed: HTTP ${response.status}`)

  const data = await response.json()

  if (!data || !Array.isArray(data.results)) throw new Error('Invalid Exa search response')

  const results: ExaSearchResult[] = []

  for (const result of data.results) {
    if (!result || typeof result.url !== 'string') throw new Error('Invalid Exa search result')

    const highlights: string[] = []

    if (Array.isArray(result.highlights)) {
      for (const highlight of result.highlights) {
        if (typeof highlight === 'string') highlights.push(highlight)
      }
    }

    results.push({
      url: result.url,
      title: typeof result.title === 'string' ? result.title : null,
      highlights,
    })
  }

  return { results, cost: readExaCost(data.costDollars) }
}
