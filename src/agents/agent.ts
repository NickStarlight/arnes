import { createAgent as createLangChainAgent, type ReactAgent, type AnyAnnotationRoot, type CreateAgentParams, type AnyAgentMiddleware } from 'langchain'
import { createAgentMiddleware, type AgentModel } from '@/agents/middleware.ts'

type ChatAgentParams = CreateAgentParams<Record<string, unknown>, undefined, AnyAnnotationRoot, undefined>

/** Exposes the unstructured overload as a single checked signature for IDE overload resolution. */
const createUnstructuredAgent: (configuration: ChatAgentParams) => ReactAgent = createLangChainAgent

/** Creates an agent from a caller-supplied model, tools, and system prompt without invoking it. */
export function createAgent(
  model: AgentModel,
  modelId: string,
  tools: CreateAgentParams['tools'] = [],
  systemPrompt?: CreateAgentParams['systemPrompt'],
  checkpointer?: CreateAgentParams['checkpointer'],
  middleware: AnyAgentMiddleware[] = createAgentMiddleware(model, modelId),
) {
  const configuration: ChatAgentParams = {
    model,
    tools,
    systemPrompt,
    checkpointer,
    middleware,
  }

  return createUnstructuredAgent(configuration)
}
