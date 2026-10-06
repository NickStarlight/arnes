const assets: Record<string, string> = import.meta.glob<string>('@/assets/logos/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export const vectorLogos: Record<string, { light: string, dark?: string }> = {}

for (const path of Object.keys(assets)) {
  if (path.endsWith('-dark.svg')) continue

  const name = path.slice(path.lastIndexOf('/') + 1, -4)
  vectorLogos[name] = {
    light: assets[path],
    dark: assets[`${path.slice(0, -4)}-dark.svg`],
  }
}
