/**
 * Registers the Pages service worker that unlocks Chrome's
 * `beforeinstallprompt`. Portable single-file builds ship no worker file and
 * stay self-contained, so registration happens only in Pages builds.
 * Failures are silent: the app is fully usable without installation.
 */
function registerServiceWorker(): void {
  navigator.serviceWorker.register('./sw.js').catch(() => {})
}

if (import.meta.env.MODE === 'pages') registerServiceWorker()
