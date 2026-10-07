import { i18n } from '@/i18n.ts'
import { renderMarkdown } from '@/components/chat/render-markdown.ts'
import { createInlineLoading } from '@/components/inline-loading.ts'
import { createChatWelcome } from '@/components/chat/create-chat-welcome.ts'
import { createMessageCopy } from '@/components/chat/create-message-copy.ts'
import type { ChatState } from '@/stores/conversation.ts'

class ArnesMessages extends HTMLElement {
  private container = document.createElement('main')
  private welcome = createChatWelcome()
  private elements: HTMLElement[] = []
  private rendered = new WeakMap<HTMLElement, string>()
  private latestTurn: HTMLElement | undefined
  private resizeObserver: ResizeObserver | undefined
  private scrollFrame: number | undefined

  /** Keeps the conversation landmark inside this component across reconnections. */
  connectedCallback(): void {
    this.container.className = 'app-messages'
    this.container.setAttribute('aria-label', i18n._("Conversation"))

    if (this.container.parentElement !== this) this.append(this.container)
    if (!this.elements.length) this.container.append(this.welcome)

    this.resizeObserver ??= new ResizeObserver(this.resizeTurns)
    this.resizeObserver.observe(this.container)
  }

  /** Releases layout observation and any pending scroll when the conversation is detached. */
  disconnectedCallback(): void {
    this.resizeObserver?.disconnect()
    if (this.scrollFrame !== undefined) cancelAnimationFrame(this.scrollFrame)
  }

  /** Keeps the latest turn at least as tall as the visible conversation, excluding its padding. */
  private resizeTurns = (): void => {
    const style = getComputedStyle(this.container)
    const height = this.container.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)

    this.container.style.setProperty('--chat-turn-height', `${Math.max(0, height)}px`)
  }

  /** Groups each user message with subsequent assistant content so only the latest turn reserves space. */
  private appendMessage(role: string): HTMLElement {
    let turn = this.container.lastElementChild

    if (role === 'user' || !turn) {
      turn = document.createElement('div')
      turn.className = 'chat-turn'
      this.container.append(turn)
    }

    const element = document.createElement('div')
    element.id = `message-${crypto.randomUUID()}`
    element.className = 'arnes-message'
    turn.append(element)
    this.elements.push(element)

    return element
  }

  /** Aligns new turns immediately so streaming and viewport reflows cannot interrupt an animated scroll. */
  private scrollToLatestTurn = (): void => {
    this.scrollFrame = undefined
    if (!this.latestTurn || !this.isConnected) return

    this.resizeTurns()

    const padding = parseFloat(getComputedStyle(this.container).paddingTop)
    const offset = this.latestTurn.getBoundingClientRect().top - this.container.getBoundingClientRect().top
    this.container.scrollTop += offset - padding
    this.scrollFrame = requestAnimationFrame(this.retryLatestTurnScroll)
  }

  /** Reapplies the alignment once when Firefox for Android drops the first programmatic scroll of a turn. */
  private retryLatestTurnScroll = (): void => {
    this.scrollFrame = undefined
    if (!this.latestTurn || !this.isConnected) return

    const padding = parseFloat(getComputedStyle(this.container).paddingTop)
    const offset = this.latestTurn.getBoundingClientRect().top - this.container.getBoundingClientRect().top

    if (Math.abs(offset - padding) >= 1) this.container.scrollTop += offset - padding
  }

  /** Preserves the loading node so token updates do not restart its animation. */
  private renderAssistant(element: HTMLElement, text: string, waiting: boolean): void {
    const loading = waiting ? element.querySelector(':scope > .inline-loading') : null

    for (const child of Array.from(element.childNodes)) {
      if (child !== loading) child.remove()
    }

    if (waiting && !loading) element.append(createInlineLoading(i18n._("Responding…")))

    element.insertAdjacentHTML('beforeend', renderMarkdown(text, element.id))
    if (!waiting && text.trim()) element.append(createMessageCopy(text))
  }

  /** Keeps loading visible through intermediate text until the response completes or fails. */
  set state(state: Pick<ChatState, 'messages' | 'streaming' | 'error'>) {
    this.container.setAttribute('aria-busy', String(state.streaming))

    while (this.elements.length > state.messages.length) {
      const element = this.elements.pop()!
      const turn = element.parentElement!
      element.remove()
      if (!turn.childElementCount) turn.remove()
    }

    if (!state.messages.length) {
      this.container.append(this.welcome)
      this.latestTurn = undefined
      if (this.scrollFrame !== undefined) cancelAnimationFrame(this.scrollFrame)
      this.scrollFrame = undefined
      return
    }

    this.welcome.remove()

    for (const [index, message] of state.messages.entries()) {
      let element = this.elements[index]

      if (!element) {
        element = this.appendMessage(message.role)
      }

      element.dataset.role = message.role
      if (message.role === 'error') {
        element.setAttribute('role', 'alert')
        element.removeAttribute('aria-label')
      } else {
        element.removeAttribute('role')
        element.setAttribute('aria-label', message.role === 'user' ? i18n._("You") : i18n._("Assistant"))
      }

      const waiting = state.streaming && !state.error && message.role === 'assistant'
        && index === state.messages.length - 1
      const text = message.text

      const contentKey = `${message.role}\0${waiting}\0${text}`

      if (this.rendered.get(element) === contentKey) continue

      if (message.role === 'assistant') this.renderAssistant(element, text, waiting)
      else element.textContent = text

      this.rendered.set(element, contentKey)
    }

    const latestTurn = this.container.lastElementChild as HTMLElement | null

    if (latestTurn !== (this.latestTurn ?? null)) {
      this.latestTurn = latestTurn ?? undefined
      if (this.scrollFrame !== undefined) cancelAnimationFrame(this.scrollFrame)
      this.scrollFrame = requestAnimationFrame(this.scrollToLatestTurn)
    }
  }
}

customElements.define('arnes-messages', ArnesMessages)

export type { ArnesMessages }
