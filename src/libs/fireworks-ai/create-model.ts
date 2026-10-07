import { ChatFireworks, type ChatFireworksInput } from '@langchain/fireworks'

/**
 * Sends OpenAI SDK requests without the SDK's telemetry headers.
 * Fireworks' CORS allowlist covers only Authorization and Content-Type, so a preflight that
 * also lists x-stainless-* or user-agent is answered without Access-Control-Allow-* headers
 * and the browser blocks the request. The SDK offers no switch for these headers, so they are
 * stripped here to keep the preflight identical to a plain fetch call.
 */
function fetchWithinFireworksCors(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)

  for (const name of [...headers.keys()]) {
    if (name.startsWith('x-stainless-') || name === 'user-agent') headers.delete(name)
  }

  return fetch(input, { ...init, headers })
}

/**
 * Creates a model with retries delegated to agent middleware to avoid nested retry loops.
 * The adapter consumes `configuration` at runtime but omits it from its input type,
 * so the CORS-safe fetch is passed through a cast.
 */
export function createFireworksModel(model: string, apiKey: string): ChatFireworks {
  return new ChatFireworks({
    model,
    apiKey,
    maxRetries: 0,
    configuration: { fetch: fetchWithinFireworksCors },
  } as ChatFireworksInput)
}