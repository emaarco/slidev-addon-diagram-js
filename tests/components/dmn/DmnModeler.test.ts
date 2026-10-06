import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const {
  mockViewerImportXML, mockViewerOpen, mockGetViews, mockViewerDestroy, mockGetActiveViewer, MockDmnViewer,
  mockModelerImportXML, mockSaveXML, mockModelerDestroy, mockModelerGetActiveViewer, MockDmnModeler,
} = vi.hoisted(() => ({
  mockViewerImportXML: vi.fn(),
  mockViewerOpen: vi.fn(),
  mockGetViews: vi.fn(),
  mockViewerDestroy: vi.fn(),
  mockGetActiveViewer: vi.fn(),
  MockDmnViewer: vi.fn(),
  mockModelerImportXML: vi.fn(),
  mockSaveXML: vi.fn(),
  mockModelerDestroy: vi.fn(),
  mockModelerGetActiveViewer: vi.fn(),
  MockDmnModeler: vi.fn(),
}))

vi.mock('dmn-js/lib/Viewer', () => ({ default: MockDmnViewer }))
vi.mock('dmn-js/lib/Modeler', () => ({ default: MockDmnModeler }))

// Avoid importing the real properties-panel modules in unit tests.
vi.mock('../../../plugins/dmn/engines/camunda', () => ({
  camundaEngine: { additionalModules: ['MODULE'], moddleExtensions: { camunda: {} } },
}))

const { slideEnterCallbacks } = vi.hoisted(() => ({ slideEnterCallbacks: [] as Array<() => void> }))
vi.mock('@slidev/client', () => ({
  onSlideEnter: vi.fn((cb: () => void) => { slideEnterCallbacks.push(cb) }),
}))

import DmnModeler from '../../../components/dmn/DmnModeler.vue'

const DRD_VIEW = { type: 'drd' }

function mockCanvas() {
  // viewbox() returning undefined makes fitDiagram short-circuit harmlessly.
  return { resized: vi.fn(), viewbox: () => undefined }
}

function mockFetchSuccess(xml = '<definitions></definitions>') {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))
}

function mockFetchFailure() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
}

// Drain the requestAnimationFrame polyfill (setTimeout 0), nextTick and promise queues.
async function settle() {
  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 0))
    await flushPromises()
  }
}

describe('DmnModeler.vue', () => {
  beforeEach(() => {
    slideEnterCallbacks.length = 0

    // waitForContainer relies on clientWidth/clientHeight; stub them positive so
    // both the thumbnail and the (teleported) modeler container resolve immediately.
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 800 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 500 })

    mockViewerImportXML.mockResolvedValue(undefined)
    mockViewerOpen.mockResolvedValue(undefined)
    mockGetViews.mockReturnValue([DRD_VIEW])
    mockGetActiveViewer.mockReturnValue({ get: (n: string) => (n === 'canvas' ? mockCanvas() : undefined) })
    MockDmnViewer.mockImplementation(function () {
      return {
        importXML: mockViewerImportXML,
        getViews: mockGetViews,
        open: mockViewerOpen,
        getActiveViewer: mockGetActiveViewer,
        destroy: mockViewerDestroy,
      }
    })

    mockModelerImportXML.mockResolvedValue(undefined)
    mockSaveXML.mockResolvedValue({ xml: '<definitions></definitions>' })
    mockModelerGetActiveViewer.mockReturnValue({ get: (n: string) => (n === 'canvas' ? mockCanvas() : undefined) })
    MockDmnModeler.mockImplementation(function () {
      return {
        importXML: mockModelerImportXML,
        saveXML: mockSaveXML,
        getActiveViewer: mockModelerGetActiveViewer,
        destroy: mockModelerDestroy,
      }
    })

    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // @ts-expect-error - remove the prototype stubs added in beforeEach
    delete HTMLElement.prototype.clientWidth
    // @ts-expect-error
    delete HTMLElement.prototype.clientHeight
  })

  it('shows loading state initially', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    const wrapper = mount(DmnModeler, { props: { dmnFilePath: 'test.dmn' } })
    await flushPromises()
    expect(wrapper.text()).toContain('Loading DMN diagram...')
  })

  it('renders the DRD thumbnail after successful load', async () => {
    mockFetchSuccess('<definitions id="x"></definitions>')
    mount(DmnModeler, { props: { dmnFilePath: 'test.dmn' } })
    await settle()

    expect(MockDmnViewer).toHaveBeenCalled()
    expect(mockViewerImportXML).toHaveBeenCalledWith('<definitions id="x"></definitions>')
    expect(mockViewerOpen).toHaveBeenCalledWith(DRD_VIEW)
  })

  it('keeps a small DRD at native size instead of enlarging it to fill the card', async () => {
    const smallDiagramInLargeCard = {
      inner: { x: 0, y: 0, width: 100, height: 100 },
      outer: { width: 1000, height: 1000 },
    }
    const viewbox = vi.fn((box?: unknown) => (box ? undefined : smallDiagramInLargeCard))
    mockGetActiveViewer.mockReturnValue({ get: () => ({ resized: vi.fn(), viewbox }) })
    mockFetchSuccess()
    mount(DmnModeler, { props: { dmnFilePath: 'test.dmn' } })
    await settle()

    expect(viewbox).toHaveBeenLastCalledWith({ x: -450, y: -450, width: 1000, height: 1000 })
  })

  it('shows error on fetch failure', async () => {
    mockFetchFailure()
    const wrapper = mount(DmnModeler, { props: { dmnFilePath: 'missing.dmn' } })
    await settle()

    expect(wrapper.text()).toContain('Failed to load DMN')
  })

  it('imports a blank diagram when no dmnFilePath is given', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    mount(DmnModeler, { props: {} })
    await settle()

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(mockViewerImportXML).toHaveBeenCalledWith(expect.stringContaining('New Decision Model'))
  })

  it('opens the fullscreen modeler when the Edit button is clicked', async () => {
    mockFetchSuccess()
    const wrapper = mount(DmnModeler, { props: { dmnFilePath: 'test.dmn' } })
    await settle()

    const editButton = wrapper.findAll('button').find(b => b.text().includes('Edit'))
    expect(editButton).toBeTruthy()
    await editButton!.trigger('click')
    await settle()

    expect(MockDmnModeler).toHaveBeenCalled()
    expect(mockModelerImportXML).toHaveBeenCalled()
  })

  it('nests the Camunda properties panel config under the drd key', async () => {
    mockFetchSuccess()
    const wrapper = mount(DmnModeler, { props: { dmnFilePath: 'test.dmn', engine: 'camunda' } })
    await settle()

    await wrapper.vm.openFullscreen()
    await settle()

    const options = MockDmnModeler.mock.calls[0][0] as any
    expect(options.drd.additionalModules).toContain('MODULE')
    expect(options.drd.propertiesPanel).toBeTruthy()
    expect(options.moddleExtensions).toEqual({ camunda: {} })
  })

  it('saves and re-renders the thumbnail when the model changed on close', async () => {
    mockFetchSuccess('<definitions id="orig"></definitions>')
    const wrapper = mount(DmnModeler, { props: { dmnFilePath: 'test.dmn' } })
    await settle()

    await wrapper.vm.openFullscreen()
    await settle()

    const viewerCallsBeforeClose = MockDmnViewer.mock.calls.length
    mockSaveXML.mockResolvedValue({ xml: '<definitions id="changed"></definitions>' })

    await wrapper.vm.closeFullscreen()
    await settle()

    expect(mockSaveXML).toHaveBeenCalled()
    expect(mockModelerDestroy).toHaveBeenCalled()
    // Thumbnail re-rendered with the changed XML.
    expect(MockDmnViewer.mock.calls.length).toBeGreaterThan(viewerCallsBeforeClose)
    expect(mockViewerImportXML).toHaveBeenLastCalledWith('<definitions id="changed"></definitions>')
  })

  it('does not re-render the thumbnail when nothing changed on close', async () => {
    mockFetchSuccess('<definitions id="orig"></definitions>')
    const wrapper = mount(DmnModeler, { props: { dmnFilePath: 'test.dmn' } })
    await settle()

    await wrapper.vm.openFullscreen()
    await settle()

    const viewerCallsBeforeClose = MockDmnViewer.mock.calls.length
    // saveXML returns the same XML that was loaded → no change.
    mockSaveXML.mockResolvedValue({ xml: '<definitions id="orig"></definitions>' })

    await wrapper.vm.closeFullscreen()
    await settle()

    expect(mockModelerDestroy).toHaveBeenCalled()
    expect(MockDmnViewer.mock.calls.length).toBe(viewerCallsBeforeClose)
  })
})
