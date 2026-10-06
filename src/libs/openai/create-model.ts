import { ChatOpenAI } from '@langchain/openai'

/** Enables direct browser requests with the user's key and delegates retries to agent middleware. */
export function createOpenAIModel(model: string, apiKey: string): ChatOpenAI {
  return new ChatOpenAI({
    model,
    apiKey,
    maxRetries: 0,
    useResponsesApi: true,
    configuration: { dangerouslyAllowBrowser: true },
  })
}
