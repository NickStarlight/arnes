import type { CreateAgentParams } from 'langchain'
import { createExaTools } from '@/agents/tools/exa.ts'

export type ToolConfig = {
  exa?: { apiKey: string }
}

/** Composes integration tools from caller-supplied credentials without accessing storage. */
export function createTools(config: ToolConfig, onCost?: (cost: number | undefined) => void) {
  const tools: NonNullable<CreateAgentParams['tools']> = []

  if (config.exa) tools.push(...createExaTools(config.exa.apiKey, onCost))

  return tools
}
