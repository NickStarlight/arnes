import { getView } from '@/pages/views.ts'
import { observeViewport } from '@/pages/viewport.ts'
import { getLastView, saveLastView } from '@/stores/settings.ts'

class ArnesApp extends HTMLElement {
  private currentView = ''
  private stopObservingViewport: (() => void) | undefined

  /** Starts on the view active before a reload and handles view selection entirely within the component. */
  connectedCallback(): void {
    this.addEventListener('click', this.navigate)
    this.stopObservingViewport ??= observeViewport(this)
    if (!this.currentView) void this.restore()
  }

  /** Returns to the saved view when storage allows it, falling back to home on absence or failure. */
  private async restore(): Promise<void> {
    try {
      const saved = await getLastView()
      if (saved) this.render(saved.name, saved.threadId)
    } finally {
      if (!this.currentView) this.render('home')
    }
  }

  /** Detaches navigation handling while the application is disconnected. */
  disconnectedCallback(): void {
    this.removeEventListener('click', this.navigate)
    this.stopObservingViewport?.()
    this.stopObservingViewport = undefined
  }

  /** Handles navigation buttons without changing the URL or browser history. */
  private navigate = (event: MouseEvent): void => {
    if (event.defaultPrevented) return
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-view]') : null
    if (button?.dataset.view) this.render(button.dataset.view, button.dataset.threadId)
  }

  /** Supplies conversation selection before mounting and moves focus into the selected view. */
  private render(name: string, threadId?: string): void {
    const view = getView(name)
    if (!view) return

    const navigating = Boolean(this.currentView)
    this.currentView = name
    document.title = view.title
    void saveLastView(threadId ? { name, threadId } : { name })

    const template = document.createElement('template')
    template.innerHTML = view.content
    if (threadId) template.content.querySelector('arnes-shell')?.setAttribute('thread-id', threadId)

    /** Mounts the view and moves focus into it, running after the outgoing snapshot when transitioned. */
    const swap = (): void => {
      this.replaceChildren(template.content)

      if (navigating) {
        const main = this.querySelector<HTMLElement>('main')
        main?.setAttribute('tabindex', '-1')
        main?.focus({ preventScroll: true })
      }
    }

    if (navigating && document.startViewTransition) {
      document.startViewTransition(swap)
    } else {
      swap()
    }
  }
}

customElements.define('arnes-app', ArnesApp)
