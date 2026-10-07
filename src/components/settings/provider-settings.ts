import { i18n } from '@/i18n.ts'
import { getProviderKey, saveProviderKey } from '@/stores/settings.ts'
import '@/components/provider-logo.ts'

type Provider = {
  label: string
  description: string
  logo: string
  width: number
  height: number
  website: string
  privacy: string
}

const providers: Record<string, Provider> = {
  'together-ai': {
    label: "Together AI",
    description: i18n._("A cloud platform for running, fine-tuning, and training AI models."),
    logo: 'together-ai',
    width: 119,
    height: 26,
    website: 'https://www.together.ai/',
    privacy: 'https://www.together.ai/privacy',
  },
  'anthropic': {
    label: "Anthropic",
    description: i18n._("Access Claude models through the Anthropic API."),
    logo: 'anthropic',
    width: 143,
    height: 16,
    website: 'https://www.anthropic.com/',
    privacy: 'https://www.anthropic.com/legal/privacy',
  },
  'openai': {
    label: "OpenAI",
    description: i18n._("Access OpenAI models through the OpenAI API."),
    logo: 'openai',
    width: 90,
    height: 24,
    website: 'https://openai.com/',
    privacy: 'https://openai.com/policies/privacy-policy/',
  },
}

let nextId = 0

/** Interpolates only trusted provider metadata, never saved credentials or attribute values. */
function renderProvider(provider: Provider, id: string): string {
  return `
    <form method="post" autocomplete="off" aria-labelledby="${id}-heading">
      <fieldset>
        <legend><h2 id="${id}-heading">${provider.label}</h2></legend>
        <provider-logo name="${provider.logo}" aria-label="${provider.label}" width="${provider.width}" height="${provider.height}"></provider-logo>
        <p>${provider.description}</p>
        <p>
          <a href="${provider.website}" target="_blank" rel="noopener noreferrer">${i18n._("Visit website")} <span aria-hidden="true">↗</span></a>
          <a href="${provider.privacy}" target="_blank" rel="noopener noreferrer">${i18n._("Privacy policy")} <span aria-hidden="true">↗</span></a>
        </p>
        <p>${i18n._("{provider} is not affiliated with or an endorser of this project.", { provider: provider.label })}</p>
        <p>
          <label for="${id}-key">${i18n._("API key")}</label>
          <input id="${id}-key" name="apiKey" type="password" required pattern=".*\\S.*" title="${i18n._("Enter a non-empty API key")}" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="${id}-status" />
        </p>
        <div>
          <output class="field-status" id="${id}-status" name="status" for="${id}-key" aria-live="polite"></output>
          <button name="save" type="submit">${i18n._("Save key")}</button>
        </div>
      </fieldset>
    </form>
  `
}

class ProviderSettings extends HTMLElement {
  private provider: string | undefined

  /** Accepts a known provider on first connection and preserves drafts on reconnection. */
  connectedCallback(): void {
    if (this.provider) return

    const provider = this.getAttribute('provider')

    if (!provider || !Object.hasOwn(providers, provider)) {
      throw new Error('Provider settings requires a known provider')
    }

    this.innerHTML = renderProvider(providers[provider], `provider-${nextId++}`)
    this.provider = provider

    const form = this.querySelector('form')!
    form.name = provider
    form.addEventListener('submit', this.save)
    void this.load(form)
  }

  /** Prevents edits until the saved credential is available. */
  private async load(form: HTMLFormElement): Promise<void> {
    const fieldset = form.querySelector('fieldset')!
    const status = form.elements.namedItem('status') as HTMLOutputElement

    fieldset.disabled = true
    status.value = i18n._("Loading…")

    try {
      form.querySelector('input')!.value = await getProviderKey(this.provider!)
      status.value = ''
      fieldset.disabled = false
    } catch {
      status.value = i18n._("Unable to load API key. Reload to try again.")
    }
  }

  /** Saves the trimmed key after native validation and announces feedback in this form. */
  private save = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault()

    const form = event.currentTarget as HTMLFormElement
    const input = form.elements.namedItem('apiKey') as HTMLInputElement
    const status = form.elements.namedItem('status') as HTMLOutputElement
    const fieldset = form.querySelector('fieldset')!

    if (fieldset.disabled) return

    fieldset.disabled = true
    status.value = i18n._("Saving…")
    status.dataset.state = 'saving'

    try {
      await saveProviderKey(this.provider!, input.value)
      status.value = i18n._("Saved")
      status.dataset.state = 'saved'
    } catch {
      status.value = i18n._("Unable to save API key. Try again.")
      status.dataset.state = 'error'
    } finally {
      fieldset.disabled = false
    }
  }
}

customElements.define('provider-settings', ProviderSettings)
