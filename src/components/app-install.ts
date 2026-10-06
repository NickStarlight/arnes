import { i18n } from '@/i18n.ts'
import { canInstall, installPromptChanges, takeInstallPrompt } from '@/pwa/install-prompt.ts'

class AppInstall extends HTMLElement {
  private button = document.createElement('button')
  private status = document.createElement('p')

  /** Offers installation only after the browser supplies a usable prompt. */
  connectedCallback(): void {
    this.hidden = true
    this.button.type = 'button'
    this.button.className = 'icon-control'
    this.button.title = i18n._('Install arnes')
    this.button.innerHTML = `<svg aria-hidden="true" focusable="false"><use href="#install-icon" /></svg>
      <span>${i18n._('Install arnes')}</span>`
    this.status.setAttribute('role', 'status')
    this.replaceChildren(this.button, this.status)

    this.button.addEventListener('click', this.install)
    installPromptChanges.addEventListener('change', this.syncPrompt)
    this.syncPrompt()
  }

  /** Releases view listeners while preserving browser eligibility across navigation. */
  disconnectedCallback(): void {
    this.button.removeEventListener('click', this.install)
    installPromptChanges.removeEventListener('change', this.syncPrompt)
  }

  /** Reflects the shared prompt when eligibility or the mounted view changes. */
  private syncPrompt = (): void => {
    this.status.textContent = ''
    this.button.hidden = false
    this.hidden = !canInstall()
  }

  /** Consumes the prompt once and reports failures without leaving a dead button. */
  private install = async (): Promise<void> => {
    const prompt = takeInstallPrompt()
    if (!prompt) return

    try {
      await prompt.prompt()
    } catch {
      this.button.hidden = true
      this.status.textContent = i18n._('Unable to open installation. Try installing from your browser menu.')
      this.hidden = false
    }
  }
}

customElements.define('app-install', AppInstall)
