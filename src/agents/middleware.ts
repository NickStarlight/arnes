import { modelRetryMiddleware, summarizationMiddleware, type AnyAgentMiddleware, type SummarizationMiddlewareConfig } from 'langchain'
import type { ChatAnthropic } from '@langchain/anthropic'
import type { ChatOpenAI } from '@langchain/openai'
import type { ChatTogetherAI } from '@langchain/together-ai'
import { getContextWindow } from '@/agents/model-context.ts'

export type AgentModel = ChatAnthropic | ChatOpenAI | ChatTogetherAI

/** Compacts only when the estimated history reaches the selected model's verified context window. */
export function createAgentMiddleware(model: AgentModel, modelId: string): AnyAgentMiddleware[] {
  const contextWindow = getContextWindow(modelId)
  if (!contextWindow) throw new Error(`Unknown context window: ${modelId}`)

  const summary: SummarizationMiddlewareConfig = {
    model,
    trigger: { tokens: contextWindow },
    keep: { tokens: 4000 },
  }

  return [
    summarizationMiddleware(summary),
    modelRetryMiddleware({
      maxRetries: 2,
      initialDelayMs: 1000,
      backoffFactor: 2,
      maxDelayMs: 4000,
      onFailure: 'error',
    }),
  ]
}
