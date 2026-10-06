import { vectorLogos } from '@/components/provider-logos.ts'

class ProviderLogo extends HTMLElement {
  /** Renders repository-owned SVG templates with CSS-controlled light and dark variants. */
  connectedCallback(): void {
    const name = this.getAttribute('name') ?? ''
    if (!Object.hasOwn(vectorLogos, name)) return

    const logo = vectorLogos[name]
    this.classList.add('provider-logo')
    this.classList.toggle('provider-logo-themed', Boolean(logo.dark))
    this.setAttribute('role', 'img')
    this.style.width = `${Number(this.getAttribute('width'))}px`
    this.style.aspectRatio = `${Number(this.getAttribute('width'))} / ${Number(this.getAttribute('height'))}`
    this.innerHTML = `<span class="logo-light" aria-hidden="true">${logo.light}</span>
      ${logo.dark ? `<span class="logo-dark" aria-hidden="true">${logo.dark}</span>` : ''}`
  }
}

customElements.define('provider-logo', ProviderLogo)
