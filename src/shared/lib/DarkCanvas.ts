import { normalizeCssColor } from './utils/normalizeCssColor'

const PAINTED_PROPERTIES = ['fill', 'stroke']

const DARK_COUNTERPART_OF_LIGHT_NEUTRAL = new Map([
  ['rgb(29,29,29)', '#e6e6e6'],
  ['rgb(107,102,102)', '#b3b3b3'],
  ['rgb(255,255,255)', '#262626'],
  ['rgb(249,247,247)', '#1e1e1e'],
  ['rgb(230,226,226)', '#4d4d4d'],
  ['rgba(29,29,29,0.024)', 'rgba(230,230,230,0.04)'],
])

const COLORLESS_FILLS = ['', 'none', 'transparent', 'rgb(143,138,138)']

const NEUTRAL_FILLS = new Set([
  ...COLORLESS_FILLS,
  ...DARK_COUNTERPART_OF_LIGHT_NEUTRAL.keys(),
  ...[...DARK_COUNTERPART_OF_LIGHT_NEUTRAL.values()].map(normalizeCssColor),
])

const DARK_CHROME_THEME = 'dark'

// The Miragon renderers draw with fixed light brand neutrals and offer no dark mode, so the canvas is repainted.
// Shapes drawn on a notation colour (stickies, team types) keep their look, including their dark text.
export class DarkCanvas {
  paint(root: Element): void {
    const notationColoredVisuals = new Set(
      [...root.querySelectorAll('.djs-visual')].filter(visual => this.hasNotationBackground(visual)),
    )

    root.querySelectorAll<SVGElement>('*').forEach((element) => {
      const visual = element.closest('.djs-visual')
      if (!visual || !notationColoredVisuals.has(visual)) this.paintElement(element)
    })
  }

  follow(container: HTMLElement): () => void {
    container.setAttribute('data-cd-theme', DARK_CHROME_THEME)
    this.paint(container)

    const repaintOnRender = new MutationObserver(() => this.paint(container))
    repaintOnRender.observe(container, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] })
    return () => repaintOnRender.disconnect()
  }

  private paintElement(element: SVGElement): void {
    for (const property of PAINTED_PROPERTIES) {
      const darkCounterpart = DARK_COUNTERPART_OF_LIGHT_NEUTRAL.get(this.color(element, property))
      if (darkCounterpart) element.style.setProperty(property, darkCounterpart)
    }
  }

  private hasNotationBackground(visual: Element): boolean {
    const background = visual.firstElementChild as SVGElement | null
    return background !== null && !NEUTRAL_FILLS.has(this.color(background, 'fill'))
  }

  private color(element: SVGElement, property: string): string {
    return normalizeCssColor(element.style?.getPropertyValue(property) ?? '')
  }
}
