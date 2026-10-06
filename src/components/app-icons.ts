import icons from '@/assets/icons.svg?raw'

class AppIcons extends HTMLElement {
  /** Mounts native SVG symbol definitions for document-local fragment references. */
  connectedCallback(): void {
    this.innerHTML = icons as string
  }
}

customElements.define('app-icons', AppIcons)
