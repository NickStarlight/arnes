import { i18n } from '@/i18n.ts'

type ModelBrand = {
  label: string
  logo: string
  width: number
  height: number
}

export type ModelOption = {
  id: string
  label: string
  brand: ModelBrand
  description: string
  website: string
}

type ModelProvider = {
  id: string
  label: string
  models: ModelOption[]
}

const openai: ModelBrand = { label: 'OpenAI', logo: 'openai', width: 90, height: 24 }
const anthropic: ModelBrand = { label: 'Anthropic', logo: 'anthropic', width: 143, height: 16 }
const deepseek: ModelBrand = { label: 'DeepSeek', logo: 'deepseek', width: 40, height: 40 }
const zai: ModelBrand = { label: 'Z.ai', logo: 'z-ai', width: 40, height: 40 }
const meta: ModelBrand = { label: 'Meta', logo: 'meta', width: 40, height: 40 }
const thinkingMachines: ModelBrand = {
  label: 'Thinking Machines Lab',
  logo: 'thinking-machines',
  width: 105,
  height: 38,
}
const minimax: ModelBrand = { label: 'MiniMax', logo: 'minimax', width: 40, height: 40 }
const qwen: ModelBrand = { label: 'Qwen', logo: 'qwen', width: 40, height: 40 }
const prismMl: ModelBrand = { label: 'Prism ML', logo: 'prism-ml', width: 40, height: 40 }

export const modelProviders: ModelProvider[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    models: [
      {
        id: 'gpt-6-astra', label: 'GPT-6 Astra', brand: openai,
        description: i18n._('Advanced reasoning for complex coding, research, and problem solving.'),
        website: 'https://openai.com/index/gpt-6-astra/',
      },
      {
        id: 'gpt-6.1-sol', label: 'GPT-6.1 Sol', brand: openai,
        description: i18n._('Balances capability and cost for coding and everyday work.'),
        website: 'https://developers.openai.com/api/docs/models/gpt-6.1-sol',
      },
      {
        id: 'gpt-6-luna', label: 'GPT-6 Luna', brand: openai,
        description: i18n._('A fast, economical model for everyday tasks and high-volume requests.'),
        website: 'https://developers.openai.com/api/docs/models/gpt-6-luna',
      },
    ],
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    models: [
      {
        id: 'claude-fable-5-1', label: 'Claude Fable 5.1', brand: anthropic,
        description: i18n._('Built for complex coding, knowledge work, and sustained problem solving.'),
        website: 'https://www.anthropic.com/claude-fable-and-mythos-5-1',
      },
      {
        id: 'claude-opus-5-5', label: 'Claude Opus 5.5', brand: anthropic,
        description: i18n._('A capable Claude model for demanding coding and professional work.'),
        website: 'https://www.anthropic.com/claude/opus',
      },
      {
        id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', brand: anthropic,
        description: i18n._('A faster, lower-cost alternative to Opus for everyday work.'),
        website: 'https://www.anthropic.com/claude-sonnet-5-5',
      },
      {
        id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', brand: anthropic,
        description: i18n._('A small, fast Claude model for responsive chat and efficient coding.'),
        website: 'https://www.anthropic.com/news/claude-haiku-4-5',
      },
    ],
  },
  {
    id: 'together-ai',
    label: 'Together AI',
    models: [
      {
        id: 'deepseek-ai/DeepSeek-V4.1-Flash', label: 'DeepSeek V4.1 Flash', brand: deepseek,
        description: i18n._('A compact DeepSeek model focused on speed and efficiency.'),
        website: 'https://deepseek.com/en/news/',
      },
      {
        id: 'zai-org/GLM-5.3', label: 'GLM 5.3', brand: zai,
        description: i18n._('Z.ai’s flagship open GLM model for reasoning, coding, and agent workflows.'),
        website: 'https://huggingface.co/zai-org/GLM-5.3',
      },
      {
        id: 'zai-org/GLM-5.3-Flash', label: 'GLM 5.3 Flash', brand: zai,
        description: i18n._('An open GLM model from Z.ai for reasoning and coding.'),
        website: 'https://huggingface.co/zai-org/GLM-5.3-Flash',
      },
      {
        id: 'zai-org/GLM-5.2', label: 'GLM 5.2', brand: zai,
        description: i18n._('A previous-generation open GLM model from Z.ai for reasoning and coding.'),
        website: 'https://huggingface.co/zai-org/GLM-5.2',
      },
      {
        id: 'deepseek-ai/DeepSeek-V4-Pro-0813', label: 'DeepSeek V4 Pro 0813', brand: deepseek,
        description: i18n._('DeepSeek’s Pro-tier V4 model for demanding reasoning and coding work.'),
        website: 'https://deepseek.com/en/news/',
      },
      {
        id: 'meta-models/Muse-Glimmer-30B', label: 'Muse Glimmer 30B', brand: meta,
        description: i18n._('Meta’s open 30-billion-parameter model, built for agent workflows.'),
        website: 'https://dev.meta.ai/models/muse-glimmer',
      },
      {
        id: 'Qwen/Qwen3.8-2.4T-A95B', label: 'Qwen3.8 2.4T-A95B', brand: qwen,
        description: i18n._('A large mixture-of-experts Qwen model with 95 billion active parameters.'),
        website: 'https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B',
      },
      {
        id: 'deepseek-ai/DeepSeek-V4-Flash-0731', label: 'DeepSeek V4 Flash 0731', brand: deepseek,
        description: i18n._('A fast, low-cost DeepSeek V4 model for everyday tasks.'),
        website: 'https://deepseek.com/en/news/',
      },
      {
        id: 'thinkingmachines/Inkling', label: 'Inkling FP4', brand: thinkingMachines,
        description: i18n._('An open model from Thinking Machines Lab for reasoning, coding, and tool use.'),
        website: 'https://thinkingmachines.ai/inkling/',
      },
      {
        id: 'MiniMaxAI/MiniMax-M3', label: 'MiniMax M3', brand: minimax,
        description: i18n._('A MiniMax model built for coding, long-context tasks, and agent workflows.'),
        website: 'https://www.minimax.io/blog/minimax-m3',
      },
      {
        id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', brand: openai,
        description: i18n._('OpenAI’s open-weight 120-billion-parameter model for reasoning and tool use.'),
        website: 'https://huggingface.co/openai/gpt-oss-120b',
      },
      {
        id: 'Qwen/Qwen3.5-9B', label: 'Qwen3.5 9B FP8', brand: qwen,
        description: i18n._('A compact 9-billion-parameter model from the Qwen3.5 family.'),
        website: 'https://huggingface.co/Qwen/Qwen3.5-9B',
      },
      {
        id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Instruct Turbo', brand: meta,
        description: i18n._('Meta’s instruction-tuned 70-billion-parameter model, optimized for speed.'),
        website: 'https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct',
      },
      {
        id: 'prism-ml/Ternary-Bonsai-27B', label: 'Ternary Bonsai 27B', brand: prismMl,
        description: i18n._('A free ternary-quantized 27-billion-parameter model from Prism ML.'),
        website: 'https://huggingface.co/prism-ml/Ternary-Bonsai-27B',
      },
    ],
  },
]

/** Resolves only catalogued selections, keeping stale or empty model IDs out of the preview. */
export function getModelOption(providerId: string | undefined, modelId: string): ModelOption | undefined {
  for (const provider of modelProviders) {
    if (provider.id !== providerId) continue
    for (const model of provider.models) {
      if (model.id === modelId) return model
    }
  }
}
