import { i18n } from '@/i18n.ts'
import { getContextWindow } from '@/agents/model-context.ts'
import type { ContextUsage } from '@/agents/context-usage.ts'

type ContextMeterState = Readonly<{ model: string, usage?: ContextUsage }>

class ContextMeter extends HTMLElement {
  private meter = document.createElement('div')
  private trigger = document.createElement('button')
  private bar = document.createElement('span')
  private label = document.createElement('span')
  private helper = document.createElement('span')
  private current: ContextMeterState = { model: '' }

  /** Owns its markup and preserves state supplied before connection. */
  connectedCallback(): void {
    this.label.className = 'context-label'
    this.helper.className = 'context-helper'
    this.meter.className = 'context-track'
    this.bar.className = 'context-bar'
    this.meter.setAttribute('role', 'progressbar')
    this.meter.setAttribute('aria-valuemin', '0')
    this.meter.replaceChildren(this.bar)
    this.trigger.type = 'button'
    this.trigger.className = 'context-trigger'
    this.trigger.setAttribute('popovertarget', 'chat-context')
    this.trigger.replaceChildren(this.label, this.helper, this.meter)
    this.replaceChildren(this.trigger)
    this.render()
  }

  /** Accepts the selected model and active conversation usage as one consistent update. */
  set state(value: ContextMeterState) {
    this.current = value
    this.render()
  }

  /** Leaves unavailable or different-model usage unquantified instead of showing a misleading percentage. */
  private render(): void {
    const { model, usage } = this.current
    const limit = getContextWindow(model)
    this.hidden = !limit
    if (!limit) return

    const tokens = usage?.model === model ? usage.tokens : undefined
    const format = new Intl.NumberFormat(i18n.locale, { notation: 'compact' })

    this.meter.setAttribute('aria-valuemax', String(limit))
    if (tokens === undefined) this.meter.removeAttribute('aria-valuenow')
    else this.meter.setAttribute('aria-valuenow', String(Math.min(tokens, limit)))
    this.bar.style.width = `${Math.min(tokens ?? 0, limit) / limit * 100}%`
    this.label.textContent = i18n._('Context')
    this.helper.textContent = `${usage?.estimated ? '≈ ' : ''}${tokens === undefined ? '—' : format.format(tokens)} / ${format.format(limit)}`
    this.title = tokens === undefined
      ? i18n._('Token usage is available after the model reports it.')
      : usage?.estimated ? i18n._('Estimated context after compaction. Updated on the next model request.')
        : i18n._('Input and output tokens reported for the latest model request, including cached input. Draft text is not included.')
    this.meter.setAttribute('aria-label', i18n._('Context window usage'))
    this.meter.setAttribute('aria-valuetext', tokens === undefined ? this.title : this.helper.textContent)
  }
}

customElements.define('context-meter', ContextMeter)

export type { ContextMeter }
