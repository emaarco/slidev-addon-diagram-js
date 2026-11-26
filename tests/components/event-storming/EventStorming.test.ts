import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { mockImportDSL, mockSaveSVG, mockDestroy, mockSetTypeCaptionsVisible, mockContentBounds, MockViewer } = vi.hoisted(() => ({
  mockImportDSL: vi.fn(),
  mockSaveSVG: vi.fn(),
  mockDestroy: vi.fn(),
  mockSetTypeCaptionsVisible: vi.fn(),
  mockContentBounds: vi.fn(),
  MockViewer: vi.fn(),
}))

vi.mock('@miragon/event-storming-renderer', () => ({ Viewer: MockViewer, saveSVG: mockSaveSVG }))

import EventStorming from '../../../components/event-storming/EventStorming.vue'

const SAMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>'
const BOARD_DSL = 'title Order Checkout\nevent Order Placed [620, 300]'
const BOARD_BOUNDS = { x: 604, y: 284, width: 192, height: 132 }
const CANVAS = { name: 'canvas' }

function mockFetchSuccess(source = BOARD_DSL) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(source),
  }))
}

describe('EventStorming.vue', () => {
  beforeEach(() => {
    mockImportDSL.mockResolvedValue({ warnings: [] })
    mockSaveSVG.mockReturnValue({ svg: SAMPLE_SVG })
    mockContentBounds.mockReturnValue(BOARD_BOUNDS)
    const services: Record<string, unknown> = {
      canvas: CANVAS,
      boardBounds: { contentBounds: mockContentBounds },
      eventStormingViewOptions: { setTypeCaptionsVisible: mockSetTypeCaptionsVisible },
    }
    MockViewer.mockImplementation(function () {
      return {
        importDSL: mockImportDSL,
        get: (name: string) => services[name],
        destroy: mockDestroy,
      }
    })

    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows loading state initially', () => {
    mockFetchSuccess()

    const wrapper = mount(EventStorming, { props: { eventStormingFilePath: 'checkout.storm' } })

    expect(wrapper.text()).toContain('Loading Event Storming diagram...')
  })

  it('imports the board text and renders the exported SVG', async () => {
    mockFetchSuccess()

    const wrapper = mount(EventStorming, { props: { eventStormingFilePath: 'checkout.storm' } })
    await flushPromises()

    expect(mockImportDSL).toHaveBeenCalledWith(BOARD_DSL)
    expect(wrapper.html()).toContain('<svg')
    expect(wrapper.html()).toContain('<rect')
  })

  it('gives the read-only viewer the command stack its import relies on', async () => {
    mockFetchSuccess()

    mount(EventStorming, { props: { eventStormingFilePath: 'checkout.storm' } })
    await flushPromises()

    const [{ additionalModules }] = MockViewer.mock.calls[0]
    expect(additionalModules).toEqual([expect.objectContaining({ commandStack: expect.anything() })])
  })

  it('frames the exported SVG closely around the board', async () => {
    mockFetchSuccess()

    mount(EventStorming, { props: { eventStormingFilePath: 'checkout.storm' } })
    await flushPromises()

    expect(mockContentBounds).toHaveBeenCalledWith(16)
    expect(mockSaveSVG).toHaveBeenCalledWith(CANVAS, BOARD_BOUNDS)
  })

  it('shows the type captions on the stickies by default', async () => {
    mockFetchSuccess()

    mount(EventStorming, { props: { eventStormingFilePath: 'checkout.storm' } })
    await flushPromises()

    expect(mockSetTypeCaptionsVisible).toHaveBeenCalledWith(true)
  })

  it('hides the type captions before the board is drawn with typeCaptions=false', async () => {
    mockFetchSuccess()

    mount(EventStorming, { props: { eventStormingFilePath: 'checkout.storm', typeCaptions: false } })
    await flushPromises()

    expect(mockSetTypeCaptionsVisible).toHaveBeenCalledWith(false)
    expect(mockSetTypeCaptionsVisible.mock.invocationCallOrder[0]).toBeLessThan(mockImportDSL.mock.invocationCallOrder[0])
  })

  it('applies default and custom sizes to the wrapper', async () => {
    mockFetchSuccess()

    const withDefaults = mount(EventStorming, { props: { eventStormingFilePath: 'checkout.storm' } })
    const withCustomSize = mount(EventStorming, {
      props: { eventStormingFilePath: 'checkout.storm', width: '60%', height: '320px' },
    })
    await flushPromises()

    expect(withDefaults.find('.static-diagram').attributes('style')).toContain('width: 100%')
    expect(withDefaults.find('.static-diagram').attributes('style')).toContain('height: auto')
    expect(withCustomSize.find('.static-diagram').attributes('style')).toContain('width: 60%')
    expect(withCustomSize.find('.static-diagram').attributes('style')).toContain('height: 320px')
  })

  it('shows an error when the file cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))

    const wrapper = mount(EventStorming, { props: { eventStormingFilePath: 'missing.storm' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load Event Storming')
    expect(MockViewer).not.toHaveBeenCalled()
  })

  it('destroys the viewer after rendering', async () => {
    mockFetchSuccess()

    mount(EventStorming, { props: { eventStormingFilePath: 'checkout.storm' } })
    await flushPromises()

    expect(mockDestroy).toHaveBeenCalledOnce()
  })

  it('destroys the viewer when the import fails', async () => {
    mockFetchSuccess()
    mockImportDSL.mockRejectedValue(new Error('unknown sticky kind'))

    const wrapper = mount(EventStorming, { props: { eventStormingFilePath: 'checkout.storm' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load Event Storming: unknown sticky kind')
    expect(mockDestroy).toHaveBeenCalledOnce()
  })
  it('paints the exported SVG dark with theme="dark"', async () => {
    mockFetchSuccess()
    mockImportDSL.mockImplementation(() => {
      const [{ container }] = MockViewer.mock.calls[0]
      container.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"><text style="fill: #1D1D1D">Label</text></svg>'
      mockSaveSVG.mockImplementation(() => ({ svg: container.innerHTML }))
    })

    const wrapper = mount(EventStorming, { props: { eventStormingFilePath: 'checkout.storm', theme: 'dark' } })
    await flushPromises()

    expect(wrapper.find('text').attributes('style')).toContain('fill: rgb(230, 230, 230)')
  })
})
