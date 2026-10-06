export type ContextUsage = Readonly<{
  model: string
  tokens: number
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number
  cacheWriteTokens?: number
  longCacheWriteTokens?: number
  responseCost?: number
  estimated?: boolean
}>

export type ChatStreamEvent = string | ContextUsage

/** Narrows external metadata before accessing fields shared by messages and streamed chunks. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Validates provider metadata at the boundary without relying on LangChain's generic message types. */
export function readContextUsage(message: unknown, model?: string): ContextUsage | undefined {
  if (!isRecord(message)) return

  const usage = message.usage_metadata
  if (!isRecord(usage)) return
  const input = usage.input_tokens
  const output = usage.output_tokens
  if (typeof input !== 'number' || typeof output !== 'number' || input < 0 || output < 0) return

  const metadata = isRecord(message.response_metadata) ? message.response_metadata : {}
  const extra = isRecord(message.additional_kwargs) ? message.additional_kwargs : {}
  const modelId = model ?? metadata.model_name ?? metadata.model ?? extra.model
  if (typeof modelId !== 'string') return

  const tokens = input + output
  if (!Number.isFinite(tokens)) return

  const details = isRecord(usage.input_token_details) ? usage.input_token_details : {}
  const cached = details.cache_read
  const cachedInputTokens = typeof cached === 'number' && Number.isFinite(cached)
    ? Math.max(0, Math.min(cached, input)) : 0

  const rawUsage = isRecord(metadata.usage) ? metadata.usage : {}
  const creation = isRecord(rawUsage.cache_creation) ? rawUsage.cache_creation : {}
  const cacheWriteTokens = tokenCount(details.cache_creation)
  const longCacheWriteTokens = Math.min(cacheWriteTokens, tokenCount(creation.ephemeral_1h_input_tokens))

  return { model: modelId, tokens, inputTokens: input, outputTokens: output, cachedInputTokens, cacheWriteTokens, longCacheWriteTokens }
}

/** Treats omitted cache categories as zero and rejects malformed counters. */
function tokenCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
}
