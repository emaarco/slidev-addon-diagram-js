const OFFSCREEN_WIDTH = '1920px'
const OFFSCREEN_HEIGHT = '1080px'
const VIEWBOX_PADDING_RATIO = 0.02

let renderedSvgCount = 0

export async function renderStaticSvg(
  exportSvg: (container: HTMLElement) => Promise<string>,
): Promise<string> {
  const container = createOffscreenContainer()
  try {
    return toEmbeddableSvg(await exportSvg(container))
  } finally {
    container.remove()
  }
}

function createOffscreenContainer(): HTMLElement {
  const container = document.createElement('div')
  container.style.width = OFFSCREEN_WIDTH
  container.style.height = OFFSCREEN_HEIGHT
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  document.body.appendChild(container)
  return container
}

function toEmbeddableSvg(exportedSvg: string): string {
  const svgDocument = new DOMParser().parseFromString(exportedSvg, 'image/svg+xml')
  const svgElement = svgDocument.documentElement

  svgDocument.querySelectorAll('script, foreignObject').forEach(el => el.remove())
  makeIdsUniqueInPage(svgElement)
  padViewBoxAndPinIntrinsicSize(svgElement)
  svgElement.style.removeProperty('width')
  svgElement.style.removeProperty('height')
  svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')

  return svgElement.outerHTML
}

// Pinning the intrinsic size lets the embedding max-width/max-height only scale
// the SVG down. height:100% would collapse to 0 inside a flex parent (e.g. the
// toolkit's DiagramFrame).
function padViewBoxAndPinIntrinsicSize(svgElement: HTMLElement): void {
  const viewBox = svgElement.getAttribute('viewBox')
  if (!viewBox) return

  const [x, y, width, height] = viewBox.split(' ').map(Number)
  const pad = Math.max(width, height) * VIEWBOX_PADDING_RATIO
  const paddedWidth = width + pad * 2
  const paddedHeight = height + pad * 2
  svgElement.setAttribute('viewBox', `${x - pad} ${y - pad} ${paddedWidth} ${paddedHeight}`)
  svgElement.setAttribute('width', String(paddedWidth))
  svgElement.setAttribute('height', String(paddedHeight))
}

// Renderers reuse fixed ids for filters and markers. A second diagram on the page
// would resolve url(#id) to the first one, which stops rendering once its slide is hidden.
function makeIdsUniqueInPage(svgElement: HTMLElement): void {
  const suffix = `-static-${++renderedSvgCount}`
  const renamedIds = new Map<string, string>()
  svgElement.querySelectorAll('[id]').forEach((el) => {
    renamedIds.set(el.id, el.id + suffix)
    el.id += suffix
  })
  if (renamedIds.size === 0) return

  const renamed = (id: string) => renamedIds.get(id) ?? id
  svgElement.querySelectorAll('*').forEach((el) => {
    for (const attribute of [...el.attributes]) {
      attribute.value = attribute.value
        .replace(/url\((['"]?)#([^'")]+)\1\)/g, (_, quote, id) => `url(${quote}#${renamed(id)}${quote})`)
        .replace(/^#(.+)$/, (_, id) => `#${renamed(id)}`)
    }
  })
}
