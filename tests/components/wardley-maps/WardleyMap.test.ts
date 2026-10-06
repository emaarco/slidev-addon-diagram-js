import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { mockImportDSL, mockSaveSVG, mockDestroy, MockViewer } = vi.hoisted(() => ({
  mockImportDSL: vi.fn(),
  mockSaveSVG: vi.fn(),
  mockDestroy: vi.fn(),
  MockViewer: vi.fn(),
}))

vi.mock('@miragon/wardley-renderer', () => ({ Viewer: MockViewer }))

import WardleyMap from '../../../components/wardley-maps/WardleyMap.vue'

const SAMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>'
const MAP_DSL = 'title Tea Shop\ncomponent Kettle [0.43, 0.35]'

function mockFetchSuccess(source = MAP_DSL) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(source),
  }))
}

describe('WardleyMap.vue', () => {
  beforeEach(() => {
    mockImportDSL.mockResolvedValue({ warnings: [] })
    mockSaveSVG.mockResolvedValue({ svg: SAMPLE_SVG })
    MockViewer.mockImplementation(function () {
      return {
        importDSL: mockImportDSL,
        saveSVG: mockSaveSVG,
        destroy: mockDestroy,
      }
    })

    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows loading state initially', () => {
    mockFetchSuccess()

    const wrapper = mount(WardleyMap, { props: { wardleyMapFilePath: 'tea-shop.owm' } })

    expect(wrapper.text()).toContain('Loading Wardley Map diagram...')
  })

  it('imports the map text and renders the exported SVG', async () => {
    mockFetchSuccess()

    const wrapper = mount(WardleyMap, { props: { wardleyMapFilePath: 'tea-shop.owm' } })
    await flushPromises()

    expect(mockImportDSL).toHaveBeenCalledWith(MAP_DSL)
    expect(wrapper.html()).toContain('<svg')
    expect(wrapper.html()).toContain('<rect')
  })

  it('gives the read-only viewer the command stack its import relies on', async () => {
    mockFetchSuccess()

    mount(WardleyMap, { props: { wardleyMapFilePath: 'tea-shop.owm' } })
    await flushPromises()

    const [{ additionalModules }] = MockViewer.mock.calls[0]
    expect(additionalModules).toEqual([expect.objectContaining({ commandStack: expect.anything() })])
  })

  it('applies default and custom sizes to the wrapper', async () => {
    mockFetchSuccess()

    const withDefaults = mount(WardleyMap, { props: { wardleyMapFilePath: 'tea-shop.owm' } })
    const withCustomSize = mount(WardleyMap, {
      props: { wardleyMapFilePath: 'tea-shop.owm', width: '60%', height: '320px' },
    })
    await flushPromises()

    expect(withDefaults.find('.static-diagram').attributes('style')).toContain('width: 100%')
    expect(withDefaults.find('.static-diagram').attributes('style')).toContain('height: auto')
    expect(withCustomSize.find('.static-diagram').attributes('style')).toContain('width: 60%')
    expect(withCustomSize.find('.static-diagram').attributes('style')).toContain('height: 320px')
  })

  it('shows an error when the file cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))

    const wrapper = mount(WardleyMap, { props: { wardleyMapFilePath: 'missing.owm' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load Wardley Map')
    expect(MockViewer).not.toHaveBeenCalled()
  })

  it('destroys the viewer after rendering', async () => {
    mockFetchSuccess()

    mount(WardleyMap, { props: { wardleyMapFilePath: 'tea-shop.owm' } })
    await flushPromises()

    expect(mockDestroy).toHaveBeenCalledOnce()
  })

  it('destroys the viewer when the import fails', async () => {
    mockFetchSuccess()
    mockImportDSL.mockRejectedValue(new Error('unexpected token'))

    const wrapper = mount(WardleyMap, { props: { wardleyMapFilePath: 'tea-shop.owm' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load Wardley Map: unexpected token')
    expect(mockDestroy).toHaveBeenCalledOnce()
  })
})
