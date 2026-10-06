import { createInstallIcon } from '@/pwa/install-icon.ts'

/** Embeds installation metadata with absolute URLs because data URLs cannot resolve relative paths. */
function attachManifest(): void {
  if (location.protocol !== 'https:' && location.protocol !== 'http:') return

  const startUrl = new URL(location.href)
  startUrl.search = ''
  startUrl.hash = ''

  const icons: { src: string, sizes: string, type: string, purpose: string }[] = []
  for (const size of [192, 512]) {
    const src = createInstallIcon(size)
    if (!src) return
    icons.push({ src, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })
  }

  const manifest = {
    id: startUrl.href,
    name: 'arnes',
    short_name: 'arnes',
    start_url: startUrl.href,
    scope: new URL('./', startUrl).href,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons,
  }

  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`
  document.head.append(link)
}

attachManifest()
