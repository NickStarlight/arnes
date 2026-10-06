import { i18n } from '@/i18n.ts'

const template = `<header class="app-header">
  <span class="app-header-title">arnes</span>
  <button type="button" data-view="chat" title="${i18n._('Chat')}">
    <svg class="size-6" aria-hidden="true" focusable="false"><use href="#chat-icon" /></svg>
    <span class="sr-only">${i18n._('Chat')}</span>
  </button>
  <button type="button" data-view="conversations" title="${i18n._('Conversations')}">
    <svg class="size-6" aria-hidden="true" focusable="false"><use href="#conversations-icon" /></svg>
    <span class="sr-only">${i18n._('Conversations')}</span>
  </button>
  <button type="button" data-view="settings" title="${i18n._('Settings')}">
    <svg class="size-6" aria-hidden="true" focusable="false"><use href="#settings-icon" /></svg>
    <span class="sr-only">${i18n._('Settings')}</span>
  </button>
</header>`

class AppHeader extends HTMLElement {
  private initialized = false

  /** Shares navigation across pages while preserving the header landmark and existing styles. */
  connectedCallback(): void {
    if (this.initialized) return

    this.innerHTML = template
    this.initialized = true
  }
}

customElements.define('app-header', AppHeader)
