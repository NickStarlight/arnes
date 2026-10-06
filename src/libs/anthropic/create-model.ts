import { ChatAnthropic } from '@langchain/anthropic'

/** Enables Anthropic's browser-access header while leaving retries to agent middleware. */
export function createAnthropicModel(model: string, apiKey: string): ChatAnthropic {
  return new ChatAnthropic({
    model,
    apiKey,
    maxRetries: 0,
    clientOptions: {
      dangerouslyAllowBrowser: true,
      defaultHeaders: { 'anthropic-dangerous-direct-browser-access': 'true' },
    },
  })
}
