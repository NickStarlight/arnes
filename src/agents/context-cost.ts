import { getModelSpecifications } from '@/agents/model-specifications.ts'
import type { ContextUsage } from '@/agents/context-usage.ts'

/** Prices each request separately so cache tiers and long-context rates apply before aggregation. */
export function estimateContextCost(usage?: ContextUsage): number | undefined {
  if (!usage || usage.estimated) return
  const rates = getModelSpecifications(usage.model)
  if (!rates) return

  const longContext = rates.longContextPricing && usage.inputTokens > 272000
  const inputMultiplier = longContext ? 2 : 1
  const outputMultiplier = longContext ? 1.5 : 1
  const writes = usage.cacheWriteTokens ?? 0
  const longWrites = usage.longCacheWriteTokens ?? 0
  const uncached = Math.max(0, usage.inputTokens - usage.cachedInputTokens - writes)
  const writeCost = (writes - longWrites) * rates.input * (rates.cacheWriteMultiplier ?? 1)
    + longWrites * rates.input * 2
  const input = (uncached * rates.input + usage.cachedInputTokens * (rates.cachedInput ?? rates.input) + writeCost) * inputMultiplier
  return (input + usage.outputTokens * rates.output * outputMultiplier) / 1000000
}
