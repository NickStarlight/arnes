import { i18n } from '@/i18n.ts'
import '@/components/app-header.ts'
import '@/components/chat/arnes-composer.ts'
import '@/components/chat/arnes-messages.ts'
import type { ArnesComposer, ArnesSubmission } from '@/components/chat/arnes-composer.ts'
import type { ArnesMessages } from '@/components/chat/arnes-messages.ts'
import { chatStore, type ChatState } from '@/stores/conversation.ts'
import { streamChatResponse } from '@/agents/stream-response.ts'
import { loadConversation } from '@/stores/conversation-history.ts'
import { compactConversation } from '@/agents/compact-conversation.ts'
import { saveLastView } from '@/stores/settings.ts'

const template = `<app-header></app-header>
<arnes-messages></arnes-messages>
<arnes-composer></arnes-composer>`

class ArnesShell extends HTMLElement {
  private composer: ArnesComposer | undefined
  private messages: ArnesMessages | undefined
  private unsubscribe: (() => void) | undefined
  private streaming = false
  private loading = false
  private loadError: string | undefined
  private historyStatus = document.createElement('p')
  private savedThreadId: string | undefined

  /** Composes the application once and reconnects coordination without resetting its children. */
  connectedCallback(): void {
    if (!this.composer) {
      this.innerHTML = template

      this.composer = this.querySelector<ArnesComposer>('arnes-composer')!
      this.messages = this.querySelector<ArnesMessages>('arnes-messages')!
      this.historyStatus.setAttribute('role', 'status')
      this.historyStatus.hidden = true
      this.composer.append(this.historyStatus)

      void this.restoreConversation()
    }

    this.addEventListener('arnes-submit', this.submit)
    this.addEventListener('arnes-stop', this.stop)
    this.addEventListener('arnes-compact', this.compact)
    this.unsubscribe ??= chatStore.subscribe(this.render)
  }

  /** Detaches coordination while allowing an in-flight response to finish in the store. */
  disconnectedCallback(): void {
    this.removeEventListener('arnes-submit', this.submit)
    this.removeEventListener('arnes-stop', this.stop)
    this.removeEventListener('arnes-compact', this.compact)

    this.unsubscribe?.()
    this.unsubscribe = undefined
  }

  /** Pushes a single store snapshot down to both presentation components and persists lazily allocated thread IDs. */
  private render = (state: ChatState): void => {
    this.streaming = state.streaming

    if (state.threadId && state.threadId !== this.savedThreadId) {
      this.savedThreadId = state.threadId
      void saveLastView({ name: 'chat', threadId: state.threadId })
    }

    this.messages!.state = state
    this.composer!.contextUsage = state.contextUsage
    this.composer!.totalCost = state.totalCost ?? 0
    this.composer!.busy = state.streaming || Boolean(state.compacting) || this.loading || Boolean(this.loadError)
    this.composer!.compaction = { available: Boolean(state.threadId), active: Boolean(state.compacting) }
    this.composer!.generating = state.streaming
    this.composer!.error = state.error
  }

  /** Cancels the previous run and waits for cleanup before selecting another conversation. */
  private async waitForResponse(): Promise<void> {
    let unsubscribe: (() => void) | undefined

    await new Promise<void>(
      /** Subscribes before cancellation so completion cannot be missed. */
      (resolve) => {
        unsubscribe = chatStore.subscribe(
          /** Keeps store ownership with the previous response until its cleanup finishes. */
          (state) => {
            if (state.streaming || state.compacting) chatStore.stop()
            else resolve()
          },
        )
      },
    )

    unsubscribe?.()
  }

  /** Restores the selected thread and ignores loads belonging to a departed view. */
  private async restoreConversation(): Promise<void> {
    const threadId = this.getAttribute('thread-id')
    this.loading = true
    this.historyStatus.hidden = false
    this.historyStatus.textContent = i18n._("Loading conversation…")

    try {
      await this.waitForResponse()
      if (!this.isConnected) return

      if (!threadId) {
        this.loading = false
        chatStore.newConversation()
        this.historyStatus.hidden = true
        return
      }

      const { messages, totalCost } = await loadConversation(threadId)
      if (!this.isConnected) return

      this.loading = false
      chatStore.selectConversation(threadId, messages, totalCost)
      this.historyStatus.hidden = true
    } catch (error) {
      if (!this.isConnected) return

      this.loading = false
      this.loadError = error instanceof Error ? error.message : i18n._("Unable to load conversation. Reload to try again.")
      this.composer!.busy = true
      this.historyStatus.textContent = this.loadError
    }
  }

  /** Routes cancellation from this shell's composer to the active store run. */
  private stop = (event: Event): void => {
    if (event.target !== this.composer) return

    event.stopPropagation()
    chatStore.stop()
  }

  /** Handles only this shell's composer and defers agent creation to the store's guarded send. */
  private submit = (event: Event): void => {
    if (event.target !== this.composer) return

    event.stopPropagation()

    if (this.streaming || this.loading || this.loadError) return

    const request = (event as CustomEvent<ArnesSubmission>).detail

    void chatStore.send(request.message,
      /** Supplies the active conversation ID when the store begins the response. */
      (threadId, signal) => streamChatResponse({
        provider: request.provider,
        model: request.model,
        message: request.message,
        threadId,
        signal,
      }),
    )
  }

  /** Routes an explicit compact action through the store's shared busy guard. */
  private compact = (event: Event): void => {
    if (event.target !== this.composer || this.loading || this.loadError) return
    event.stopPropagation()
    const { provider, model } = (event as CustomEvent<ArnesSubmission>).detail
    void chatStore.compact(
      /** Supplies the active thread only after the store has acquired its operation guard. */
      (threadId, signal) => compactConversation({ provider, model, threadId, signal }),
    )
  }
}

customElements.define('arnes-shell', ArnesShell)
