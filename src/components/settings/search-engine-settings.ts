import { i18n } from '@/i18n.ts'
import '@/components/settings/provider-settings.ts'

const template = `<div class="settings-intro">
  <p>${i18n._('Give your assistant access to the web. Connect a search engine with your own API key to find fresh information and sources.')}</p>
  <p><a href="https://github.com/NickStarlight/arnes/wiki/Provider-support" target="_blank" rel="noopener noreferrer">${i18n._('Learn more about search engine support')} <span aria-hidden="true">↗</span></a></p>
</div>
<provider-settings provider="tavily"></provider-settings>`

class SearchEngineSettings extends HTMLElement {
  private initialized = false

  /** Uses the shared credential form and existing provider storage convention for Tavily. */
  connectedCallback(): void {
    if (this.initialized) return

    this.innerHTML = template
    this.initialized = true
  }
}

customElements.define('search-engine-settings', SearchEngineSettings)
