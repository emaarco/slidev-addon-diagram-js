import { describe, it, expect, vi, beforeEach } from 'vitest'
import { afterEach } from 'vitest'
import { enableAutoUnmount, mount, flushPromises } from '@vue/test-utils'

enableAutoUnmount(afterEach)

const { mockImportXML, mockOpen, mockGetViews, MockDmnViewer } = vi.hoisted(() => ({
  mockImportXML: vi.fn(),
  mockOpen: vi.fn(),
  mockGetViews: vi.fn(),
  MockDmnViewer: vi.fn(),
}))

vi.mock('dmn-js/lib/Viewer', () => ({
  default: MockDmnViewer,
}))

const { slideEnterCallbacks } = vi.hoisted(() => ({
  slideEnterCallbacks: [] as Array<() => void>,
}))

vi.mock('@slidev/client', () => ({
  onSlideEnter: vi.fn((cb: () => void) => {
    slideEnterCallbacks.push(cb)
  }),
}))

import DmnTable from '../../../components/dmn/DmnTable.vue'

const TABLE_VIEW = { type: 'decisionTable', element: { id: 'decision1' } }
const TABLE_VIEW_2 = { type: 'decisionTable', element: { id: 'decision2' } }

function mockFetchSuccess(xml = '<definitions></definitions>') {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(xml),
  }))
}

function mockFetchFailure() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 404,
  }))
}

function giveContainerDimensions(wrapper: ReturnType<typeof mount>) {
  const containerEl = wrapper.find('div.dmn-table-wrapper').element as HTMLDivElement
  if (containerEl) {
    Object.defineProperty(containerEl, 'clientWidth', { value: 800, configurable: true })
    Object.defineProperty(containerEl, 'clientHeight', { value: 500, configurable: true })
  }
}

// Advance past the requestAnimationFrame polyfill (setTimeout 0) then flush promises.
async function waitForRender() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await flushPromises()
}

describe('DmnTable.vue', () => {
  beforeEach(() => {
    slideEnterCallbacks.length = 0

    mockImportXML.mockResolvedValue(undefined)
    mockOpen.mockResolvedValue(undefined)
    mockGetViews.mockReturnValue([TABLE_VIEW])
    MockDmnViewer.mockImplementation(function () {
      return {
        importXML: mockImportXML,
        getViews: mockGetViews,
        open: mockOpen,
      }
    })

    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows loading state initially', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    const wrapper = mount(DmnTable, { props: { dmnFilePath: 'test.dmn' } })
    giveContainerDimensions(wrapper)
    await new Promise(resolve => setTimeout(resolve, 0))
    await flushPromises()
    expect(wrapper.text()).toContain('Loading DMN decision table...')
  })

  it('defaults containerHeight to 500px when height is auto', () => {
    mockFetchSuccess()
    const wrapper = mount(DmnTable, { props: { dmnFilePath: 'test.dmn' } })
    const outerDiv = wrapper.find('div').element as HTMLDivElement
    expect(outerDiv.style.height).toBe('500px')
  })

  it('uses provided height for containerHeight', () => {
    mockFetchSuccess()
    const wrapper = mount(DmnTable, {
      props: { dmnFilePath: 'test.dmn', height: '700px' },
    })
    const outerDiv = wrapper.find('div').element as HTMLDivElement
    expect(outerDiv.style.height).toBe('700px')
  })

  it('renders successfully when container has dimensions', async () => {
    mockFetchSuccess()
    const wrapper = mount(DmnTable, { props: { dmnFilePath: 'test.dmn' } })
    giveContainerDimensions(wrapper)
    await waitForRender()

    expect(mockImportXML).toHaveBeenCalled()
    expect(mockOpen).toHaveBeenCalledWith(TABLE_VIEW)
  })

  it('prevents duplicate rendering on second onSlideEnter call', async () => {
    mockFetchSuccess()
    const wrapper = mount(DmnTable, { props: { dmnFilePath: 'test.dmn' } })
    giveContainerDimensions(wrapper)
    await waitForRender()

    const callCountAfterMount = MockDmnViewer.mock.calls.length

    const lastCallback = slideEnterCallbacks[slideEnterCallbacks.length - 1]
    if (lastCallback) {
      await lastCallback()
      await flushPromises()
    }

    expect(MockDmnViewer.mock.calls.length).toBe(callCountAfterMount)
  })

  it('allows retry after error', async () => {
    mockFetchFailure()
    const wrapper = mount(DmnTable, { props: { dmnFilePath: 'test.dmn' } })
    giveContainerDimensions(wrapper)
    await waitForRender()

    expect(wrapper.text()).toContain('Failed to load DMN')

    mockFetchSuccess()

    const lastCallback = slideEnterCallbacks[slideEnterCallbacks.length - 1]
    if (lastCallback) {
      await lastCallback()
      await waitForRender()
    }

    expect(mockImportXML).toHaveBeenCalled()
  })

  it('shows error on fetch failure', async () => {
    mockFetchFailure()
    const wrapper = mount(DmnTable, { props: { dmnFilePath: 'missing.dmn' } })
    giveContainerDimensions(wrapper)
    await waitForRender()

    expect(wrapper.text()).toContain('Failed to load DMN')
  })

  it('shows error when no decision table found', async () => {
    mockGetViews.mockReturnValue([{ type: 'drd' }])
    mockFetchSuccess()
    const wrapper = mount(DmnTable, { props: { dmnFilePath: 'test.dmn' } })
    giveContainerDimensions(wrapper)
    await waitForRender()

    expect(wrapper.text()).toContain('Failed to load DMN')
  })

  it('opens specific decision table by decisionId', async () => {
    mockGetViews.mockReturnValue([TABLE_VIEW, TABLE_VIEW_2])
    mockFetchSuccess()
    const wrapper = mount(DmnTable, {
      props: { dmnFilePath: 'test.dmn', decisionId: 'decision2' },
    })
    giveContainerDimensions(wrapper)
    await waitForRender()

    expect(mockOpen).toHaveBeenCalledWith(TABLE_VIEW_2)
  })

  it('opens first decision table when no decisionId provided', async () => {
    mockGetViews.mockReturnValue([TABLE_VIEW, TABLE_VIEW_2])
    mockFetchSuccess()
    const wrapper = mount(DmnTable, { props: { dmnFilePath: 'test.dmn' } })
    giveContainerDimensions(wrapper)
    await waitForRender()

    expect(mockOpen).toHaveBeenCalledWith(TABLE_VIEW)
  })

  it('hides the "View DRD" button by default', () => {
    mockFetchSuccess()
    const wrapper = mount(DmnTable, { props: { dmnFilePath: 'test.dmn' } })
    expect(wrapper.find('div.dmn-table-wrapper').classes()).toContain('hide-drd-button')
  })

  it('keeps the "View DRD" button when showDrdButton is true', () => {
    mockFetchSuccess()
    const wrapper = mount(DmnTable, {
      props: { dmnFilePath: 'test.dmn', showDrdButton: true },
    })
    expect(wrapper.find('div.dmn-table-wrapper').classes()).not.toContain('hide-drd-button')
  })
})
