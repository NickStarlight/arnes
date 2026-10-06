import type { ModelOption } from '@/components/chat/model-options.ts'
import { renderModelFacts } from '@/components/chat/model-facts.ts'
import { getModelSpecifications } from '@/agents/model-specifications.ts'
import { i18n } from '@/i18n.ts'
import '@/components/provider-logo.ts'

/** Renders only trusted model-catalog metadata, never user messages or stored conversation text. */
export function renderModelDetails(container: HTMLElement, model: ModelOption | undefined): void {
  if (!model) {
    container.innerHTML = `<p>${i18n._('Select a model to see its details.')}</p>`
    return
  }

  container.innerHTML = `<div class="composer-model-overview">
    <provider-logo name="${model.brand.logo}" aria-label="${model.brand.label}" width="${model.brand.width}" height="${model.brand.height}"></provider-logo>
    <h3>${model.label}</h3>
    <p>${model.description}</p>
    <a href="${model.website}" target="_blank" rel="noopener noreferrer">${i18n._('Visit website')}</a>
  </div>`

  const specifications = getModelSpecifications(model.id)
  if (specifications) container.append(renderModelFacts(specifications))
}
