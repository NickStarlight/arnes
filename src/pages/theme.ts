import { getThemePreference, type ThemePreference } from '@/stores/settings.ts'

const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
let selectedTheme: ThemePreference = 'system'

/** Suggests matching browser and device chrome colors, including when the app overrides the OS theme. */
function updateDeviceTheme(dark: boolean): void {
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.content = dark ? '#000000' : '#ffffff'
  }

  const scheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')
  if (scheme) scheme.content = dark ? 'dark' : 'light'
}

/** Selects CSS theme tokens and synchronizes browser chrome without creating stylesheets. */
export async function applyTheme(theme: ThemePreference): Promise<void> {
  selectedTheme = theme
  const dark = theme === 'dark' || (theme === 'system' && systemTheme.matches)
  updateDeviceTheme(dark)

  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

/** Keeps the bundled theme usable when storage or a saved stylesheet is unavailable. */
async function restoreTheme(): Promise<void> {
  try {
    await applyTheme(await getThemePreference())
  } catch {
    await followSystemTheme()
  }
}

/** Tracks OS changes only in automatic mode and retains the current theme on failure. */
async function followSystemTheme(): Promise<void> {
  if (selectedTheme !== 'system') return

  try {
    await applyTheme('system')
  } catch {
    // Theme loading must not prevent the application from rendering.
  }
}

systemTheme.addEventListener('change', followSystemTheme)

export const themeReady = restoreTheme()
