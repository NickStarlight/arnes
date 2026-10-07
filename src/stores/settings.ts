import { database } from '@/libs/dexie/database.ts'

export type AssistantSetting = 'basePrompt' | 'memory'
export type ChatPreference = 'model' | 'effort'
export type LanguagePreference = '' | 'en' | 'pt-BR'
export type ThemePreference = 'system' | 'light' | 'dark'
export type LastView = Readonly<{ name: string, threadId?: string }>

/** Preserves explicit legacy light selections and follows the system when unset. */
export async function getThemePreference(): Promise<ThemePreference> {
  const value = await database.settings.get('arnes:general:theme')
  if (value === 'default') return 'light'
  return value === 'light' || value === 'dark' ? value : 'system'
}

/** Persists the selected bundled theme with the other device preferences. */
export async function saveThemePreference(value: ThemePreference): Promise<void> {
  await database.settings.put(value, 'arnes:general:theme')
}

/** Treats absent or unsupported preferences as automatic browser-language selection. */
export async function getLanguagePreference(): Promise<LanguagePreference> {
  const value = await database.settings.get('arnes:general:language')

  return value === 'en' || value === 'pt-BR' ? value : ''
}

/** Stores an empty value for automatic selection, keeping language with other device settings. */
export async function saveLanguagePreference(value: LanguagePreference): Promise<void> {
  await database.settings.put(value, 'arnes:general:language')
}

/** Loads a provider's saved key, defaulting to empty when absent. */
export async function getProviderKey(provider: string): Promise<string> {
  return await database.settings.get(`arnes:providers:${provider}:apiKey`) ?? ''
}

/** Normalizes surrounding whitespace without changing the credential itself. */
export async function saveProviderKey(provider: string, value: string): Promise<void> {
  await database.settings.put(value.trim(), `arnes:providers:${provider}:apiKey`)
}

/** Defaults absent assistant text to empty while preserving saved whitespace. */
export async function getAssistantSetting(field: AssistantSetting): Promise<string> {
  return await database.settings.get(`arnes:assistant:${field}`) ?? ''
}

/** Preserves intentionally empty instructions and memory. */
export async function saveAssistantSetting(field: AssistantSetting, value: string): Promise<void> {
  await database.settings.put(value, `arnes:assistant:${field}`)
}

/** Supplies composer defaults when a preference has never been saved. */
export async function getChatPreference(field: ChatPreference): Promise<string> {
  return await database.settings.get(`arnes:chat:${field}`) ?? (field === 'effort' ? 'medium' : '')
}

/** Persists the selected model or effort before reporting success to the composer. */
export async function saveChatPreference(field: ChatPreference, value: string): Promise<void> {
  await database.settings.put(value, `arnes:chat:${field}`)
}

/** Restores the view active before a reload, rejecting entries that are not a named view with an optional thread. */
export async function getLastView(): Promise<LastView | undefined> {
  const raw = await database.settings.get('arnes:app:view')
  if (!raw) return undefined

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return undefined

    const { name, threadId } = parsed as Record<string, unknown>
    if (typeof name !== 'string' || !name) return undefined
    if (threadId !== undefined && typeof threadId !== 'string') return undefined

    return threadId === undefined ? { name } : { name, threadId }
  } catch {
    return undefined
  }
}

/** Remembers the active view so reloading returns to it instead of the landing page. */
export async function saveLastView(view: LastView): Promise<void> {
  await database.settings.put(JSON.stringify(view), 'arnes:app:view')
}
