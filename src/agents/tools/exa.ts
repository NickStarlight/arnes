import { tool } from 'langchain'
import { searchExa } from '@/libs/exa/search.ts'
import { getExaContents } from '@/libs/exa/get-contents.ts'

/** Creates the Exa tool set using caller-supplied credentials. */
export function createExaTools(apiKey: string, onCost?: (cost: number | undefined) => void) {
  return [createExaSearchTool(apiKey, onCost), createExaContentsTool(apiKey, onCost)]
}

/** Keeps credentials outside model-visible arguments and returns sources for citations. */
export function createExaSearchTool(apiKey: string, onCost?: (cost: number | undefined) => void) {
  return tool(
    /** Forwards agent cancellation to the search request. */
    async ({ query }: { query: string }, config) => {
      const { results, cost } = await searchExa(query, apiKey, config.signal)
      onCost?.(cost)

      return results
    },
    {
      name: 'exa_search',
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
export function createExaContentsTool(apiKey: string, onCost?: (cost: number | undefined) => void) {
  return tool(
    /** Forwards cancellation while preserving successful pages and per-URL failure statuses. */
    async ({ urls }: { urls: string[] }, config) => {
      const { results, statuses, cost } = await getExaContents(urls, apiKey, config.signal)
      onCost?.(cost)

      return { results, statuses }
    },
    {
      name: 'exa_contents',
      description: 'Read the text of specific web page URLs supplied by the user or found through search. Use when full page content is needed beyond search excerpts. Check statuses for failed pages and cite source URLs.',
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
