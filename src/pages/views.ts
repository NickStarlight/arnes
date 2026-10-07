import { i18n } from '@/i18n.ts'
import '@/components/home-content.ts'
import '@/components/app-header.ts'
import '@/components/chat/arnes-shell.ts'
import '@/components/conversations/conversation-list.ts'
import '@/components/settings/general-settings.ts'
import '@/components/settings/assistant-settings.ts'
import '@/components/settings/providers-settings.ts'
import '@/components/settings/data-control-settings.ts'
import '@/components/settings/about-settings.ts'

type View = Readonly<{ title: string, content: string }>

/** Marks the current settings page in a breadcrumb, linking back to the index from domain pages. */
function settingsBreadcrumb(label: string, index: boolean): string {
  const parent = index ? '' : `<li><button type="button" data-view="settings">${i18n._('Settings')}</button></li>`
  return `<nav class="settings-breadcrumb" aria-label="${i18n._('Breadcrumb')}">
    <ol>
      ${parent}
      <li aria-current="page">${label}</li>
    </ol>
  </nav>`
}

/** Renders a settings domain page that shares the header and page shell with the index. */
function settingsPage(label: string, component: string): View {
  return {
    title: i18n._('{domain} | arnes', { domain: label }),
    content: `<app-header></app-header><main class="app-messages app-page settings-page">
      ${settingsBreadcrumb(label, false)}
      <h1>${label}</h1>
      ${component}
    </main>`,
  }
}

/** Lists one navigation row per settings domain without linking to URLs. */
function settingsNavRow(view: string, label: string): string {
  return `<li><button type="button" data-view="${view}">
    ${label}
    <svg class="settings-chevron" aria-hidden="true" focusable="false"><use href="#chevron-down-icon" /></svg>
  </button></li>`
}

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
      <conversation-list></conversation-list>
    </main>`,
  },
  settings: {
    title: i18n._('Settings | arnes'),
    content: `<app-header></app-header><main class="app-messages app-page settings-page">
      ${settingsBreadcrumb(i18n._('Settings'), true)}
      <h1>${i18n._('Settings')}</h1>
      <nav class="settings-nav" aria-label="${i18n._('Settings')}">
        <ul>
          ${settingsNavRow('settings-general', i18n._('General'))}
          ${settingsNavRow('settings-assistant', i18n._('Assistant'))}
          ${settingsNavRow('settings-providers', i18n._('Providers'))}
          ${settingsNavRow('settings-data', i18n._('Data Control'))}
          ${settingsNavRow('settings-about', i18n._('About'))}
        </ul>
      </nav>
    </main>`,
  },
  'settings-general': settingsPage(i18n._('General'), '<general-settings></general-settings>'),
  'settings-assistant': settingsPage(i18n._('Assistant'), '<assistant-settings></assistant-settings>'),
  'settings-providers': settingsPage(i18n._('Providers'), '<providers-settings></providers-settings>'),
  'settings-data': settingsPage(i18n._('Data Control'), '<data-control-settings></data-control-settings>'),
  'settings-about': settingsPage(i18n._('About'), '<about-settings></about-settings>'),
}

/** Limits navigation to the application's named views without involving URLs. */
export function getView(name: string): View | undefined {
  return Object.hasOwn(views, name) ? views[name] : undefined
}
