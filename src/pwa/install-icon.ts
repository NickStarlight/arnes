/** Rasterizes the favicon's lettermark into an embedded PNG without external assets. */
export function createInstallIcon(size: number): string | undefined {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) return undefined

  context.scale(size / 48, size / 48)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, 48, 48)
  context.fillStyle = '#161616'
  context.font = '48px sans-serif'
  context.textAlign = 'center'
  context.fillText('a', 24, 37)

  return canvas.toDataURL('image/png')
}
