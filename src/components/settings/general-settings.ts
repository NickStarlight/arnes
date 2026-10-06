import { i18n } from '@/i18n.ts'
import '@/components/settings/language-settings.ts'
import '@/components/settings/theme-settings.ts'

class GeneralSettings extends HTMLElement {
  private initialized = false

  /** Groups independent preferences without owning their storage or change handlers. */
  connectedCallback(): void {
    if (this.initialized) return
    this.initialized = true
    this.innerHTML = `<details aria-labelledby="general-heading">
      <summary><svg class="settings-chevron" aria-hidden="true" focusable="false"><use href="#chevron-down-icon" /></svg><h2 id="general-heading">${i18n._('General')}</h2></summary>
      <language-settings></language-settings>
      <theme-settings></theme-settings>
    </details>`
  }
}

customElements.define('general-settings', GeneralSettings)
