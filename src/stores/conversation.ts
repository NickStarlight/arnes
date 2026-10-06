import { i18n } from '@/i18n.ts'
import type { ChatStreamEvent, ContextUsage } from '@/agents/context-usage.ts'
import { addConversationCost } from '@/libs/dexie/conversation-cost.ts'

export type ChatMessage = Readonly<{
  role: 'user' | 'assistant'
  text: string
  contextUsage?: ContextUsage
}>

export type ChatState = Readonly<{
  totalCost?: number
  threadId: string | undefined
  messages: readonly ChatMessage[]
  streaming: boolean
  compacting?: boolean
  error: string | undefined
  contextUsage?: ContextUsage
}>

type Listener = (state: ChatState) => void
type TokenStream = (threadId: string, signal: AbortSignal) => AsyncIterable<ChatStreamEvent>

/** Owns live conversation state while the agent's checkpointer handles durable storage. */
export function createChatStore() {
  let state: ChatState = Object.freeze({ threadId: undefined, messages: Object.freeze([]), streaming: false, error: undefined })
  const listeners = new Set<Listener>()
  let controller: AbortController | undefined

  /** Publishes immutable snapshots so components cannot accidentally mutate shared state. */
  function publish(next: ChatState): void {
    state = Object.freeze({ ...next, messages: Object.freeze(next.messages) })
    for (const listener of listeners) listener(state)
  }

  /** Immediately supplies current state and returns an unsubscription function for component cleanup. */
  function subscribe(listener: Listener): () => void {
    listeners.add(listener)
    listener(state)

    /** Detaches only this subscription without interrupting an active response. */
    return () => {
      listeners.delete(listener)
    }
  }

  /** Selects a persisted conversation with caller-loaded messages, preventing active stream output from crossing threads. */
  function selectConversation(threadId: string, messages: readonly ChatMessage[], totalCost = 0): void {
    if (!threadId.trim()) throw new Error('A non-empty thread ID is required')
    if (state.streaming || state.compacting) throw new Error('Cannot switch conversations while the agent is busy')

    const snapshots: ChatMessage[] = []
    for (const message of messages) snapshots.push(Object.freeze({ ...message }))

    let contextUsage: ContextUsage | undefined
    for (const message of snapshots) {
      if (message.role === 'assistant') contextUsage = message.contextUsage
    }
    publish({ threadId, messages: snapshots, streaming: false, error: undefined, contextUsage, totalCost })
  }

  /** Clears the active conversation and defers allocating its ID until the first submission. */
  function newConversation(): void {
    if (state.streaming || state.compacting) throw new Error('Cannot switch conversations while the agent is busy')
    publish({ threadId: undefined, messages: [], streaming: false, error: undefined })
  }

  /** Updates the active assistant response without changing earlier message snapshots. */
  function appendToken(token: string): void {
    const messages = [...state.messages]
    const last = messages.length - 1
    messages[last] = Object.freeze<ChatMessage>({ role: 'assistant', text: messages[last].text + token })
    publish({ ...state, messages })
  }

  /** Cancels the active run while retaining partial output and waiting for stream cleanup. */
  function stop(): void {
    controller?.abort()
  }

  /** Adds each completed response or compaction charge to durable conversation accounting. */
  async function recordUsage(contextUsage: ContextUsage): Promise<void> {
    const totalCost = contextUsage.responseCost === undefined
      ? state.totalCost
      : await addConversationCost(state.threadId!, contextUsage.responseCost)
    publish({ ...state, contextUsage, totalCost })
  }

  /** Serializes submissions and preserves partial output without reporting cancellation as failure. */
  async function send(text: string, stream: TokenStream): Promise<void> {
    if (state.streaming || state.compacting || !text.trim()) return
    const activeController = new AbortController()
    controller = activeController
    const threadId = state.threadId ?? crypto.randomUUID()
    publish({
      threadId,
      totalCost: state.totalCost ?? 0,
      messages: [
        ...state.messages,
        Object.freeze<ChatMessage>({ role: 'user', text: text.trim() }),
        Object.freeze<ChatMessage>({ role: 'assistant', text: '' }),
      ],
      streaming: true,
      error: undefined,
    })

    try {
      for await (const token of stream(threadId, activeController.signal)) {
        if (activeController.signal.aborted) break
        if (typeof token === 'string') appendToken(token)
        else await recordUsage(token)
      }
    } catch (error) {
      if (!activeController.signal.aborted) {
        publish({ ...state, error: error instanceof Error ? error.message : i18n._("Unable to complete the response.") })
      }
    } finally {
      controller = undefined
      publish({ ...state, streaming: false })
    }
  }

  /** Serializes manual compaction with generation while keeping the visible transcript unchanged. */
  async function compact(run: (threadId: string, signal: AbortSignal) => Promise<ContextUsage>): Promise<void> {
    if (state.streaming || state.compacting || !state.threadId) return
    const activeController = new AbortController()
    controller = activeController
    publish({ ...state, compacting: true, error: undefined })

    try {
      const contextUsage = await run(state.threadId!, activeController.signal)
      await recordUsage(contextUsage)
    } catch (error) {
      if (!activeController.signal.aborted) {
        publish({ ...state, error: error instanceof Error ? error.message : i18n._('Unable to compact this conversation.') })
      }
    } finally {
      controller = undefined
      publish({ ...state, compacting: false })
    }
  }

  return { subscribe, send, compact, stop, selectConversation, newConversation }
}

export const chatStore = createChatStore()
