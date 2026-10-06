import { i18n } from '@/i18n.ts'
import '@/components/home-content.ts'
import '@/components/app-header.ts'
import '@/components/chat/arnes-shell.ts'
import '@/components/conversations/conversation-list.ts'
import '@/components/settings/general-settings.ts'
import '@/components/settings/assistant-settings.ts'
import '@/components/settings/providers-settings.ts'
import '@/components/settings/search-engine-settings.ts'
import '@/components/settings/data-control-settings.ts'
import '@/components/settings/about-settings.ts'

type View = Readonly<{ title: string, content: string }>

const views: Record<string, View> = {
  home: {
    title: 'arnes',
    content: '<main class="app-messages app-page home-page"><home-content></home-content></main>',
  },
  chat: {
    title: 'arnes',
    content: '<arnes-shell></arnes-shell>',
  },
  conversations: {
    title: i18n._('Conversations | arnes'),
    content: `<app-header></app-header><main class="app-messages app-page">
      <h1>${i18n._('Conversations')}</h1>
      <conversation-list></conversation-list>
    </main>`,
  },
  settings: {
    title: i18n._('Settings | arnes'),
    content: `<app-header></app-header><main class="app-messages app-page settings-page">
      <h1>${i18n._('Settings')}</h1>
      <general-settings></general-settings>
      <assistant-settings></assistant-settings>
      <providers-settings></providers-settings>
      <search-engine-settings></search-engine-settings>
      <data-control-settings></data-control-settings>
      <about-settings></about-settings>
    </main>`,
  },
}

/** Limits navigation to the application's named views without involving URLs. */
export function getView(name: string): View | undefined {
  return Object.hasOwn(views, name) ? views[name] : undefined
}
