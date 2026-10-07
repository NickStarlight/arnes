import '@/components/settings/language-settings.ts'
import '@/components/settings/theme-settings.ts'

class GeneralSettings extends HTMLElement {
  private initialized = false

  /** Groups independent preferences without owning their storage or change handlers. */
  connectedCallback(): void {
    if (this.initialized) return
    this.initialized = true
    this.innerHTML = `<language-settings></language-settings>
      <theme-settings></theme-settings>`
  }
}

customElements.define('general-settings', GeneralSettings)
