import { beforeEach, describe, expect, it, vi } from 'vitest'

const { MockBpmnViewer, viewer } = vi.hoisted(() => {
  const viewer = {
    importXML: vi.fn(),
    saveSVG: vi.fn(),
    destroy: vi.fn(),
  }
  return { viewer, MockBpmnViewer: vi.fn(function () { return viewer }) }
})

vi.mock('bpmn-js/lib/Viewer', () => ({ default: MockBpmnViewer }))

import { DiagramTheme } from '../../../src/shared/lib/DiagramTheme'
import { BpmnDiagramNotation } from '../../../src/bpmn/BpmnDiagramNotation'

describe('BpmnDiagramNotation', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    viewer.importXML.mockResolvedValue({ warnings: [] })
    viewer.saveSVG.mockResolvedValue({ svg: '<svg id="exported"/>' })
  })

  it('names its diagram kind BPMN', () => {
    expect(new BpmnDiagramNotation().kind).toBe('BPMN')
  })

  it('renders the source in a viewer inside the given container and returns its SVG', async () => {
    const svg = await new BpmnDiagramNotation().exportSvg('<definitions/>', container)

    expect(MockBpmnViewer).toHaveBeenCalledWith({ container, bpmnRenderer: {} })
    expect(viewer.importXML).toHaveBeenCalledWith('<definitions/>')
    expect(svg).toBe('<svg id="exported"/>')
  })

  it('draws light strokes and labels on transparent fills in the dark theme', async () => {
    await new BpmnDiagramNotation(new DiagramTheme('dark')).exportSvg('<definitions/>', container)

    expect(MockBpmnViewer).toHaveBeenLastCalledWith({ container, bpmnRenderer: { defaultFillColor: 'transparent', defaultStrokeColor: '#e6e6e6', defaultLabelColor: '#e6e6e6' } })
  })

  it('destroys the viewer after exporting', async () => {
    await new BpmnDiagramNotation().exportSvg('<definitions/>', container)

    expect(viewer.destroy).toHaveBeenCalledOnce()
  })

  it('destroys the viewer and rethrows when the import fails', async () => {
    viewer.importXML.mockRejectedValue(new Error('invalid XML'))

    await expect(new BpmnDiagramNotation().exportSvg('<broken', container)).rejects.toThrow('invalid XML')
    expect(viewer.saveSVG).not.toHaveBeenCalled()
    expect(viewer.destroy).toHaveBeenCalledOnce()
  })
})
