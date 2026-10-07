export type ModelCapability = 'text' | 'vision' | 'audio' | 'tools' | 'reasoning'

export type ModelSpecifications = {
  capabilities: readonly ModelCapability[]
  input: number
  output: number
  cachedInput?: number
  cacheWriteMultiplier?: number
  pricingSource: string
  longContextPricing?: boolean
}

const openaiPricing = 'https://developers.openai.com/api/docs/pricing'
const anthropicPricing = 'https://platform.claude.com/docs/en/about-claude/pricing'
const togetherPricing = 'https://docs.together.ai/docs/serverless/models'
const reasoningVision: readonly ModelCapability[] = ['text', 'vision', 'tools', 'reasoning']

// Standard API rates in USD per million text tokens, checked 2026-10-06.
// OpenAI entries use short-context rates. Together entries use Together's hosted rates.
const specifications: Record<string, ModelSpecifications> = {
  'gpt-6-astra': {
    capabilities: reasoningVision,
    input: 10, output: 50, cachedInput: 1,
    pricingSource: openaiPricing, longContextPricing: true, cacheWriteMultiplier: 1.25,
  },
  'gpt-6.1-sol': {
    capabilities: reasoningVision,
    input: 2, output: 10, cachedInput: 0.1,
    pricingSource: openaiPricing, longContextPricing: true, cacheWriteMultiplier: 1.25,
  },
  'gpt-6-luna': {
    capabilities: reasoningVision,
    input: 0.1, output: 0.5, cachedInput: 0.01,
    pricingSource: openaiPricing, longContextPricing: true, cacheWriteMultiplier: 1.25,
  },
  'claude-fable-5-1': {
    capabilities: reasoningVision,
    input: 10, output: 50, cachedInput: 0.25,
    pricingSource: anthropicPricing, cacheWriteMultiplier: 1.25,
  },
  'claude-opus-5-5': {
    capabilities: reasoningVision,
    input: 4, output: 20, cachedInput: 0.2,
    pricingSource: anthropicPricing, cacheWriteMultiplier: 1.25,
  },
  'claude-sonnet-5-5': {
    capabilities: reasoningVision,
    input: 2, output: 10, cachedInput: 0.2,
    pricingSource: anthropicPricing, cacheWriteMultiplier: 1.25,
  },
  'claude-haiku-4-5-20251001': {
    capabilities: reasoningVision,
    input: 1, output: 5, cachedInput: 0.1,
    pricingSource: anthropicPricing, cacheWriteMultiplier: 1.25,
  },
  'deepseek-ai/DeepSeek-V4.1-Flash': {
    capabilities: reasoningVision,
    input: 0.3, output: 1.2, cachedInput: 0.006,
    pricingSource: togetherPricing,
  },
  'zai-org/GLM-5.3': {
    capabilities: reasoningVision,
    input: 1.4, output: 4.4, cachedInput: 0.26,
    pricingSource: togetherPricing,
  },
  'zai-org/GLM-5.3-Flash': {
    capabilities: reasoningVision,
    input: 0.15, output: 0.5, cachedInput: 0.03,
    pricingSource: togetherPricing,
  },
  'zai-org/GLM-5.2': {
    capabilities: reasoningVision,
    input: 1.4, output: 4.4, cachedInput: 0.26,
    pricingSource: togetherPricing,
  },
  'deepseek-ai/DeepSeek-V4-Pro-0813': {
    capabilities: reasoningVision,
    input: 1.32, output: 3.96, cachedInput: 0.13,
    pricingSource: togetherPricing,
  },
  'meta-models/Muse-Glimmer-30B': {
    capabilities: ['text', 'vision'],
    input: 0.35, output: 1.5, cachedInput: 0.04,
    pricingSource: togetherPricing,
  },
  'Qwen/Qwen3.8-2.4T-A95B': {
    capabilities: reasoningVision,
    input: 2, output: 6, cachedInput: 0.25,
    pricingSource: togetherPricing,
  },
  'deepseek-ai/DeepSeek-V4-Flash-0731': {
    capabilities: reasoningVision,
    input: 0.14, output: 0.28, cachedInput: 0.03,
    pricingSource: togetherPricing,
  },
  'thinkingmachines/Inkling': {
    capabilities: ['text', 'vision', 'audio', 'tools', 'reasoning'],
    input: 1, output: 4.05, cachedInput: 0.17,
    pricingSource: togetherPricing,
  },
  'MiniMaxAI/MiniMax-M3': {
    capabilities: reasoningVision,
    input: 0.3, output: 1.2, cachedInput: 0.06,
    pricingSource: togetherPricing,
  },
  'openai/gpt-oss-120b': {
    capabilities: ['text', 'tools', 'reasoning'],
    input: 0.15, output: 0.6,
    pricingSource: togetherPricing,
  },
  'Qwen/Qwen3.5-9B': {
    capabilities: reasoningVision,
    input: 0.17, output: 0.25,
    pricingSource: togetherPricing,
  },
  'meta-llama/Llama-3.3-70B-Instruct-Turbo': {
    capabilities: ['text', 'tools'],
    input: 1.04, output: 1.04,
    pricingSource: togetherPricing,
  },
  'prism-ml/Ternary-Bonsai-27B': {
    capabilities: ['text'],
    input: 0, output: 0,
    pricingSource: togetherPricing,
  },
}

/** Leaves unknown models without estimates instead of displaying another model's rates. */
export function getModelSpecifications(modelId: string): ModelSpecifications | undefined {
  return Object.hasOwn(specifications, modelId) ? specifications[modelId] : undefined
}
