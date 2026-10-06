import type { AgentModel } from '@/agents/middleware.ts'
import { createAnthropicModel } from '@/libs/anthropic/create-model.ts'
import { createOpenAIModel } from '@/libs/openai/create-model.ts'
import { createTogetherModel } from '@/libs/together-ai/create-model.ts'

type ModelFactory = (model: string, apiKey: string) => AgentModel

export const modelFactories: Record<string, ModelFactory> = {
  openai: createOpenAIModel,
  anthropic: createAnthropicModel,
  'together-ai': createTogetherModel,
}
