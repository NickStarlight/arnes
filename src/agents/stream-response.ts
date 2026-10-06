import { createChatAgent } from '@/agents/create-chat-agent.ts'
import { AIMessageChunk } from 'langchain'
import { createResponseCost } from '@/agents/response-cost.ts'
import { readContextUsage, type ChatStreamEvent, type ContextUsage } from '@/agents/context-usage.ts'

type ChatRequest = {
  provider: string
  model: string
  message: string
  threadId: string
  signal: AbortSignal
}

/** Streams text and per-call usage while LangGraph persists the conversation; tool calls reset usage totals. */
export async function* streamChatResponse(request: ChatRequest): AsyncGenerator<ChatStreamEvent> {
  const cost = createResponseCost(request.model)
  const agent = await createChatAgent(request.provider, request.model)
  request.signal.throwIfAborted()
  const stream = await agent.stream(
    { messages: [{ role: 'user', content: request.message }] },
    { configurable: { thread_id: request.threadId }, streamMode: 'messages', signal: request.signal, callbacks: cost.callbacks },
  )

  let step: unknown
  let total: ContextUsage | undefined

  for await (const [message, metadata] of stream) {
    if (message.getType() !== 'ai' || metadata.langgraph_node !== 'model_request') continue
    if (metadata.langgraph_step !== step) {
      step = metadata.langgraph_step
      total = undefined
    }

    if (message instanceof AIMessageChunk) {
      const usage = readContextUsage(message, request.model)
      if (usage) {
        total = {
          model: request.model,
          tokens: (total?.tokens ?? 0) + usage.tokens,
          inputTokens: (total?.inputTokens ?? 0) + usage.inputTokens,
          outputTokens: (total?.outputTokens ?? 0) + usage.outputTokens,
          cachedInputTokens: (total?.cachedInputTokens ?? 0) + usage.cachedInputTokens,
        }
        yield total
      }
    }

    if (typeof message.content === 'string') {
      if (message.content) yield message.content
      continue
    }

    for (const block of message.content) {
      if (block.type === 'text' && typeof block.text === 'string') yield block.text
    }
  }
  if (total) yield { ...total, responseCost: cost.value() }
}
