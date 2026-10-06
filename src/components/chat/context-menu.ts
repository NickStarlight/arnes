import { i18n } from '@/i18n.ts'
import { getContextWindow } from '@/agents/model-context.ts'
import type { ContextUsage } from '@/agents/context-usage.ts'

type ContextMenuState = { model: string, usage?: ContextUsage, totalCost?: number, canCompact: boolean, compacting: boolean }

class ContextMenu extends HTMLElement {
  private current: ContextMenuState = { model: '', canCompact: false, compacting: false }
  private initialized = false

  /** Owns the context details and emits user intent without making provider requests. */
  connectedCallback(): void {
    if (!this.initialized) {
      this.innerHTML = `<h2>${i18n._('Context')}</h2>
        <dl>
          <div><dt>${i18n._('Context used')}</dt><dd data-context="used"></dd></div>
          <div><dt>${i18n._('Input')}</dt><dd data-context="input"></dd></div>
          <div><dt>${i18n._('Output')}</dt><dd data-context="output"></dd></div>
          <div><dt>${i18n._('Total estimated cost')}</dt><dd data-context="cost"></dd></div>
        </dl>
        <button type="button" class="context-compact"></button>
        <span class="sr-only" role="status"></span>`
      this.querySelector('button')!.addEventListener('click', this.compact)
      this.initialized = true
    }
    this.render()
  }

  /** Keeps details current while the popover is open or closed. */
  set state(value: ContextMenuState) {
    const completed = this.current.compacting && !value.compacting && value.usage?.estimated
    this.current = value
    if (this.initialized) this.render()
    if (completed && this.initialized) {
      this.querySelector('[role="status"]')!.textContent = i18n._('Context compacted.')
    }
  }

  /** Sends only explicit button activations; the composer supplies the selected provider. */
  private compact = (): void => {
    if (!this.current.canCompact || this.current.compacting) return
    this.dispatchEvent(new CustomEvent('context-compact', { bubbles: true }))
  }

  /** Updates a single value without rebuilding the focused popover controls. */
  private value(name: string, text: string): void {
    this.querySelector<HTMLElement>(`[data-context="${name}"]`)!.textContent = text
  }

  /** Distinguishes reported request usage from the local estimate after manual compaction. */
  private render(): void {
    const { model, canCompact, compacting } = this.current
    const usage = this.current.usage?.model === model ? this.current.usage : undefined
    const format = new Intl.NumberFormat(i18n.locale)
    const limit = getContextWindow(model)
    const used = usage ? `${usage.estimated ? '≈ ' : ''}${format.format(usage.tokens)}` : '—'
    this.value('used', `${used} / ${limit ? format.format(limit) : '—'}`)
    this.value('input', usage && !usage.estimated ? format.format(usage.inputTokens) : '—')
    this.value('output', usage && !usage.estimated ? format.format(usage.outputTokens) : '—')
    const cost = this.current.totalCost
    this.value('cost', cost === undefined ? '—' : new Intl.NumberFormat(i18n.locale, {
      style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 6,
    }).format(cost))
    const button = this.querySelector('button')!
    button.disabled = !canCompact || compacting
    button.textContent = compacting ? i18n._('Compacting…') : i18n._('Compact now')
    this.querySelector('[role="status"]')!.textContent = compacting ? i18n._('Compacting…') : ''
  }
}

customElements.define('context-menu', ContextMenu)

export type { ContextMenu }
