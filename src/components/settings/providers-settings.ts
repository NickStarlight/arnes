import { i18n } from '@/i18n.ts'
import '@/components/settings/provider-settings.ts'

const template = `<details aria-labelledby="providers-heading">
  <summary><svg class="settings-chevron" aria-hidden="true" focusable="false"><use href="#chevron-down-icon" /></svg><h2 id="providers-heading">${i18n._("Providers")}</h2></summary>
  <div class="settings-intro">
    <p>${i18n._('Bring your own API keys to connect the AI providers that power your conversations.')} ${i18n._('Your messages and content go directly to the selected provider, with no proxy, middleware, or logging in between.')}</p>
    <p>${i18n._('To learn how your data is used, consult each provider’s privacy policy.')}</p>
    <p><a href="https://github.com/NickStarlight/arnes/wiki/Provider-support" target="_blank" rel="noopener noreferrer">${i18n._('Learn more about provider support')} <span aria-hidden="true">↗</span></a></p>
  </div>
  <provider-settings provider="together-ai"></provider-settings>
  <provider-settings provider="anthropic"></provider-settings>
  <provider-settings provider="openai"></provider-settings>
</details>`

class ProvidersSettings extends HTMLElement {
  private initialized = false

  /** Composes provider forms once, preserving their state across reconnections. */
  connectedCallback(): void {
    if (this.initialized) return

    this.innerHTML = template
    this.initialized = true
  }
}

customElements.define('providers-settings', ProvidersSettings)
