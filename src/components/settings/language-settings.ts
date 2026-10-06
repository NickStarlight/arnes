import { i18n } from '@/i18n.ts'
import { getLanguagePreference, saveLanguagePreference } from '@/stores/settings.ts'

const template = `<fieldset>
    <legend><h3 id="language-heading">${i18n._('Language')}</h3></legend>
    <select id="language" name="language" aria-labelledby="language-heading" aria-describedby="language-status" disabled>
      <option value="">${i18n._('Use browser language')}</option>
      <option value="en">English</option>
      <option value="pt-BR">Português (Brasil)</option>
    </select>
    <output class="field-status" id="language-status" for="language" aria-live="polite"></output>
</fieldset>`

class LanguageSettings extends HTMLElement {
  private initialized = false

  /** Restores the saved preference once without adding duplicate listeners on reconnection. */
  connectedCallback(): void {
    if (this.initialized) return

    this.innerHTML = template
    this.querySelector('select')!.addEventListener('change', this.save)
    this.initialized = true
    void this.load()
  }

  /** Keeps selection disabled when storage cannot supply the current preference. */
  private async load(): Promise<void> {
    const select = this.querySelector('select')!
    const status = this.querySelector('output')!

    try {
      select.value = await getLanguagePreference()
      select.disabled = false
      status.value = ''
    } catch {
      status.value = i18n._('Unable to load settings. Reload to try again.')
    }
  }

  /** Reloads after persistence so every page template uses the newly selected locale. */
  private save = async (): Promise<void> => {
    const select = this.querySelector('select')!
    const status = this.querySelector('output')!
    const value = select.value

    if (select.disabled || (value !== '' && value !== 'en' && value !== 'pt-BR')) return

    select.disabled = true

    try {
      await saveLanguagePreference(value)
      location.reload()
    } catch {
      status.value = i18n._('Unable to save settings. Try again.')
      select.disabled = false
    }
  }
}

customElements.define('language-settings', LanguageSettings)
