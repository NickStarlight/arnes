arnes runs entirely in your browser. It calls AI and search APIs directly with your keys, without an application backend or proxy. **Provider support depends on CORS.**

## Why CORS matters

Browsers restrict requests from a page to APIs on another origin. CORS (Cross-Origin Resource Sharing) is how the API server allows your browser to access its responses.

The provider must allow the origin running arnes, the request method, and the headers used for authentication and request data. When the browser sends an `OPTIONS` preflight, the API must allow that too.

Without those permissions, arnes cannot read the API response. This must be supported by the provider; arnes cannot enable it from the client. APIs that require a server-side proxy do not fit this architecture.

Self-hosting still requires the provider to allow requests from your installation's origin.

## Supported providers

| Provider | Used for |
| --- | --- |
| OpenAI | AI models |
| Anthropic | AI models |
| Together AI | AI models |
| Fireworks* | AI models |
| Tavily | Web search and page reading |

\* Fireworks' CORS configuration only allows the `Authorization` and `Content-Type` request headers. The SDK arnes uses for it would also send telemetry headers, which the preflight rejects, so arnes strips them from every Fireworks request.

Add your API keys in **Settings → Providers**. Choose an AI model from the model picker.
