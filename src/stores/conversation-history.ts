import { i18n } from '@/i18n.ts'
import { AIMessage, type BaseMessage } from 'langchain'
import { readContextUsage } from '@/agents/context-usage.ts'
import {
  deleteAllConversationRecords,
  deleteConversationRecords,
  getConversationCheckpoint,
  getConversationMetadata,
  listConversationCheckpoints,
  listConversationMetadata,
  saveConversationMetadata,
} from '@/libs/dexie/conversations.ts'
import type { ConversationMetadata } from '@/libs/dexie/database.ts'
import type { ChatMessage } from '@/stores/conversation.ts'
import { getConversationCost } from '@/libs/dexie/conversation-cost.ts'

export type ConversationSummary = Readonly<{
  threadId: string
  title: string
  updatedAt: string
  pinned: boolean
}>

/** Projects persisted agent messages into visible chat text, excluding tools and system instructions. */
function readMessages(value: unknown): ChatMessage[] {
  const messages: ChatMessage[] = []

  if (!Array.isArray(value)) return messages

  for (const message of value as BaseMessage[]) {
    const type = message.getType()
    if (type !== 'human' && type !== 'ai') continue

    let text = ''

    if (typeof message.content === 'string') {
      text = message.content
    } else {
      for (const block of message.content) {
        if (block.type === 'text' && typeof block.text === 'string') text += block.text
      }
    }

    if (text.trim()) messages.push({
      role: type === 'human' ? 'user' : 'assistant',
      text,
      contextUsage: message instanceof AIMessage ? readContextUsage(message) : undefined,
    })
  }

  return messages
}

/** Derives list entries from visible transcripts, falling back to legacy agent checkpoints. */
export async function listConversations(): Promise<ConversationSummary[]> {
  const conversations: ConversationSummary[] = []
  const metadata = new Map<string, ConversationMetadata>()

  for (const entry of await listConversationMetadata()) metadata.set(entry.threadId, entry)

  for (const { threadId, checkpoint } of await listConversationCheckpoints()) {
    const saved = metadata.get(threadId)
    const messages = saved?.messages ?? readMessages(checkpoint.channel_values.messages)
    metadata.delete(threadId)
    if (!messages.length) continue

    conversations.push(createSummary(threadId, messages, saved?.updatedAt ?? checkpoint.ts, saved))
  }

  for (const saved of metadata.values()) {
    if (!saved.messages?.length || !saved.updatedAt) continue

    conversations.push(createSummary(saved.threadId, saved.messages, saved.updatedAt, saved))
  }

  return conversations.sort(
    /** Keeps recently updated threads first within each pin group, including failures without checkpoints. */
    (left, right) => Number(right.pinned) - Number(left.pinned) || right.updatedAt.localeCompare(left.updatedAt),
  )
}

/** Preserves custom titles and derives a compact fallback from the first user message. */
function createSummary(threadId: string, messages: readonly ChatMessage[], updatedAt: string, saved?: ConversationMetadata): ConversationSummary {
  let title = i18n._("Untitled conversation")

  for (const message of messages) {
    if (message.role !== 'user') continue

    title = message.text.replace(/\s+/g, ' ').trim()
    if (title.length > 100) title = `${title.slice(0, 100)}…`
    break
  }

  return { threadId, title: saved?.title ?? title, updatedAt, pinned: saved?.pinned ?? false }
}

/** Rejects blank titles before persisting a user-supplied conversation name. */
export async function renameConversation(threadId: string, title: string): Promise<void> {
  const name = title.trim()
  if (!name) throw new Error(i18n._("Enter a conversation name."))

  await saveConversationMetadata(threadId, { title: name })
}

/** Persists pin state without changing the conversation's last-message timestamp. */
export async function pinConversation(threadId: string, pinned: boolean): Promise<void> {
  await saveConversationMetadata(threadId, { pinned })
}

/** Deletes saved history along with its custom name and pin state. */
export async function deleteConversation(threadId: string): Promise<void> {
  await deleteConversationRecords(threadId)
}

/** Deletes every saved conversation along with all custom names and pin states. */
export async function deleteAllConversations(): Promise<void> {
  await deleteAllConversationRecords()
}

/** Distinguishes a missing conversation from an empty saved history. */
export async function loadConversation(threadId: string): Promise<{ messages: ChatMessage[], totalCost: number }> {
  const saved = await getConversationMetadata(threadId)
  if (saved?.messages) return { messages: [...saved.messages], totalCost: await getConversationCost(threadId) }

  const checkpoint = await getConversationCheckpoint(threadId)
  if (!checkpoint) throw new Error(i18n._("Conversation not found. Start a new chat or choose another conversation."))

  return { messages: readMessages(checkpoint.channel_values.messages), totalCost: await getConversationCost(threadId) }
}
