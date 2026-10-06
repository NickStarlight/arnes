import { i18n } from '@/i18n.ts'

/** Copies the original response text, preserving Markdown and excluding message controls. */
export function createMessageCopy(text: string): HTMLElement {
  const actions = document.createElement('div')
  actions.className = 'message-actions'

  const button = document.createElement('button')
  button.type = 'button'
  button.innerHTML = '<svg aria-hidden="true" focusable="false"><use href="#copy-icon" /></svg>'
  button.title = i18n._('Copy response')
  button.setAttribute('aria-label', i18n._('Copy response'))

  const status = document.createElement('span')
  status.setAttribute('role', 'status')
  let resetTimer: number | undefined

  /** Returns the control to its idle state before another attempt or after confirmation expires. */
  function reset(): void {
    window.clearTimeout(resetTimer)
    if (button.dataset.copied === 'true') button.dataset.copied = 'false'
    button.querySelector('use')!.setAttribute('href', '#copy-icon')
    status.textContent = ''
    status.className = ''
  }

  /** Reports clipboard permission failures and only confirms a completed write. */
  button.onclick = async (): Promise<void> => {
    button.disabled = true
    reset()

    try {
      await navigator.clipboard.writeText(text)
      button.querySelector('use')!.setAttribute('href', '#checkmark-icon')
      button.dataset.copied = 'true'
      status.className = 'sr-only'
      status.textContent = i18n._('Copied')
      resetTimer = window.setTimeout(reset, 1500)
    } catch {
      status.textContent = i18n._('Unable to copy. Select the text and copy it manually.')
    } finally {
      button.disabled = false
    }
  }

  actions.append(button, status)
  return actions
}
