import { i18n } from '@/i18n.ts'
import { getAssistantSetting, saveAssistantSetting, type AssistantSetting } from '@/stores/settings.ts'

const template = `<details aria-labelledby="assistant-heading">
  <summary>
    <svg class="settings-chevron" aria-hidden="true" focusable="false"><use href="#chevron-down-icon" /></svg>
    <h2 id="assistant-heading">${i18n._("Assistant")}</h2>
  </summary>

  <form name="assistant-prompt" method="post" autocomplete="off" aria-labelledby="base-prompt-heading">
    <fieldset>
      <legend><h3 id="base-prompt-heading">${i18n._("Base prompt")}</h3></legend>
      <p id="base-prompt-description">${i18n._("Set the instructions that guide the assistant's responses.")}</p>
      <p>
        <label for="base-prompt">${i18n._("Instructions")}</label>
        <textarea id="base-prompt" name="basePrompt" rows="6" aria-describedby="base-prompt-description base-prompt-status"></textarea>
      </p>
      <div>
        <output class="field-status" id="base-prompt-status" name="status" for="base-prompt" aria-live="polite"></output>
        <button name="save" type="submit">${i18n._("Save prompt")}</button>
      </div>
    </fieldset>
  </form>

  <form name="assistant-memory" method="post" autocomplete="off" aria-labelledby="memory-heading">
    <fieldset>
      <legend><h3 id="memory-heading">${i18n._("Memory")}</h3></legend>
      <p id="memory-description">${i18n._("Review and edit what the assistant remembers across conversations.")}</p>
      <p>
        <label for="assistant-memory">${i18n._("Saved memory")}</label>
        <textarea id="assistant-memory" name="memory" rows="6" aria-describedby="memory-description memory-status"></textarea>
      </p>
      <div>
        <output class="field-status" id="memory-status" name="status" for="assistant-memory" aria-live="polite"></output>
        <button name="save" type="submit">${i18n._("Save memory")}</button>
        <button name="clear" type="button" disabled>${i18n._("Clear memory")}</button>
      </div>
    </fieldset>
  </form>
</details>`

class AssistantSettings extends HTMLElement {
  private initialized = false

  /** Initializes once so reconnecting preserves drafts and does not duplicate listeners. */
  connectedCallback(): void {
    if (this.initialized) return

    this.innerHTML = template

    for (const form of Array.from(this.querySelectorAll<HTMLFormElement>('form'))) {
      form.addEventListener('submit', this.save)
      void this.load(form)
    }

    this.initialized = true
  }

  /** Disables editing until persisted text is loaded so drafts cannot be overwritten. */
  private async load(form: HTMLFormElement): Promise<void> {
    const fieldset = form.querySelector('fieldset')!
    const field = form.querySelector('textarea')!
    const status = form.elements.namedItem('status') as HTMLOutputElement

    fieldset.disabled = true
    status.value = i18n._("Loading…")

    try {
      field.value = await getAssistantSetting(field.name as AssistantSetting)
      status.value = ''
      fieldset.disabled = false
    } catch {
      status.value = i18n._("Unable to load settings. Reload to try again.")
    }
  }

  /** Preserves whitespace and intentionally empty settings after native validation. */
  private save = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault()

    const form = event.currentTarget as HTMLFormElement
    const field = form.querySelector('textarea')!
    const status = form.elements.namedItem('status') as HTMLOutputElement
    const fieldset = form.querySelector('fieldset')!

    if (fieldset.disabled) return

    fieldset.disabled = true
    status.value = i18n._("Saving…")
    status.dataset.state = 'saving'

    try {
      await saveAssistantSetting(field.name as AssistantSetting, field.value)
      status.value = i18n._("Saved")
      status.dataset.state = 'saved'
    } catch {
      status.value = i18n._("Unable to save settings. Try again.")
      status.dataset.state = 'error'
    } finally {
      fieldset.disabled = false
    }
  }
}

customElements.define('assistant-settings', AssistantSettings)
