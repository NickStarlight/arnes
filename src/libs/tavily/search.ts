export interface TavilySearchResult {
  title: string | null
  url: string
  content: string
  score: number | null
}

/** Retrieves source excerpts for the agent using Tavily's search endpoint. */
export async function searchTavily(query: string, apiKey: string, signal?: AbortSignal) {
  if (!query.trim()) throw new Error('A search query is required')
  if (!apiKey.trim()) throw new Error('A Tavily API key is required')

  const timeout = AbortSignal.timeout(30000)
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query: query.trim(), search_depth: 'basic', max_results: 5 }),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  })

  if (!response.ok) throw new Error(`Tavily search failed: HTTP ${response.status}`)

  const data = await response.json()

  if (!data || !Array.isArray(data.results)) throw new Error('Invalid Tavily search response')

  const results: TavilySearchResult[] = []

  for (const result of data.results) {
    if (!result || typeof result.url !== 'string') throw new Error('Invalid Tavily search result')

    results.push({
      url: result.url,
      title: typeof result.title === 'string' ? result.title : null,
      content: typeof result.content === 'string' ? result.content : '',
      score: typeof result.score === 'number' ? result.score : null,
    })
  }

  return { results }
}
