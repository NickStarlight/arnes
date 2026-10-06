// Provider context windows checked 2026-10-05.
// OpenAI: https://developers.openai.com/api/docs/models/{model-id}
// Anthropic: https://platform.claude.com/docs/en/models/overview
// Together: https://docs.together.ai/docs/serverless/models
const contextWindows: Readonly<Record<string, number>> = {
  'gpt-6-astra': 1050000,
  'gpt-6.1-sol': 1050000,
  'gpt-6-luna': 1050000,
  'claude-fable-5-1': 1000000,
  'claude-opus-5-5': 1000000,
  'claude-sonnet-5-5': 1000000,
  'claude-haiku-4-5-20251001': 200000,
  'deepseek-ai/DeepSeek-V4.1-Flash': 1000000,
  'zai-org/GLM-5.3-Flash': 1048575,
  'meta-models/Muse-Glimmer-30B': 131072,
  'thinkingmachines/Inkling': 524288,
  'MiniMaxAI/MiniMax-M3': 524288,
  'Qwen/Qwen3.5-9B': 262144,
}

/** Shares verified limits between the context meter and automatic compaction. */
export function getContextWindow(model: string): number | undefined {
  return Object.hasOwn(contextWindows, model) ? contextWindows[model] : undefined
}
