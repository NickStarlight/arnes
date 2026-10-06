import type { ModelCapability, ModelSpecifications } from '@/agents/model-specifications.ts'
import { i18n } from '@/i18n.ts'

/** Labels provider-level capabilities without implying the composer accepts each input format. */
function renderCapabilities(capabilities: readonly ModelCapability[]): HTMLElement {
  const labels: Record<ModelCapability, string> = {
    text: i18n._('Text'),
    vision: i18n._('Vision'),
    audio: i18n._('Audio'),
    tools: i18n._('Tool use'),
    reasoning: i18n._('Reasoning'),
  }
  const list = document.createElement('ul')
  list.className = 'model-capabilities'
  list.setAttribute('aria-label', i18n._('Model capabilities'))

  for (const capability of capabilities) {
    const item = document.createElement('li')
    item.textContent = labels[capability]
    list.append(item)
  }

  return list
}

/** Preserves sub-cent rates while formatting currency for the active language. */
function appendRate(list: HTMLUListElement, label: string, value: number): void {
  const item = document.createElement('li')
  const amount = new Intl.NumberFormat(i18n.locale, {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 3,
  }).format(value)
  item.textContent = `${label} ${amount}`
  list.append(item)
}

/** Shows standard text-token rates with their units and any context-dependent caveat. */
function renderPricing(specifications: ModelSpecifications): HTMLElement {
  const section = document.createElement('div')
  section.className = 'model-cost'
  const rates = document.createElement('ul')
  rates.className = 'model-pricing'
  rates.setAttribute('aria-label', i18n._('Cost'))
  appendRate(rates, i18n._('Input'), specifications.input)
  appendRate(rates, i18n._('Output'), specifications.output)
  if (specifications.cachedInput !== undefined) {
    appendRate(rates, i18n._('Cached input'), specifications.cachedInput)
  }
  section.append(rates)

  const unit = document.createElement('small')
  unit.textContent = i18n._('USD / 1M tokens')
  unit.title = i18n._('USD per 1M text tokens · standard rates')
  section.append(unit)

  if (specifications.longContextPricing) {
    const note = document.createElement('small')
    note.textContent = i18n._('Higher rates apply to long contexts.')
    section.append(note)
  }
  return section
}

/** Groups model capabilities above cost in the preview's right-hand column. */
export function renderModelFacts(specifications: ModelSpecifications): HTMLElement {
  const facts = document.createElement('aside')
  facts.className = 'composer-model-facts'
  facts.append(renderCapabilities(specifications.capabilities), renderPricing(specifications))
  return facts
}
