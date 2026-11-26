import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('bpmn-js/lib/Viewer', async () => ({ default: (await import('./fakeBpmnJs')).FakeBpmnViewer }))
vi.mock('@emaarco/bpmn-js-data-simulation', async importOriginal => ({
  ...await importOriginal<object>(),
  PathSimulationModule: 'path-simulation',
}))
vi.mock('../../../src/bpmn/engines/zeebe', () => ({
  zeebeEngine: { additionalModules: ['zeebe-module'], moddleExtensions: { zeebe: { name: 'zeebe' } } },
}))
vi.mock('../../../src/bpmn/engines/camunda7', () => ({
  camunda7Engine: { additionalModules: ['camunda7-module'], moddleExtensions: { camunda: { name: 'camunda' } } },
}))

import { DiagramTheme } from '../../../src/shared/lib/DiagramTheme'
import { BpmnPathSimulationNotation } from '../../../src/bpmn/BpmnPathSimulationNotation'
import { BpmnPathSimulationViewer } from '../../../src/bpmn/BpmnPathSimulationViewer'
import { bpmnJs, SMALL_DIAGRAM } from './fakeBpmnJs'
import { BIKE_ORDER_NAMES, fakeElementRegistry } from './fakeElementRegistry'

const PATH = { taken: ['Start'], skipped: [], decisions: {}, measures: {} }

function notation(options: Partial<ConstructorParameters<typeof BpmnPathSimulationNotation>[0]> = {}) {
  return new BpmnPathSimulationNotation({ engine: 'zeebe', onShown: vi.fn(), ...options })
}

async function createViewer(options?: Parameters<typeof notation>[0]): Promise<BpmnPathSimulationViewer> {
  return await notation(options).createViewer(document.createElement('div')) as BpmnPathSimulationViewer
}

describe('BpmnPathSimulationNotation', () => {
  const VARIABLES = [{ name: 'orderTotal', type: 'number', range: { min: 0, max: 20000, step: 200 } }]
  const SCENARIO = { id: 'small-order', name: 'Small order', variables: { orderTotal: 1290 }, taskResults: {} }
  const pathSimulation = {
    simulate: vi.fn(() => PATH),
    deriveVariables: vi.fn(() => VARIABLES),
    variablesOf: vi.fn(() => ({ orderTotal: 1290, creditworthy: true })),
  }

  beforeEach(() => {
    bpmnJs.reset()
    bpmnJs.services = { pathSimulation, elementRegistry: fakeElementRegistry(BIKE_ORDER_NAMES) }
  })

  it('names its diagram kind BPMN', () => {
    expect(notation().kind).toBe('BPMN')
  })

  it.each([
    ['zeebe' as const, { zeebe: { name: 'zeebe' } }],
    ['camunda7' as const, { camunda: { name: 'camunda' } }],
  ])('creates a viewer with the path simulation and the %s moddle, without the token simulation', async (engine, moddleExtensions) => {
    const viewer = await createViewer({ engine })

    expect(viewer).toBeInstanceOf(BpmnPathSimulationViewer)
    expect(bpmnJs.lastViewer().options).toMatchObject({
      additionalModules: ['path-simulation'],
      moddleExtensions,
      dataSimulation: { engine },
      bpmnRenderer: {},
    })
  })

  it('draws the viewer in the dark theme', async () => {
    await createViewer({ theme: new DiagramTheme('dark') })

    expect(bpmnJs.lastViewer().options.bpmnRenderer).toEqual({ defaultFillColor: 'transparent', defaultStrokeColor: '#e6e6e6', defaultLabelColor: '#e6e6e6' })
  })

  it('hands the viewer on once it has imported the diagram', async () => {
    const onShown = vi.fn()
    const viewer = await createViewer({ onShown })
    expect(onShown).not.toHaveBeenCalled()

    await viewer.show('<definitions/>')

    expect(bpmnJs.lastViewer().importXML).toHaveBeenCalledWith('<definitions/>')
    expect(onShown).toHaveBeenCalledWith(viewer)
  })

  it('fits the viewer no further than the max scale', async () => {
    bpmnJs.viewbox = SMALL_DIAGRAM
    const viewer = await createViewer({ maxScale: 1 })

    viewer.fit()

    expect(bpmnJs.lastViewer().fittedViewbox()).toMatchObject({ width: 800, height: 500 })
  })

  it('simulates the path for the variables', async () => {
    const viewer = await createViewer()

    expect(viewer.simulate({ orderTotal: 6800 })).toBe(PATH)
    expect(pathSimulation.simulate).toHaveBeenCalledWith({ orderTotal: 6800 })
  })

  it('asks the path simulation for the variables the conditions read', async () => {
    const viewer = await createViewer()

    expect(viewer.variablesReadByConditions({ orderTotal: 6800 })).toBe(VARIABLES)
    expect(pathSimulation.deriveVariables).toHaveBeenCalledWith({ orderTotal: 6800 })
  })

  it('asks the path simulation for the variables of a scenario', async () => {
    const viewer = await createViewer()

    expect(viewer.variablesOf(SCENARIO, [SCENARIO])).toEqual({ orderTotal: 1290, creditworthy: true })
    expect(pathSimulation.variablesOf).toHaveBeenCalledWith(SCENARIO, [SCENARIO])
  })

  it('names an element by its name, or by its id without one', async () => {
    const viewer = await createViewer()

    expect(viewer.elementName('Gateway_Credit')).toBe('Credit OK?')
    expect(viewer.elementName('Flow_Note')).toBe('Flow_Note')
    expect(viewer.elementName('Unknown')).toBe('Unknown')
  })
})
