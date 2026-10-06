/** Fits the app to the visible area when a mobile keyboard resizes or pans the viewport. */
export function observeViewport(element: HTMLElement): (() => void) | undefined {
  const viewport = window.visualViewport
  if (!viewport) return

  /** Preserves native pinch zoom rather than resizing the layout around magnified content. */
  function update(): void {
    if (viewport!.scale !== 1) return

    element.style.setProperty('--app-viewport-height', `${viewport!.height}px`)
    element.style.setProperty('--app-viewport-top', `${viewport!.offsetTop}px`)
  }

  viewport.addEventListener('resize', update)
  viewport.addEventListener('scroll', update)
  update()

  /** Releases listeners and restores CSS sizing when the app disconnects. */
  return (): void => {
    viewport.removeEventListener('resize', update)
    viewport.removeEventListener('scroll', update)
    element.style.removeProperty('--app-viewport-height')
    element.style.removeProperty('--app-viewport-top')
  }
}
