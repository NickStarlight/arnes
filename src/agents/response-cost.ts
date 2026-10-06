import { readContextUsage } from '@/agents/context-usage.ts'
import { estimateContextCost } from '@/agents/context-cost.ts'

/** Tracks completed calls, including tool-loop requests and automatic summaries, once per run. */
export function createResponseCost(model: string) {
  let total = 0
  let available = true
  const completed = new Set<string>()

  /** Adds tool charges without exposing billing metadata to the model. */
  function addToolCost(cost: number | undefined): void {
    if (cost === undefined) available = false
    else total += cost
  }

  /** Uses complete generation metadata instead of charging each streamed chunk. */
  function handleLLMEnd(output: { generations: { text: string, message?: unknown }[][] }, runId: string): void {
    if (completed.has(runId)) return
    completed.add(runId)
    for (const generations of output.generations) {
      for (const generation of generations) {
        const cost = estimateContextCost(readContextUsage(generation.message, model))
        if (cost === undefined) available = false
        else total += cost
      }
    }
  }

  /** Withholds partial totals when required provider usage is missing. */
  function value(): number | undefined {
    return available && completed.size > 0 ? total : undefined
  }

  return { callbacks: [{ handleLLMEnd, awaitHandlers: true }], addToolCost, value }
}
