/** Announces loading with a decorative ring and rotating arc. */
export function createInlineLoading(label: string): HTMLElement {
  const status = document.createElement('span')
  status.className = 'inline-loading'
  status.setAttribute('role', 'status')
  status.innerHTML = `<svg class="inline-loading-spinner" viewBox="-42 -42 84 84" aria-hidden="true" focusable="false">
    <circle class="inline-loading-track" cx="0" cy="0" r="30" />
    <circle class="inline-loading-arc" cx="0" cy="0" r="30" />
  </svg>`

  const text = document.createElement('span')
  text.textContent = label
  status.append(text)

  return status
}
