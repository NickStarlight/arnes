import { createAgent } from '@/agents/agent.ts'
import { modelFactories } from '@/agents/model-factories.ts'
import { DexieSaver } from '@/libs/dexie/checkpointer.ts'
import { getProviderKey, getAssistantSetting } from '@/stores/settings.ts'

const checkpointer = new DexieSaver()

/** Composes the chat agent from current saved settings without making a model request. */
export async function createChatAgent(provider: string, model: string) {
  const chatModel = await createChatModel(provider, model)
  const systemPrompt = await loadSystemPrompt()

  return createAgent(chatModel, model, [], systemPrompt, checkpointer)
}

/** Resolves the selected provider and reads its key at creation time so settings stay current. */
export async function createChatModel(provider: string, model: string) {
  if (!Object.hasOwn(modelFactories, provider)) throw new Error(`Unknown model provider: ${provider}`)

  const apiKey = await getProviderKey(provider)

  return modelFactories[provider](model, apiKey)
}

/** Combines saved assistant instructions and memory without modifying either stored value. */
async function loadSystemPrompt(): Promise<string | undefined> {
  const prompt = await getAssistantSetting('basePrompt')
  const memory = await getAssistantSetting('memory')
  const parts: string[] = []

  if (prompt) parts.push(prompt)
  if (memory) parts.push(`Saved memory:\n${memory}`)

  return parts.length ? parts.join('\n\n') : undefined
}
