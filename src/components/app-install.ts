import { i18n } from '@/i18n.ts'

interface InstallPromptEvent extends Event {
  /** Opens the browser-owned dialog once, directly from a user gesture. */
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>
}

class AppInstall extends HTMLElement {
  private pendingPrompt: InstallPromptEvent | undefined
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
    window.addEventListener('beforeinstallprompt', this.capturePrompt)
    window.addEventListener('appinstalled', this.clearPrompt)
  }

  /** Releases browser listeners and discards any prompt when detached. */
  disconnectedCallback(): void {
    this.button.removeEventListener('click', this.install)
    window.removeEventListener('beforeinstallprompt', this.capturePrompt)
    window.removeEventListener('appinstalled', this.clearPrompt)
    this.clearPrompt()
  }

  /** Retains the one-use prompt so installation starts from the page button. */
  private capturePrompt = (event: Event): void => {
    event.preventDefault()
    this.pendingPrompt = event as InstallPromptEvent
    this.status.textContent = ''
    this.button.hidden = false
    this.hidden = false
  }

  /** Hides the control after installation or consumption of its one-use prompt. */
  private clearPrompt = (): void => {
    this.pendingPrompt = undefined
    this.hidden = true
  }

  /** Consumes the prompt once and reports failures without leaving a dead button. */
  private install = async (): Promise<void> => {
    const prompt = this.pendingPrompt
    if (!prompt) return

    this.clearPrompt()

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
