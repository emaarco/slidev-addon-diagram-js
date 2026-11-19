import { describe, expect, it } from 'vitest'
import { DarkCanvas } from '../../../../src/shared/lib/DarkCanvas'

function canvasWith(svgContent: string): HTMLElement {
  const container = document.createElement('div')
  container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`
  return container
}

function colorOf(container: HTMLElement, selector: string, property = 'fill'): string {
  return container.querySelector<SVGElement>(selector)!.style.getPropertyValue(property)
}

describe('DarkCanvas', () => {
  it('turns the light brand neutrals into their dark counterparts', () => {
    const canvas = canvasWith(`
      <rect id="plot" style="fill: #FFFFFF; stroke: #E6E2E2"/>
      <rect id="paper" style="fill: #F9F7F7"/>
      <text id="label" style="fill: #1D1D1D"/>
      <text id="annotation" style="fill: #6B6666"/>
    `)

    new DarkCanvas().paint(canvas)

    expect(colorOf(canvas, '#plot')).toBe('rgb(38, 38, 38)')
    expect(colorOf(canvas, '#plot', 'stroke')).toBe('rgb(77, 77, 77)')
    expect(colorOf(canvas, '#paper')).toBe('rgb(30, 30, 30)')
    expect(colorOf(canvas, '#label')).toBe('rgb(230, 230, 230)')
    expect(colorOf(canvas, '#annotation')).toBe('rgb(179, 179, 179)')
  })

  it('keeps notation colours and the grey of connections', () => {
    const canvas = canvasWith(`
      <path id="pipeline" style="stroke: rgb(201, 42, 42)"/>
      <path id="arrow" style="stroke: #8F8A8A"/>
    `)

    new DarkCanvas().paint(canvas)

    expect(colorOf(canvas, '#pipeline', 'stroke')).toBe('rgb(201, 42, 42)')
    expect(colorOf(canvas, '#arrow', 'stroke')).toBe('rgb(143, 138, 138)')
  })

  it('leaves a shape drawn on a notation colour as it is, dark text included', () => {
    const canvas = canvasWith(`
      <g class="djs-visual" id="sticky">
        <rect style="fill: rgb(255, 184, 77)"/>
        <text style="fill: #1D1D1D"/>
      </g>
    `)

    new DarkCanvas().paint(canvas)

    expect(colorOf(canvas, '#sticky text')).toBe('rgb(29, 29, 29)')
  })

  it('repaints a shape that only carries a notation colour as an accent', () => {
    const canvas = canvasWith(`
      <g class="djs-visual" id="component">
        <circle style="fill: #FFFFFF; stroke: #1D1D1D"/>
        <polygon style="fill: rgb(201, 42, 42)"/>
        <text style="fill: #1D1D1D"/>
      </g>
    `)

    new DarkCanvas().paint(canvas)

    expect(colorOf(canvas, '#component circle')).toBe('rgb(38, 38, 38)')
    expect(colorOf(canvas, '#component circle', 'stroke')).toBe('rgb(230, 230, 230)')
    expect(colorOf(canvas, '#component polygon')).toBe('rgb(201, 42, 42)')
    expect(colorOf(canvas, '#component text')).toBe('rgb(230, 230, 230)')
  })

  it('gives a followed canvas the dark chrome and repaints what the modeler draws later', async () => {
    const canvas = canvasWith('')

    const stopFollowing = new DarkCanvas().follow(canvas)
    canvas.querySelector('svg')!.innerHTML = '<text id="label" style="fill: #1D1D1D"/>'
    await Promise.resolve()

    expect(canvas.getAttribute('data-cd-theme')).toBe('dark')
    expect(colorOf(canvas, '#label')).toBe('rgb(230, 230, 230)')
    stopFollowing()
  })

  it('stops repainting once it no longer follows', async () => {
    const canvas = canvasWith('')

    new DarkCanvas().follow(canvas)()
    canvas.querySelector('svg')!.innerHTML = '<text id="label" style="fill: #1D1D1D"/>'
    await Promise.resolve()

    expect(colorOf(canvas, '#label')).toBe('rgb(29, 29, 29)')
  })
})
