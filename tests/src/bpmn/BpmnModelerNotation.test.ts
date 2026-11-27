import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('bpmn-js/lib/Viewer', async () => ({ default: (await import('./fakeBpmnJs')).FakeBpmnViewer }))
vi.mock('bpmn-js/lib/Modeler', async () => ({ default: (await import('./fakeBpmnJs')).FakeBpmnModeler }))
vi.mock('bpmn-js-token-simulation', () => ({ default: 'token-simulation-modeler' }))
vi.mock('bpmn-js-token-simulation/lib/viewer', () => ({ default: 'token-simulation-viewer' }))
vi.mock('@emaarco/bpmn-js-data-simulation', async importOriginal => ({
  ...await importOriginal<object>(),
  PathSimulationModule: 'path-simulation',
}))
vi.mock('../../../src/bpmn/engines/zeebe', () => ({
  zeebeEngine: { additionalModules: ['zeebe-module'], moddleExtensions: { zeebe: {} } },
}))
vi.mock('../../../src/bpmn/engines/camunda7', () => ({
  camunda7Engine: { additionalModules: ['camunda7-module'], moddleExtensions: { camunda: {} } },
}))

import { DiagramTheme } from '../../../src/shared/lib/DiagramTheme'
import { BpmnModelerNotation } from '../../../src/bpmn/BpmnModelerNotation'
import { BpmnModelerSession } from '../../../src/bpmn/BpmnModelerSession'
import { bpmnJs, FakeBpmnViewer, SMALL_DIAGRAM } from './fakeBpmnJs'

const DEFAULT_OPTIONS = { tokenSimulation: false, transactionBoundaries: false }

describe('BpmnModelerNotation', () => {
  beforeEach(() => bpmnJs.reset())

  it('names its diagram kind BPMN', () => {
    expect(new BpmnModelerNotation(DEFAULT_OPTIONS).kind).toBe('BPMN')
  })

  it('starts a new diagram from a process with a single start event', () => {
    const blank = new DOMParser().parseFromString(new BpmnModelerNotation(DEFAULT_OPTIONS).blankSource, 'application/xml')

    expect(blank.querySelector('parsererror')).toBeNull()
    expect(blank.getElementsByTagName('bpmn:startEvent')).toHaveLength(1)
    expect(blank.getElementsByTagName('bpmndi:BPMNShape')[0].getAttribute('bpmnElement')).toBe('StartEvent_1')
  })

  it('has a properties panel only with an engine', () => {
    expect(new BpmnModelerNotation(DEFAULT_OPTIONS).hasPropertiesPanel).toBe(false)
    expect(new BpmnModelerNotation({ ...DEFAULT_OPTIONS, engine: 'zeebe' }).hasPropertiesPanel).toBe(true)
  })

  describe('createViewer', () => {
    const container = document.createElement('div')

    it('creates a plain viewer without token simulation', async () => {
      await new BpmnModelerNotation(DEFAULT_OPTIONS).createViewer(container)

      expect(FakeBpmnViewer).toHaveBeenCalledWith({ container, bpmnRenderer: {} })
    })

    it('draws the preview in the dark theme', async () => {
      await new BpmnModelerNotation(DEFAULT_OPTIONS, new DiagramTheme('dark')).createViewer(container)

      expect(bpmnJs.lastViewer().options.bpmnRenderer).toEqual({ defaultFillColor: 'transparent', defaultStrokeColor: '#e6e6e6', defaultLabelColor: '#e6e6e6' })
    })

    it('draws the token-simulation preview in the dark theme', async () => {
      await new BpmnModelerNotation({ ...DEFAULT_OPTIONS, tokenSimulation: true }, new DiagramTheme('dark')).createViewer(container)

      expect(bpmnJs.lastViewer().options.bpmnRenderer).toEqual({ defaultFillColor: 'transparent', defaultStrokeColor: '#e6e6e6', defaultLabelColor: '#e6e6e6' })
    })

    it('previews with the path simulation and hands it over once the diagram is shown', async () => {
      const onTarget = vi.fn()
      const pathSimulation = { engine: 'camunda7' as const, onTarget, onModelChanged: vi.fn() }
      const viewer = await new BpmnModelerNotation({ ...DEFAULT_OPTIONS, tokenSimulation: true, pathSimulation }).createViewer(container)

      expect(bpmnJs.lastViewer().options).toMatchObject({ additionalModules: ['path-simulation'], dataSimulation: { engine: 'camunda7' } })
      await viewer.show('<definitions/>')
      expect(onTarget).toHaveBeenCalledWith(expect.objectContaining({ simulate: expect.any(Function) }), 'preview')
    })

    it('adds the token simulation viewer modules with token simulation', async () => {
      await new BpmnModelerNotation({ ...DEFAULT_OPTIONS, tokenSimulation: true }).createViewer(container)

      const { additionalModules } = bpmnJs.lastViewer().options
      expect(additionalModules[0]).toBe('token-simulation-viewer')
      expect(additionalModules[1].notifications[0]).toBe('value')
    })

    it('styles the simulation chrome of a token-simulation preview', async () => {
      const previewContainer = document.createElement('div')

      await new BpmnModelerNotation({ ...DEFAULT_OPTIONS, tokenSimulation: true }).createViewer(previewContainer)

      expect(previewContainer.classList.contains('bpmn-simulation-chrome')).toBe(true)
    })

    it('fits the preview no further than the max scale', async () => {
      bpmnJs.viewbox = SMALL_DIAGRAM
      const viewer = await new BpmnModelerNotation({ ...DEFAULT_OPTIONS, maxScale: 1 }).createViewer(container)

      viewer.fit!()

      expect(bpmnJs.lastViewer().fittedViewbox()).toMatchObject({ width: 800, height: 500 })
    })

    it('lets the preview grow up to twice its size by default', async () => {
      bpmnJs.viewbox = SMALL_DIAGRAM
      const viewer = await new BpmnModelerNotation(DEFAULT_OPTIONS).createViewer(container)

      viewer.fit!()

      expect(bpmnJs.lastViewer().fittedViewbox()).toMatchObject({ width: 400, height: 250 })
    })
  })

  it('opens a modeler session with its options', async () => {
    const canvas = document.createElement('div')
    const propertiesPanel = document.createElement('div')

    const session = await new BpmnModelerNotation({ ...DEFAULT_OPTIONS, engine: 'zeebe', tokenSimulation: true })
      .openModeler('<definitions/>', { canvas, propertiesPanel })

    expect(session).toBeInstanceOf(BpmnModelerSession)
    expect(bpmnJs.lastModeler().importXML).toHaveBeenCalledWith('<definitions/>')
    expect(bpmnJs.lastModeler().options).toMatchObject({
      container: canvas,
      propertiesPanel: { parent: propertiesPanel },
      additionalModules: ['zeebe-module', 'token-simulation-modeler'],
    })
  })

  it('opens the modeler in its theme', async () => {
    await new BpmnModelerNotation(DEFAULT_OPTIONS, new DiagramTheme('dark')).openModeler('<definitions/>', { canvas: document.createElement('div') })

    expect(bpmnJs.lastModeler().options.bpmnRenderer).toEqual(new DiagramTheme('dark').rendererColors())
  })
})
