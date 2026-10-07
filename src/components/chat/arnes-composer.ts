import { getModelOption, modelProviders } from '@/components/chat/model-options.ts'
import { renderModelDetails } from '@/components/chat/model-details.ts'
import { i18n } from '@/i18n.ts'
import '@/components/chat/context-meter.ts'
import type { ContextMeter } from '@/components/chat/context-meter.ts'
import '@/components/chat/context-menu.ts'
import type { ContextMenu } from '@/components/chat/context-menu.ts'
import type { ContextUsage } from '@/agents/context-usage.ts'
import { getProviderKey, getChatPreference, saveChatPreference, type ChatPreference } from '@/stores/settings.ts'

export type ArnesSubmission = {
  provider: string
  model: string
  effort: string
  message: string
}

const template = `<form class="composer" name="chat" method="post">
  <div class="composer-bar">
    <label class="composer-message"><span class="sr-only">${i18n._('User message')}</span>
      <textarea name="message" rows="1" cols="50"></textarea>
    </label>
    <button class="composer-send" type="submit" title="${i18n._('Submit')}">
      <svg aria-hidden="true" focusable="false"><use href="#arrow-right-icon" /></svg>
      <span class="sr-only">${i18n._('Submit')}</span>
    </button>
  </div>
  <div class="composer-footer">
    <button class="composer-settings-trigger" type="button" popovertarget="chat-settings">
      <span class="composer-settings-summary">${i18n._('Model')} + ${i18n._('Effort')}</span>
      <svg class="composer-settings-chevron" aria-hidden="true" focusable="false"><use href="#chevron-down-icon" /></svg>
    </button>
    <context-meter hidden></context-meter>
  </div>
  <div class="composer-panel composer-settings" id="chat-settings" popover aria-label="${i18n._('Settings')}">
    <div class="composer-model-settings">
      <label>${i18n._('Model')} <select name="model" required></select></label>
      <label>${i18n._('Effort')} <select name="effort"></select></label>
    </div>
    <section class="composer-model-details" aria-live="polite" aria-atomic="true"></section>
  </div>
  <context-menu class="composer-panel" id="chat-context" popover aria-label="${i18n._('Context')}"></context-menu>
  <output name="status" aria-live="polite"></output>
</form>`

class ArnesComposer extends HTMLElement {
  private initialized = false
  private streaming = false
  private canStop = false
  private loading = true
  private usage: ContextUsage | undefined
  private cost = 0
  private canCompact = false
  private compacting = false

  /** Owns form initialization and listeners without resetting drafts on reconnection. */
  connectedCallback(): void {
    if (this.initialized) return

    this.innerHTML = template

    this.querySelector('form')!.addEventListener('submit', this.submit)
    this.querySelector<HTMLButtonElement>('.composer-send')!.addEventListener('click', this.stop)
    this.querySelector('textarea')!.addEventListener('keydown', this.handleKeyDown)
    this.querySelector('textarea')!.addEventListener('input', this.resizeMessageInput)
    this.querySelector('[name="model"]')!.addEventListener('invalid', this.revealSettings)
    this.addEventListener('context-compact', this.compact)

    this.initialized = true
    this.busy = this.streaming
    this.renderContext()
    void this.loadSettings()
  }

  /** Exposes the required model field before native validation focuses it. */
  private revealSettings = (): void => {
    this.querySelector<HTMLElement>('#chat-settings')!.showPopover()
  }

  /** Reflects current selections in the compact trigger without exposing option identifiers. */
  private renderSettingsSummary(): void {
    const model = this.querySelector<HTMLSelectElement>('[name="model"]')!
    const effort = this.querySelector<HTMLSelectElement>('[name="effort"]')!
    const modelLabel = model.value ? model.selectedOptions[0]!.text : i18n._('Model')
    const effortLabel = effort.selectedOptions[0]?.text ?? i18n._('Effort')

    this.querySelector('.composer-settings-summary')!.textContent = `${modelLabel} + ${effortLabel}`
    this.renderContext()
  }

  /** Receives usage from the active conversation without subscribing inside the presentation component. */
  set contextUsage(value: ContextUsage | undefined) {
    this.usage = value
    this.renderContext()
  }

  /** Keeps conversation cost visible independently of the selected model and context usage. */
  set totalCost(value: number) {
    this.cost = value
    this.renderContext()
  }

  /** Receives conversation availability and ongoing compaction separately from generation. */
  set compaction(value: { available: boolean, active: boolean }) {
    this.canCompact = value.available
    this.compacting = value.active
    this.renderContext()
  }

  /** Uses the selected model's capacity and hides stale counts when the model changes. */
  private renderContext(): void {
    const meter = this.querySelector<ContextMeter>('context-meter')
    const model = this.querySelector<HTMLSelectElement>('[name="model"]')
    if (meter && model) meter.state = { model: model.value, usage: this.usage }
    const menu = this.querySelector<ContextMenu>('context-menu')
    if (menu && model) menu.state = {
      model: model.value,
      usage: this.usage,
      totalCost: this.cost,
      canCompact: this.canCompact && !this.streaming && !this.loading && Boolean(model.value),
      compacting: this.compacting,
    }
  }

  /** Adds the selected provider to manual compaction without submitting or clearing the draft. */
  private compact = (event: Event): void => {
    if (event.target !== this.querySelector('context-menu')) return
    event.stopPropagation()
    if (!this.canCompact || this.streaming || this.loading || this.compacting) return
    const model = this.querySelector<HTMLSelectElement>('[name="model"]')!
    const provider = model.selectedOptions[0]?.dataset.provider
    if (!provider || !model.value) return
    this.dispatchEvent(new CustomEvent('arnes-compact', {
      bubbles: true, detail: { provider, model: model.value },
    }))
  }

  /** Keeps the model preview in sync with restored preferences and model changes. */
  private renderSelectedModel(): void {
    const select = this.querySelector<HTMLSelectElement>('[name="model"]')!
    const model = getModelOption(select.selectedOptions[0]?.dataset.provider, select.value)
    renderModelDetails(this.querySelector<HTMLElement>('.composer-model-details')!, model)
  }

  /** Disables drafting and submission while the shell is busy or settings are loading. */
  set busy(value: boolean) {
    this.streaming = value
    this.renderAvailability()
  }

  /** Distinguishes an active response from other busy states that cannot be cancelled. */
  set generating(value: boolean) {
    this.canStop = value
    this.renderAvailability()
  }

  /** Flips the send action to Stop without enabling draft editing during generation. */
  private renderAvailability(): void {
    const button = this.querySelector<HTMLButtonElement>('.composer-send')
    const input = this.querySelector('textarea')

    if (input) input.disabled = this.streaming || this.loading || this.canStop
    if (!button) return

    const label = this.canStop ? i18n._('Stop generation') : i18n._('Submit')
    button.type = this.canStop ? 'button' : 'submit'
    button.disabled = !this.canStop && (this.streaming || this.loading)
    button.title = label
    button.querySelector('span')!.textContent = label
    button.querySelector('use')!.setAttribute('href', this.canStop ? `#stop-icon` : `#arrow-right-icon`)
    this.renderContext()
  }

  /** Cancels through a separate event so required form fields cannot block Stop. */
  private stop = (event: MouseEvent): void => {
    if (!this.canStop) return

    event.preventDefault()
    this.dispatchEvent(new CustomEvent('arnes-stop', { bubbles: true }))
  }

  /** Keeps request failures visible while preserving any newly entered draft. */
  set error(value: string | undefined) {
    const output = this.querySelector('output')

    if (output) output.value = value ?? ''
  }

  /** Restores dropdowns before allowing interaction, keeping initialization failures visible. */
  private async loadSettings(): Promise<void> {
    const selects = this.querySelectorAll('select')

    for (const select of Array.from(selects)) select.disabled = true

    this.error = i18n._('Loading settings…')

    try {
      await this.loadModels()
      await this.loadEfforts()

      this.loading = false
      this.error = undefined

      for (const select of Array.from(selects)) select.disabled = false
    } catch {
      this.error = i18n._('Unable to load settings. Reload to try again.')
    } finally {
      this.renderSettingsSummary()
      this.renderSelectedModel()
      this.busy = this.streaming
    }
  }

  /** Lists models only for providers with a saved non-empty API key. */
  private async loadModels(): Promise<void> {
    const select = this.querySelector<HTMLSelectElement>('[name="model"]')!
    const placeholder = new Option(i18n._('Select a model'), '', true, true)

    placeholder.disabled = true
    select.replaceChildren(placeholder)

    for (const provider of modelProviders) {
      const apiKey = await getProviderKey(provider.id)

      if (!apiKey) continue

      const group = document.createElement('optgroup')
      group.label = provider.label

      for (const model of provider.models) {
        const option = new Option(model.label, model.id)
        option.dataset.provider = provider.id
        group.append(option)
      }

      select.append(group)
    }

    await this.persistSelection(select)
  }

  /** Populates effort choices with medium selected unless a saved choice is available. */
  private async loadEfforts(): Promise<void> {
    const select = this.querySelector<HTMLSelectElement>('[name="effort"]')!
    const efforts = [
      { value: 'low', label: i18n._('Low') },
      { value: 'medium', label: i18n._('Medium') },
      { value: 'high', label: i18n._('High') },
    ]

    select.replaceChildren()

    for (const effort of efforts) {
      const selected = effort.value === 'medium'
      select.add(new Option(effort.label, effort.value, selected, selected))
    }

    await this.persistSelection(select)
  }

  /** Restores available choices and leaves defaults intact when a saved option is unavailable. */
  private async persistSelection(select: HTMLSelectElement): Promise<void> {
    const saved = await getChatPreference(select.name as ChatPreference)

    for (const option of select.options) {
      if (!option.disabled && option.value === saved) {
        select.value = saved
        break
      }
    }

    select.onchange = this.saveSelection
  }

  /** Persists selection changes without requiring a message submission. */
  private saveSelection = async (event: Event): Promise<void> => {
    const select = event.currentTarget as HTMLSelectElement

    this.renderSettingsSummary()
    if (select.name === 'model') this.renderSelectedModel()
    select.disabled = true

    try {
      await saveChatPreference(select.name as ChatPreference, select.value)
    } catch {
      this.error = i18n._('Unable to save selection. Try again.')
    } finally {
      select.disabled = false
    }
  }

  /** Fits the draft while CSS limits its height and allows scrolling for longer messages. */
  private resizeMessageInput = (): void => {
    const input = this.querySelector('textarea')!

    input.style.height = 'auto'
    input.style.height = `${input.scrollHeight}px`
  }

  /** Submits on Enter while preserving Shift+Enter newlines and IME composition. */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return

    event.preventDefault()

    if (event.repeat || this.loading || this.streaming) return

    const input = event.currentTarget as HTMLTextAreaElement

    input.form?.requestSubmit()
  }

  /** Emits validated user intent; agent execution belongs to the containing shell. */
  private submit = (event: SubmitEvent): void => {
    event.preventDefault()

    const form = event.currentTarget as HTMLFormElement
    const model = form.elements.namedItem('model') as HTMLSelectElement
    const effort = form.elements.namedItem('effort') as HTMLSelectElement
    const input = form.elements.namedItem('message') as HTMLTextAreaElement
    const provider = model.selectedOptions[0]?.dataset.provider
    const message = input.value.trim()

    if (this.loading || this.streaming || !message || !provider || !model.value) return

    input.value = ''
    this.resizeMessageInput()
    input.blur()

    this.dispatchEvent(new CustomEvent<ArnesSubmission>('arnes-submit', {
      bubbles: true,
      detail: { provider, model: model.value, effort: effort.value, message },
    }))
  }
}

customElements.define('arnes-composer', ArnesComposer)

export type { ArnesComposer }
