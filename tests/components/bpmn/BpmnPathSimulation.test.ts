import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'

vi.mock('bpmn-js/lib/Viewer', async () => ({ default: (await import('../../src/bpmn/fakeBpmnJs')).FakeBpmnViewer }))
vi.mock('@emaarco/bpmn-js-data-simulation', async importOriginal => ({
  ...await importOriginal<object>(),
  PathSimulationModule: 'path-simulation',
}))
vi.mock('../../../src/bpmn/engines/zeebe', () => ({
  zeebeEngine: { additionalModules: [], moddleExtensions: { zeebe: { name: 'zeebe' } }, supportsTransactionBoundaries: false },
}))
vi.mock('../../../src/bpmn/engines/camunda7', () => ({
  camunda7Engine: { additionalModules: [], moddleExtensions: { camunda: { name: 'camunda' } }, supportsTransactionBoundaries: true },
}))

const { slide } = vi.hoisted(() => ({
  slide: {
    clicks: null as unknown as { value: number },
    register: vi.fn() as Mock<(key: string, info: { delta: number; max: number }) => void>,
    unregister: vi.fn() as Mock<(key: string) => void>,
  },
}))

vi.mock('@slidev/client', () => ({
  onSlideEnter: () => {},
  useSlideContext: () => ({ $clicks: slide.clicks, $clicksContext: { register: slide.register, unregister: slide.unregister } }),
}))

import { type SimulatedPath, type Variables, zeebeEngine } from '@emaarco/bpmn-js-data-simulation'
import BpmnPathSimulation from '../../../components/bpmn/BpmnPathSimulation.vue'
import { bpmnJs } from '../../src/bpmn/fakeBpmnJs'
import { BIKE_ORDER, fakeElementRegistry } from '../../src/bpmn/fakeElementRegistry'

enableAutoUnmount(afterEach)

const SCENARIOS = {
  scenarios: [
    { id: 'small-order', name: 'Small order', variables: { orderTotal: 1290, accessories: [] }, taskResults: { Task_CheckCredit: { score: 720 } } },
    { id: 'large-order', name: 'Large order', variables: { orderTotal: 6890, accessories: [] }, taskResults: { Task_CheckCredit: { score: 680 } } },
  ],
}

// Routes the credit gateway like the bike order's conditions; a missing order total leaves it stuck.
function simulatePath(variables: Variables): SimulatedPath {
  const orderTotal = variables.orderTotal
  const decision = typeof orderTotal === 'number'
    ? { flows: [], takenFlowIds: [orderTotal > 5000 ? 'Flow_Review' : 'Flow_Approved'] }
    : { flows: [], takenFlowIds: [], stuckReason: 'orderTotal is missing' }
  return { taken: [], skipped: [], decisions: { Gateway_Credit: decision }, measures: {} }
}

const pathSimulation = { simulate: vi.fn(simulatePath), getEngine: () => zeebeEngine }

function mockFetchFiles(files: Record<string, string>) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    const path = Object.keys(files).find(file => url.endsWith(`/${file}`))
    return Promise.resolve(path === undefined
      ? { ok: false, status: 404 }
      : { ok: true, text: () => Promise.resolve(files[path]) })
  }))
}

async function settle() {
  for (let i = 0; i < 3; i++) {
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

async function mountRendered(props: Record<string, unknown> = {}): Promise<VueWrapper> {
  const wrapper = mount(BpmnPathSimulation, { attachTo: document.body, props: { bpmnFilePath: 'test.bpmn', ...props } })
  const canvas = wrapper.find('.live-diagram-canvas').element
  Object.defineProperty(canvas, 'clientWidth', { value: 800, configurable: true })
  Object.defineProperty(canvas, 'clientHeight', { value: 400, configurable: true })
  await settle()
  return wrapper
}

function lastSimulatedVariables(): Variables {
  return pathSimulation.simulate.mock.lastCall![0]
}

function fieldNames(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.bpmn-path-inputs .bpmn-path-label').map(name => name.text())
}

describe('BpmnPathSimulation.vue', () => {
  beforeEach(() => {
    bpmnJs.reset()
    bpmnJs.services = { pathSimulation, elementRegistry: fakeElementRegistry(BIKE_ORDER) }
    slide.clicks = ref(0)
    slide.register = vi.fn()
    slide.unregister = vi.fn()
    mockFetchFiles({ 'test.bpmn': '<definitions/>', 'test.scenarios.json': JSON.stringify(SCENARIOS) })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('creates a viewer with the path simulation for the engine', async () => {
    await mountRendered({ engine: 'camunda7' })

    expect(bpmnJs.lastViewer().options).toMatchObject({
      additionalModules: ['path-simulation'],
      moddleExtensions: { camunda: { name: 'camunda' } },
      dataSimulation: { engine: 'camunda7' },
    })
  })

  it('marks the path for the given variables once the diagram is rendered', async () => {
    await mountRendered({ variables: { orderTotal: 6800, creditworthy: true } })

    expect(pathSimulation.simulate).toHaveBeenCalledWith({ orderTotal: 6800, creditworthy: true })
  })

  it('offers a control for every variable the conditions read, by its value', async () => {
    const wrapper = await mountRendered({ variables: { orderTotal: 6800, creditworthy: true } })

    expect(fieldNames(wrapper)).toEqual(['creditworthy', 'orderTotal', 'accessories', 'customer'])
    expect(wrapper.find('input[name="creditworthy"]').attributes('type')).toBe('checkbox')
    expect(wrapper.find('input[name="orderTotal-slider"]').attributes()).toMatchObject({ type: 'range', min: '0', max: '20000' })
    expect(wrapper.find('input[name="customer"]').attributes('type')).toBe('text')
  })

  it('marks the path again when the audience moves a slider', async () => {
    const wrapper = await mountRendered({ variables: { orderTotal: 1290, creditworthy: true } })

    await wrapper.find('input[name="orderTotal-slider"]').setValue('7000')

    expect(lastSimulatedVariables()).toEqual({ orderTotal: 7000, creditworthy: true })
    expect((wrapper.find('input[name="orderTotal"]').element as HTMLInputElement).value).toBe('7000')
  })

  it('fills the slider track up to the value', async () => {
    const wrapper = await mountRendered({ variables: { orderTotal: 6800 } })

    const slider = wrapper.find('input[name="orderTotal-slider"]').element as HTMLInputElement
    expect(slider.style.getPropertyValue('--bpmn-path-fill')).toBe('34%')
  })

  it('marks the path again when a switch is toggled', async () => {
    const wrapper = await mountRendered({ variables: { orderTotal: 1290, creditworthy: true } })

    await wrapper.find('input[name="creditworthy"]').setValue(false)

    expect(lastSimulatedVariables()).toMatchObject({ creditworthy: false })
  })

  it('takes a text value only once it parses', async () => {
    const wrapper = await mountRendered({ variables: { accessories: [] } })
    const accessories = wrapper.find('input[name="accessories"]')

    await accessories.setValue('["lock"')
    expect(accessories.classes()).toContain('is-invalid')
    expect(lastSimulatedVariables()).toEqual({ accessories: [] })

    await accessories.setValue('["lock"]')
    expect(accessories.classes()).not.toContain('is-invalid')
    expect(lastSimulatedVariables()).toEqual({ accessories: ['lock'] })
  })

  it('shows only the listed controls', async () => {
    const wrapper = await mountRendered({ variables: { orderTotal: 1290 }, controls: ['orderTotal'] })

    expect(fieldNames(wrapper)).toEqual(['orderTotal'])
  })

  it('shows no panel with controls="none" and nothing else to show', async () => {
    const wrapper = await mountRendered({ variables: { orderTotal: 1290 }, controls: 'none' })

    expect(wrapper.find('.bpmn-path-panel').exists()).toBe(false)
    expect(pathSimulation.simulate).toHaveBeenCalled()
  })

  describe('with scenarios', () => {
    it('starts from the first scenario after its task results ran through the output mappings', async () => {
      await mountRendered({ scenariosFilePath: 'test.scenarios.json', variables: { insurance: false } })

      expect(lastSimulatedVariables()).toEqual({ insurance: false, orderTotal: 1290, accessories: [], score: 720, creditworthy: true })
    })

    it('switches the variables to the scenario picked in the dropdown', async () => {
      const wrapper = await mountRendered({ scenariosFilePath: 'test.scenarios.json' })

      await wrapper.find('select').setValue('large-order')

      expect(lastSimulatedVariables()).toMatchObject({ orderTotal: 6890, score: 680 })
    })

    it('reports scenarios that cannot be loaded and still marks the path', async () => {
      const wrapper = await mountRendered({ scenariosFilePath: 'missing.json', variables: { orderTotal: 1290 } })

      expect(wrapper.text()).toContain('Failed to load the scenarios: Failed to fetch BPMN file: 404')
      expect(lastSimulatedVariables()).toEqual({ orderTotal: 1290 })
    })
  })

  describe('with steps', () => {
    const steps = [{ orderTotal: 3000 }, { orderTotal: 6800 }]

    it('registers one slide click per step', async () => {
      await mountRendered({ variables: { orderTotal: 1290 }, steps })

      expect(slide.register).toHaveBeenCalledWith(expect.stringMatching(/^bpmn-path-steps-/), { delta: 0, max: 2 })
    })

    it('applies every step up to the current click over the variables', async () => {
      await mountRendered({ variables: { orderTotal: 1290, creditworthy: true }, steps })
      expect(lastSimulatedVariables()).toEqual({ orderTotal: 1290, creditworthy: true })

      slide.clicks.value = 2
      await settle()

      expect(lastSimulatedVariables()).toEqual({ orderTotal: 6800, creditworthy: true })
    })

    it('unregisters its clicks when it is unmounted', async () => {
      const wrapper = await mountRendered({ steps })

      wrapper.unmount()

      expect(slide.unregister).toHaveBeenCalledWith(slide.register.mock.calls[0][0])
    })

    it('registers no clicks without steps', async () => {
      await mountRendered()

      expect(slide.register).not.toHaveBeenCalled()
    })
  })

  it('says why a gateway on the path cannot decide', async () => {
    const wrapper = await mountRendered({ controls: 'none' })

    const notice = wrapper.find('.bpmn-path-stuck')
    expect(notice.attributes('role')).toBe('status')
    expect(notice.text()).toBe('Credit OK? orderTotal is missing')
  })

  it('shows no notice while every gateway decides', async () => {
    const wrapper = await mountRendered({ variables: { orderTotal: 6800 } })

    expect(wrapper.find('.bpmn-path-stuck').exists()).toBe(false)
  })

  it('drops the notice once the missing variable is set', async () => {
    const wrapper = await mountRendered()
    expect(wrapper.find('.bpmn-path-stuck').exists()).toBe(true)

    await wrapper.find('input[name="orderTotal"]').setValue('1290')

    expect(lastSimulatedVariables()).toEqual({ orderTotal: 1290 })
    expect(wrapper.find('.bpmn-path-stuck').exists()).toBe(false)
  })

  it('marks the path on the new viewer when the deck turns dark', async () => {
    const wrapper = await mountRendered({ variables: { orderTotal: 6800 } })
    await wrapper.find('input[name="orderTotal-slider"]').setValue('2000')
    pathSimulation.simulate.mockClear()

    document.documentElement.classList.add('dark')
    await settle()

    expect(wrapper.classes()).toContain('diagram-theme-dark')
    expect(bpmnJs.viewers).toHaveLength(2)
    expect(lastSimulatedVariables()).toEqual({ orderTotal: 2000 })
  })
})
