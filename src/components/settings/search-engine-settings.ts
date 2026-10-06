import { i18n } from '@/i18n.ts'
import '@/components/settings/provider-settings.ts'

const template = `<details aria-labelledby="search-engines-heading">
  <summary><svg class="settings-chevron" aria-hidden="true" focusable="false"><use href="#chevron-down-icon" /></svg><h2 id="search-engines-heading">${i18n._("Search engines")}</h2></summary>
  <div class="settings-intro">
    <p>${i18n._('Give your assistant access to the web. Connect a search engine with your own API key to find fresh information and sources.')}</p>
    <p><a href="https://github.com/NickStarlight/arnes/wiki/Provider-support" target="_blank" rel="noopener noreferrer">${i18n._('Learn more about search engine support')} <span aria-hidden="true">↗</span></a></p>
  </div>
  <provider-settings provider="exa"></provider-settings>
</details>`

class SearchEngineSettings extends HTMLElement {
  private initialized = false

  /** Uses the shared credential form and existing provider storage convention for Exa. */
  connectedCallback(): void {
    if (this.initialized) return

    this.innerHTML = template
    this.initialized = true
  }
}

customElements.define('search-engine-settings', SearchEngineSettings)
