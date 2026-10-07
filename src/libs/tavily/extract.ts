export interface TavilyExtractResult {
  url: string
  title: string | null
  content: string
}

export interface TavilyExtractFailure {
  url: string
  error: string
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
export async function extractTavily(urls: string[], apiKey: string, signal?: AbortSignal) {
  validateUrls(urls)
  if (!apiKey.trim()) throw new Error('A Tavily API key is required')

  const timeout = AbortSignal.timeout(30000)
  const response = await fetch('https://api.tavily.com/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ urls }),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  })

  if (!response.ok) throw new Error(`Tavily extract failed: HTTP ${response.status}`)

  const data = await response.json()

  if (!data || !Array.isArray(data.results)) throw new Error('Invalid Tavily extract response')

  const results: TavilyExtractResult[] = []
  const failures: TavilyExtractFailure[] = []

  for (const result of data.results) {
    if (!result || typeof result.url !== 'string') throw new Error('Invalid Tavily extract result')

    results.push({
      url: result.url,
      title: typeof result.title === 'string' ? result.title : null,
      content: typeof result.raw_content === 'string' ? result.raw_content : '',
    })
  }

  if (Array.isArray(data.failed_results)) {
    for (const failure of data.failed_results) {
      if (!failure || typeof failure.url !== 'string') continue

      failures.push({
        url: failure.url,
        error: typeof failure.error === 'string' ? failure.error : 'Unknown error',
      })
    }
  }

  return { results, failures }
}
