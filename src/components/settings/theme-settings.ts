import { i18n } from '@/i18n.ts'
import { applyTheme, themeReady } from '@/pages/theme.ts'
import { getThemePreference, saveThemePreference, type ThemePreference } from '@/stores/settings.ts'

class ThemeSettings extends HTMLElement {
  private initialized = false

  /** Offers bundled theme options and applies changes immediately. */
  connectedCallback(): void {
    if (this.initialized) return
    this.initialized = true
    this.innerHTML = `<fieldset>
      <legend><h2 id="theme-heading">${i18n._('Theme')}</h2></legend>
      <select id="theme" name="theme" aria-labelledby="theme-heading" aria-describedby="theme-status" disabled>
        <option value="system">${i18n._('System')}</option>
        <option value="light">${i18n._('Light')}</option>
        <option value="dark">${i18n._('Dark')}</option>
      </select>
      <output class="field-status" id="theme-status" for="theme" aria-live="polite"></output>
    </fieldset>`
    this.querySelector('select')!.addEventListener('change', this.save)
    void this.load()
  }

  /** Waits for startup restoration to avoid competing stylesheet replacements. */
  private async load(): Promise<void> {
    try {
      await themeReady
      this.querySelector('select')!.value = await getThemePreference()
      this.querySelector('select')!.disabled = false
    } catch {
      this.querySelector('output')!.value = i18n._('Unable to load settings. Reload to try again.')
    }
  }

  /** Validates loading before persistence, restoring the saved theme if saving fails. */
  private save = async (): Promise<void> => {
    const select = this.querySelector('select')!
    const status = this.querySelector('output')!
    const value = select.value
    if (select.disabled || (value !== 'system' && value !== 'light' && value !== 'dark')) return

    select.disabled = true
    let previous: ThemePreference | undefined

    try {
      previous = await getThemePreference()
      await applyTheme(value)
      await saveThemePreference(value)
      status.value = ''
    } catch {
      if (previous !== undefined) {
        select.value = previous
        try {
          await applyTheme(previous)
        } catch {
          await applyTheme('system')
        }
      }
      status.value = i18n._('Unable to save settings. Try again.')
    } finally {
      select.disabled = false
    }
  }
}

customElements.define('theme-settings', ThemeSettings)
