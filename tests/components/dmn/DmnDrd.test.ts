import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const { mockDestroy, mockImportXML, mockSaveSVG, mockOpen, mockGetViews, mockGetActiveViewer, MockDmnViewer } = vi.hoisted(() => ({
  mockDestroy: vi.fn(),
  mockImportXML: vi.fn(),
  mockSaveSVG: vi.fn(),
  mockOpen: vi.fn(),
  mockGetViews: vi.fn(),
  mockGetActiveViewer: vi.fn(),
  MockDmnViewer: vi.fn(),
}))

vi.mock('dmn-js/lib/Viewer', () => ({
  default: MockDmnViewer,
}))

import DmnDrd from '../../../components/dmn/DmnDrd.vue'

const SAMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect width="100" height="50"/></svg>'
const DRD_VIEW = { type: 'drd' }

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

describe('DmnDrd.vue', () => {
  beforeEach(() => {
    mockImportXML.mockResolvedValue(undefined)
    mockOpen.mockResolvedValue(undefined)
    mockGetViews.mockReturnValue([DRD_VIEW])
    mockSaveSVG.mockResolvedValue({ svg: SAMPLE_SVG })
    mockGetActiveViewer.mockReturnValue({ saveSVG: mockSaveSVG })
    MockDmnViewer.mockImplementation(function () {
      return {
        importXML: mockImportXML,
        getViews: mockGetViews,
        open: mockOpen,
        getActiveViewer: mockGetActiveViewer,
        destroy: mockDestroy,
      }
    })

    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows loading state initially', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    const wrapper = mount(DmnDrd, { props: { dmnFilePath: 'test.dmn' } })
    await flushPromises()
    expect(wrapper.text()).toContain('Loading DMN diagram...')
  })

  it('renders SVG after successful load', async () => {
    mockFetchSuccess()
    const wrapper = mount(DmnDrd, { props: { dmnFilePath: 'test.dmn' } })
    await flushPromises()

    expect(wrapper.text()).not.toContain('Loading DMN diagram...')
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('svg rect').exists()).toBe(true)
  })

  it('shows error on fetch failure', async () => {
    mockFetchFailure()
    const wrapper = mount(DmnDrd, { props: { dmnFilePath: 'missing.dmn' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load DMN')
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('shows error when no DRD view found', async () => {
    mockGetViews.mockReturnValue([{ type: 'decisionTable' }])
    mockFetchSuccess()
    const wrapper = mount(DmnDrd, { props: { dmnFilePath: 'test.dmn' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load DMN')
  })

  it('sets preserveAspectRatio on rendered SVG', async () => {
    mockFetchSuccess()
    const wrapper = mount(DmnDrd, { props: { dmnFilePath: 'test.dmn' } })
    await flushPromises()

    expect(wrapper.html()).toContain('preserveAspectRatio="xMidYMid meet"')
  })

  it('applies width and height props to SVG style', async () => {
    mockFetchSuccess()
    const wrapper = mount(DmnDrd, {
      props: { dmnFilePath: 'test.dmn', width: '800px', height: '600px' },
    })
    await flushPromises()

    const html = wrapper.html()
    expect(html).toContain('max-width: 800px')
    expect(html).toContain('height: 600px')
  })

  it('uses default width and height on SVG when not provided', async () => {
    mockFetchSuccess()
    const wrapper = mount(DmnDrd, { props: { dmnFilePath: 'test.dmn' } })
    await flushPromises()

    const html = wrapper.html()
    expect(html).toContain('max-width: 100%')
    expect(html).toContain('height: auto')
  })

  it('cleans up off-screen container after render', async () => {
    mockFetchSuccess()
    const childCountBefore = document.body.childNodes.length

    mount(DmnDrd, { props: { dmnFilePath: 'test.dmn' } })
    await flushPromises()

    expect(document.body.childNodes.length).toBe(childCountBefore)
  })

  it('calls viewer.destroy() after rendering', async () => {
    mockFetchSuccess()
    mount(DmnDrd, { props: { dmnFilePath: 'test.dmn' } })
    await flushPromises()

    expect(mockDestroy).toHaveBeenCalledOnce()
  })

  it('calls viewer.destroy() even when rendering fails', async () => {
    mockSaveSVG.mockRejectedValue(new Error('SVG export failed'))
    mockFetchSuccess()
    mount(DmnDrd, { props: { dmnFilePath: 'test.dmn' } })
    await flushPromises()

    expect(mockDestroy).toHaveBeenCalledOnce()
  })
})
