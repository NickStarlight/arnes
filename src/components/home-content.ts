import { i18n } from '@/i18n.ts'
import '@/components/app-install.ts'

class HomeContent extends HTMLElement {
  private initialized = false

  /** Introduces the app with localized descriptions of its capabilities and data flow. */
  connectedCallback(): void {
    if (this.initialized) return

    this.innerHTML = `<div class="home-heading">
        <h1>arnes</h1>
        <button type="button" class="icon-control" data-view="chat" title="${i18n._('Chat')}">
          <svg aria-hidden="true" focusable="false"><use href="#chat-icon" /></svg>
          <span>${i18n._('Chat')}</span>
        </button>
      </div>
      <p class="home-intro">${i18n._('An AI harness in a single HTML file. Run it in your browser, on your computer or your phone.')}</p>
      <app-install hidden></app-install>
      <div class="home-features">
        <section aria-labelledby="home-providers">
          <h2 id="home-providers">${i18n._('Providers')}</h2>
          <p>${i18n._('arnes connects you directly to AI providers that allow browser requests through CORS. No backend, no proxy, no middleman.')}</p>
        </section>
        <section aria-labelledby="home-data">
          <h2 id="home-data">${i18n._('Data Control')}</h2>
          <p>${i18n._('Your conversations, settings, and API keys are stored on your device. No cloud sync. Requests go directly to your chosen providers, whose data policies apply.')}</p>
        </section>
        <section aria-labelledby="home-pwa">
          <h2 id="home-pwa">${i18n._('On your computer. On your phone.')}</h2>
          <p>${i18n._('Open it in your browser or install it as a PWA. No app store or powerful hardware required. Your AI providers run the models.')}</p>
        </section>
        <section aria-labelledby="home-source">
          <h2 id="home-source">${i18n._('Build it yourself. Take it anywhere.')}</h2>
          <p>${i18n._('Inspect the source and compile your own copy. The build bundles the app into one portable HTML file, with scripts, styles, fonts, and icons included.')}</p>
          <p>${i18n._('Made with Web Components. No UI frameworks.')}</p>
          <p><a href="https://github.com/NickStarlight/arnes/attestations" target="_blank" rel="noopener noreferrer">${i18n._('View build attestations')} <span aria-hidden="true">↗</span></a></p>
        </section>
        <section aria-labelledby="home-hosting">
          <h2 id="home-hosting">${i18n._('No server to run.')}</h2>
          <p>${i18n._('Compile it yourself. Take the HTML file with you. Run it in your browser, on your computer or your phone. Hosting is optional.')}</p>
          <p><a href="https://github.com/NickStarlight/arnes" target="_blank" rel="noopener noreferrer">${i18n._('Host it yourself')} <span aria-hidden="true">↗</span></a></p>
        </section>
      </div>`

    this.initialized = true
  }
}

customElements.define('home-content', HomeContent)
