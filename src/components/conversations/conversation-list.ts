import { i18n } from '@/i18n.ts'
import {
  deleteAllConversations,
  deleteConversation,
  listConversations,
  pinConversation,
  renameConversation,
  type ConversationSummary,
} from '@/stores/conversation-history.ts'

const template = `<div class="conversation-heading">
  <h1>${i18n._('Conversations')}</h1>
  <button type="button" class="icon-control" data-action="delete-all" title="${i18n._("Delete all conversations")}" aria-label="${i18n._("Delete all conversations")}" disabled>
    <svg aria-hidden="true" focusable="false"><use href="#delete-all-icon" /></svg>
  </button>
</div>
<p role="status">${i18n._("Loading conversations…")}</p>
<ul class="conversation-list" aria-label="${i18n._("Saved conversations")}"></ul>`

/** Uses text nodes for saved content so conversation titles cannot introduce markup. */
function createConversationItem(conversation: ConversationSummary): HTMLLIElement {
  const item = document.createElement('li')
  const link = document.createElement('button')
  const title = document.createElement('span')
  const time = document.createElement('time')

  item.dataset.threadId = conversation.threadId
  item.dataset.pinned = String(conversation.pinned)

  link.type = 'button'
  link.className = 'conversation-open'
  link.dataset.view = 'chat'
  link.dataset.threadId = conversation.threadId
  title.className = 'conversation-title'
  title.textContent = conversation.title
  time.dateTime = conversation.updatedAt
  time.textContent = new Intl.DateTimeFormat(i18n.locale, { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(conversation.updatedAt))
  link.append(title, time)
  item.append(link, createConversationActions(conversation))

  return item
}

/** Labels each row's controls for assistive technology and exposes the saved pin state. */
function createConversationActions(conversation: ConversationSummary): HTMLDivElement {
  const actions = document.createElement('div')
  actions.className = 'conversation-actions'

  for (const action of ['rename', 'pin', 'delete']) {
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.action = action
    button.title = action === 'pin' ? (conversation.pinned ? i18n._("Unpin") : i18n._("Pin")) : action === 'rename' ? i18n._("Rename") : i18n._("Delete")
    button.setAttribute('aria-label', i18n._("{action} {title}", { action: button.title, title: conversation.title }))
    button.innerHTML = `<svg aria-hidden="true" focusable="false"><use href="#${action}-icon" /></svg>`
    if (action === 'pin') button.setAttribute('aria-pressed', String(conversation.pinned))
    actions.append(button)
  }

  return actions
}

/** Collects a replacement title or deletion confirmation before changing saved data. */
async function applyConversationAction(action: string, conversation: ConversationSummary): Promise<boolean> {
  if (action === 'rename') {
    const title = window.prompt(i18n._("Conversation name"), conversation.title)
    if (title === null) return false
    await renameConversation(conversation.threadId, title)
  } else if (action === 'pin') {
    await pinConversation(conversation.threadId, !conversation.pinned)
  } else if (action === 'delete') {
    if (!window.confirm(i18n._("Delete “{title}”? This cannot be undone.", { title: conversation.title }))) return false
    await deleteConversation(conversation.threadId)
  } else {
    return false
  }

  return true
}

class ConversationList extends HTMLElement {
  private initialized = false
  private busy = false
  private conversations = new Map<string, ConversationSummary>()

  /** Loads saved history once per page visit and preserves it if the element reconnects. */
  connectedCallback(): void {
    if (this.initialized) return

    this.innerHTML = template
    this.addEventListener('click', this.handleAction)
    this.initialized = true
    void this.load()
  }

  /** Serializes row actions and keeps storage failures visible without discarding the current list. */
  private handleAction = async (event: Event): Promise<void> => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-action]') : null
    if (!button || this.busy) return

    if (button.dataset.action === 'delete-all') {
      await this.deleteAll(button)
      return
    }

    const threadId = button.closest<HTMLElement>('[data-thread-id]')?.dataset.threadId
    const conversation = threadId ? this.conversations.get(threadId) : undefined
    if (!conversation) return

    this.busy = true
    this.setButtonsDisabled(true)
    const status = this.querySelector<HTMLElement>('[role="status"]')!
    status.textContent = ''

    try {
      if (await applyConversationAction(button.dataset.action!, conversation)) await this.load()
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : i18n._("Unable to update conversation. Try again.")
    } finally {
      this.busy = false
      this.setButtonsDisabled(false)
      const row = button.closest('li')
      const replacement = this.querySelector<HTMLElement>(`[data-thread-id="${CSS.escape(conversation.threadId)}"]`)
      if (row?.isConnected) button.focus()
      else if (replacement) replacement.querySelector<HTMLButtonElement>(`[data-action="${button.dataset.action}"]`)?.focus()
      else this.querySelector<HTMLButtonElement>('.conversation-open')?.focus()
    }
  }

  /** Confirms and deletes every saved conversation, then refreshes the emptied list. */
  private deleteAll = async (button: HTMLButtonElement): Promise<void> => {
    if (!window.confirm(i18n._("Delete all conversations? This cannot be undone."))) return

    this.busy = true
    this.setButtonsDisabled(true)
    const status = this.querySelector<HTMLElement>('[role="status"]')!
    status.textContent = ''

    try {
      await deleteAllConversations()
      await this.load()
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : i18n._("Unable to delete conversations. Try again.")
    } finally {
      this.busy = false
      this.setButtonsDisabled(false)
      button.focus()
    }
  }

  /** Prevents overlapping writes while an action or its list refresh is pending. */
  private setButtonsDisabled(disabled: boolean): void {
    for (const button of Array.from(this.querySelectorAll('button'))) {
      button.disabled = disabled || (button.dataset.action === 'delete-all' && this.conversations.size === 0)
    }
  }

  /** Keeps loading, empty, and storage failure states visible without requiring model credentials. */
  private async load(): Promise<void> {
    const status = this.querySelector<HTMLElement>('[role="status"]')!
    const list = this.querySelector('ul')!

    this.setAttribute('aria-busy', 'true')

    try {
      const conversations = await listConversations()
      const items = document.createDocumentFragment()

      this.conversations.clear()

      let previousPinned: boolean | undefined

      for (const conversation of conversations) {
        this.conversations.set(conversation.threadId, conversation)
        const item = createConversationItem(conversation)

        if (conversations[0]?.pinned && conversation.pinned !== previousPinned) {
          const heading = document.createElement('h2')
          heading.className = 'conversation-group-title'
          heading.textContent = conversation.pinned ? i18n._('Pinned') : i18n._('All conversations')
          item.prepend(heading)
        }

        previousPinned = conversation.pinned
        items.append(item)
      }

      list.replaceChildren(items)
      status.textContent = conversations.length ? '' : i18n._("No conversations yet.")
    } catch {
      status.textContent = i18n._("Unable to load conversations. Reload to try again.")
    } finally {
      this.setAttribute('aria-busy', 'false')
      this.setButtonsDisabled(this.busy)
    }
  }
}

customElements.define('conversation-list', ConversationList)
