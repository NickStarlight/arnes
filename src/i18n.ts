import { i18n } from '@lingui/core'
import { messages as english } from '@/locales/en/messages.po'
import { messages as portuguese } from '@/locales/pt-BR/messages.po'
import { getLanguagePreference } from '@/stores/settings.ts'

/** Uses the first supported browser language, falling back to the source language. */
function getLocale(languages: readonly string[]): 'en' | 'pt-BR' {
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0]
    if (base === 'pt') return 'pt-BR'
    if (base === 'en') return 'en'
  }

  return 'en'
}

/** Resolves the saved language before templates render; storage failure preserves browser defaults. */
async function getInitialLocale(): Promise<'en' | 'pt-BR'> {
  try {
    const saved = await getLanguagePreference()
    if (saved) return saved
  } catch {
    // Storage availability must not prevent the interface from rendering.
  }

  return getLocale(navigator.languages)
}

const locale = await getInitialLocale()

i18n.loadAndActivate({ locale, messages: locale === 'pt-BR' ? portuguese : english })
document.documentElement.lang = locale

export { i18n }
