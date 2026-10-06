import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { enableAutoUnmount, mount, flushPromises } from '@vue/test-utils'

enableAutoUnmount(afterEach)

const { mockImportXML, mockOpen, mockGetViews, MockDmnViewer } = vi.hoisted(() => ({
  mockImportXML: vi.fn(),
  mockOpen: vi.fn(),
  mockGetViews: vi.fn(),
  MockDmnViewer: vi.fn(),
}))

vi.mock('dmn-js/lib/Viewer', () => ({ default: MockDmnViewer }))

const { slideEnterCallbacks } = vi.hoisted(() => ({ slideEnterCallbacks: [] as Array<() => void> }))
vi.mock('@slidev/client', () => ({
  onSlideEnter: vi.fn((cb: () => void) => { slideEnterCallbacks.push(cb) }),
}))

import DmnSimulate from '../../../components/dmn/DmnSimulate.vue'

const exampleXml = readFileSync(resolve(process.cwd(), 'public/example.dmn'), 'utf-8')
const TABLE_VIEW = { type: 'decisionTable', element: { id: 'Decision_Dish' } }

function mockFetch(xml = exampleXml) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))
}

function giveContainerDimensions(wrapper: ReturnType<typeof mount>) {
  const el = wrapper.find('div.dmn-table-wrapper').element as HTMLDivElement
  Object.defineProperty(el, 'clientWidth', { value: 800, configurable: true })
  Object.defineProperty(el, 'clientHeight', { value: 400, configurable: true })
}

async function waitForRender() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await flushPromises()
}

describe('DmnSimulate.vue', () => {
  beforeEach(() => {
    slideEnterCallbacks.length = 0
    mockImportXML.mockResolvedValue(undefined)
    mockOpen.mockResolvedValue(undefined)
    mockGetViews.mockReturnValue([TABLE_VIEW])
    MockDmnViewer.mockImplementation(function () {
      return { importXML: mockImportXML, getViews: mockGetViews, open: mockOpen }
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows a loading state initially', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    const wrapper = mount(DmnSimulate, { props: { dmnFilePath: 'example.dmn' } })
    giveContainerDimensions(wrapper)
    expect(wrapper.text()).toContain('Loading DMN decision table...')
  })

  it('derives one input control per decision-table input from the parsed model', async () => {
    mockFetch()
    const wrapper = mount(DmnSimulate, { props: { dmnFilePath: 'example.dmn' } })
    giveContainerDimensions(wrapper)
    await waitForRender()

    const fields = wrapper.findAll('.sim-field')
    expect(fields).toHaveLength(2) // Season, Number of Guests
    // Season is a string column with literal values → dropdown
    const options = wrapper.find('.sim-field select').findAll('option').map(o => o.text())
    expect(options).toContain('Fall')
    expect(options).toContain('Spring')
    // Guest count is numeric → number input
    expect(wrapper.find('.sim-field input[type="number"]').exists()).toBe(true)
  })

  it('keeps Simulate disabled until every input has a value', async () => {
    mockFetch()
    const wrapper = mount(DmnSimulate, { props: { dmnFilePath: 'example.dmn' } })
    giveContainerDimensions(wrapper)
    await waitForRender()

    const button = wrapper.find('button.sim-run')
    expect(button.attributes('disabled')).toBeDefined()

    await wrapper.find('.sim-field select').setValue('Fall')
    expect(button.attributes('disabled')).toBeDefined() // guests still empty

    await wrapper.find('.sim-field input[type="number"]').setValue('8')
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('evaluates the decision and shows the matched output', async () => {
    mockFetch()
    const wrapper = mount(DmnSimulate, { props: { dmnFilePath: 'example.dmn' } })
    giveContainerDimensions(wrapper)
    await waitForRender()

    await wrapper.find('.sim-field select').setValue('Fall')
    await wrapper.find('.sim-field input[type="number"]').setValue('8')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const result = wrapper.find('.sim-result')
    expect(result.exists()).toBe(true)
    expect(result.text()).toContain('Spareribs')
    expect(result.text()).toContain('Rule 1')
  })

  it('resets inputs and clears the result', async () => {
    mockFetch()
    const wrapper = mount(DmnSimulate, { props: { dmnFilePath: 'example.dmn' } })
    giveContainerDimensions(wrapper)
    await waitForRender()

    await wrapper.find('.sim-field select').setValue('Fall')
    await wrapper.find('.sim-field input[type="number"]').setValue('8')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.sim-result').exists()).toBe(true)

    await wrapper.find('button.sim-reset').trigger('click')
    await flushPromises()
    expect(wrapper.find('.sim-result').exists()).toBe(false)
    expect(wrapper.find('button.sim-run').attributes('disabled')).toBeDefined()
  })

  it('shows an error when the decision table cannot be found', async () => {
    mockGetViews.mockReturnValue([{ type: 'drd' }])
    mockFetch()
    const wrapper = mount(DmnSimulate, { props: { dmnFilePath: 'example.dmn' } })
    giveContainerDimensions(wrapper)
    await waitForRender()
    expect(wrapper.text()).toContain('Failed to load DMN')
  })
})
