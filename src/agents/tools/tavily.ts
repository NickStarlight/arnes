import { tool } from 'langchain'
import { searchTavily } from '@/libs/tavily/search.ts'
import { extractTavily } from '@/libs/tavily/extract.ts'

/** Creates the Tavily tool set using caller-supplied credentials. */
export function createTavilyTools(apiKey: string) {
  return [createTavilySearchTool(apiKey), createTavilyExtractTool(apiKey)]
}

/** Keeps credentials outside model-visible arguments and returns sources for citations. */
export function createTavilySearchTool(apiKey: string) {
  return tool(
    /** Forwards agent cancellation to the search request. */
    async ({ query }: { query: string }, config) => {
      const { results } = await searchTavily(query, apiKey, config.signal)

      return results
    },
    {
      name: 'tavily_search',
      description: 'Search the web for source excerpts and URLs. Use these sources to ground answers and cite their URLs.',
      schema: {
        type: 'object',
        properties: { query: { type: 'string', minLength: 1, description: 'Natural-language web search query' } },
        required: ['query'],
        additionalProperties: false,
      },
    },
  )
}

/** Reads known pages when search excerpts are insufficient, with credentials kept outside arguments. */
export function createTavilyExtractTool(apiKey: string) {
  return tool(
    /** Forwards cancellation while preserving successful pages and per-URL failure statuses. */
    async ({ urls }: { urls: string[] }, config) => {
      const { results, failures } = await extractTavily(urls, apiKey, config.signal)

      return { results, failures }
    },
    {
      name: 'tavily_extract',
      description: 'Read the text of specific web page URLs supplied by the user or found through search. Use when full page content is needed beyond search excerpts. Check failures for pages that could not be read and cite source URLs.',
      schema: {
        type: 'object',
        properties: {
          urls: { type: 'array', minItems: 1, items: { type: 'string', format: 'uri' } },
        },
        required: ['urls'],
        additionalProperties: false,
      },
    },
  )
}
