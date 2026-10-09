/**
 * Pages-build service worker.
 *
 * Chrome fires `beforeinstallprompt` only for sites that register a service
 * worker with a `fetch` handler, even though installing from the browser menu
 * no longer requires one. This worker claims that handler without intercepting
 * anything: requests fall through to the network, and Chrome supplies its own
 * default offline page for installed copies.
 */
self.addEventListener('fetch', () => {})
