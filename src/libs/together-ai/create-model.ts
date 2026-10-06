import { ChatTogetherAI } from '@langchain/together-ai'

/** Creates a model with retries delegated to agent middleware to avoid nested retry loops. */
export function createTogetherModel(model: string, apiKey: string): ChatTogetherAI {
  return new ChatTogetherAI({ model, apiKey, maxRetries: 0 })
}
