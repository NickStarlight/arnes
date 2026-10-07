import type { CreateAgentParams } from 'langchain'
import { createTavilyTools } from '@/agents/tools/tavily.ts'

export type ToolConfig = {
  tavily?: { apiKey: string }
}

/** Composes integration tools from caller-supplied credentials without accessing storage. */
export function createTools(config: ToolConfig) {
  const tools: NonNullable<CreateAgentParams['tools']> = []

  if (config.tavily) tools.push(...createTavilyTools(config.tavily.apiKey))

  return tools
}
