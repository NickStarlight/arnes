import { i18n } from '@/i18n.ts'
import { wipeData } from '@/libs/dexie/data-control.ts'
import { exportData } from '@/stores/data-control.ts'

const template = `<form name="export" method="post" aria-labelledby="export-heading">
    <fieldset>
      <legend><h2 id="export-heading">${i18n._("Export my data")}</h2></legend>
      <p id="export-help">${i18n._("Download a JSON file containing your saved conversations, checkpoints, memory, and settings.")}</p>
      <p id="export-keys">${i18n._("Includes your saved API keys in plain text. Keep this file private.")}</p>
      <div>
        <output name="status" aria-live="polite"></output>
        <button type="submit" aria-describedby="export-help export-keys">${i18n._("Export my data")}</button>
      </div>
    </fieldset>
  </form>

  <form name="reset" method="post" aria-labelledby="reset-heading">
    <fieldset>
      <legend><h2 id="reset-heading">${i18n._("Wipe all data")}</h2></legend>
      <p id="reset-help">${i18n._("Delete all saved conversations, checkpoints, API keys, memory, base prompt, model selection, and preferences from this device. This cannot be undone.")}</p>
      <div>
        <output name="status" aria-live="polite"></output>
        <button type="submit" aria-describedby="reset-help">${i18n._("Wipe all data")}</button>
      </div>
    </fieldset>
  </form>`

class DataControlSettings extends HTMLElement {
  private initialized = false
  private busy = false

  /** Connects the actions once so reconnection does not duplicate downloads or wipes. */
  connectedCallback(): void {
    if (this.initialized) return

    this.innerHTML = template
    for (const form of Array.from(this.querySelectorAll('form'))) form.addEventListener('submit', this.submit)
    this.initialized = true
  }

  /** Prevents overlapping actions and reloads cleared settings only after a successful wipe. */
  private submit = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault()
    if (this.busy) return

    const form = event.currentTarget as HTMLFormElement
    const reset = form.name === 'reset'
    const status = form.elements.namedItem('status') as HTMLOutputElement

    if (reset && !window.confirm(i18n._('Wipe all data from this device? This cannot be undone.'))) return

    this.setBusy(true)
    status.value = reset ? i18n._('Deleting…') : i18n._('Exporting…')

    try {
      if (reset) {
        await wipeData()
        location.reload()
      } else {
        await exportData()
        status.value = i18n._('Download started.')
      }
    } catch {
      status.value = reset
        ? i18n._('Unable to wipe data. Try again.')
        : i18n._('Unable to export data. Try again.')
    } finally {
      this.setBusy(false)
    }
  }

  /** Disables both controls while either operation is using the saved data. */
  private setBusy(busy: boolean): void {
    this.busy = busy
    for (const fieldset of Array.from(this.querySelectorAll('fieldset'))) fieldset.disabled = busy
  }
}

customElements.define('data-control-settings', DataControlSettings)
