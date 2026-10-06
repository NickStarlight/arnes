interface InstallPromptEvent extends Event {
  /** Opens the browser-owned dialog once, directly from a user gesture. */
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let pendingPrompt: InstallPromptEvent | undefined
export const installPromptChanges = new EventTarget()

/** Captures browser eligibility independently of the currently mounted view. */
function capturePrompt(event: Event): void {
  event.preventDefault()
  pendingPrompt = event as InstallPromptEvent
  installPromptChanges.dispatchEvent(new Event('change'))
}

/** Discards a consumed prompt and updates every mounted install control. */
function clearPrompt(): void {
  pendingPrompt = undefined
  installPromptChanges.dispatchEvent(new Event('change'))
}

/** Reports whether the browser has supplied a one-use installation prompt. */
export function canInstall(): boolean {
  return pendingPrompt !== undefined
}

/** Takes the prompt synchronously so callers retain the click's user activation. */
export function takeInstallPrompt(): InstallPromptEvent | undefined {
  const prompt = pendingPrompt
  clearPrompt()
  return prompt
}

window.addEventListener('beforeinstallprompt', capturePrompt)
window.addEventListener('appinstalled', clearPrompt)
