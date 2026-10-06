import { i18n } from '@/i18n.ts'
import licenses from '@/licenses/third-party.txt?raw'

class AboutSettings extends HTMLElement {
  private initialized = false

  /** Displays license text as a value so upstream notices cannot become HTML. */
  connectedCallback(): void {
    if (this.initialized) return
    this.initialized = true

    this.innerHTML = `<details aria-labelledby="about-heading">
      <summary><svg class="settings-chevron" aria-hidden="true" focusable="false"><use href="#chevron-down-icon" /></svg><h2 id="about-heading">${i18n._('About')}</h2></summary>
      <div class="about-content">
        <h3>arnes</h3>
        <p>${i18n._('A fully client-side AI harness that runs in your browser.')}</p>
        <p><a href="https://github.com/NickStarlight/arnes" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a></p>
        <label for="foss-licenses">${i18n._('Free and open-source software licenses')}</label>
        <textarea id="foss-licenses" rows="14" readonly spellcheck="false"></textarea>
      </div>
    </details>`

    this.querySelector<HTMLTextAreaElement>('#foss-licenses')!.value = licenses
  }
}

customElements.define('about-settings', AboutSettings)
