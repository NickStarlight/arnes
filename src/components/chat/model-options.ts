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
        id: 'zai-org/GLM-5.3-Flash', label: 'GLM 5.3 Flash', brand: zai,
        description: i18n._('An open GLM model from Z.ai for reasoning and coding.'),
        website: 'https://huggingface.co/zai-org/GLM-5.3-Flash',
      },
      {
        id: 'meta-models/Muse-Glimmer-30B', label: 'Muse Glimmer 30B', brand: meta,
        description: i18n._('Meta’s open 30-billion-parameter model, built for agent workflows.'),
        website: 'https://dev.meta.ai/models/muse-glimmer',
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
        id: 'Qwen/Qwen3.5-9B', label: 'Qwen3.5 9B FP8', brand: qwen,
        description: i18n._('A compact 9-billion-parameter model from the Qwen3.5 family.'),
        website: 'https://huggingface.co/Qwen/Qwen3.5-9B',
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
