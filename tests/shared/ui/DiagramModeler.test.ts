import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type VueWrapper, flushPromises, mount } from '@vue/test-utils'

import DiagramModeler from '../../../shared/ui/DiagramModeler.vue'

const SAMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>'
const FILE_SOURCE = 'title Order Checkout'
const EDITED_SOURCE = 'title Order Checkout\nevent Order Placed [620, 300]'
const MODELER_STYLES = '.djs-palette { top: 12px; }'

function modelerStylesAreApplied(): boolean {
  return [...document.head.querySelectorAll('style')].some(style => style.textContent === MODELER_STYLES)
}

function mockFetchSuccess(source = FILE_SOURCE) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(source),
  }))
}

function findButton(label: string): HTMLButtonElement | undefined {
  return [...document.body.querySelectorAll('button')].find(button => button.textContent?.includes(label))
}

describe('DiagramModeler.vue', () => {
  let wrapper: VueWrapper
  let exportSvg: ReturnType<typeof vi.fn>
  let openModeler: ReturnType<typeof vi.fn>
  let session: { exportSource: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> }

  function mountModeler(props: { filePath?: string } = { filePath: 'board.storm' }) {
    wrapper = mount(DiagramModeler, {
      attachTo: document.body,
      props: {
        ...props,
        diagramKind: 'Event Storming',
        blankSource: 'title New Board',
        width: '100%',
        height: '500px',
        exportSvg,
        openModeler,
        modelerStyles: MODELER_STYLES,
      },
    })
  }

  async function openAndCloseModeler() {
    findButton('Edit')!.click()
    await flushPromises()
    findButton('Close')!.click()
    await flushPromises()
  }

  beforeEach(() => {
    session = { exportSource: vi.fn().mockReturnValue(FILE_SOURCE), destroy: vi.fn() }
    exportSvg = vi.fn().mockResolvedValue(SAMPLE_SVG)
    openModeler = vi.fn().mockResolvedValue(session)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('shows the preview and offers editing once the file is rendered', async () => {
    mockFetchSuccess()

    mountModeler()
    expect(findButton('Edit')).toBeUndefined()
    await flushPromises()

    expect(wrapper.html()).toContain('<svg')
    expect(findButton('Edit')).toBeDefined()
  })

  it('does not offer editing when the file cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))

    mountModeler()
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load Event Storming')
    expect(findButton('Edit')).toBeUndefined()
  })

  it('starts from the blank source without fetching when no file is given', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    mountModeler({})
    await flushPromises()

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(exportSvg.mock.calls[0][0]).toBe('title New Board')
    expect(findButton('Edit')).toBeDefined()
  })

  it('opens the modeler fullscreen with the rendered source', async () => {
    mockFetchSuccess()
    mountModeler()
    await flushPromises()

    findButton('Edit')!.click()
    await flushPromises()

    expect(openModeler).toHaveBeenCalledOnce()
    const [source, container] = openModeler.mock.calls[0]
    expect(source).toBe(FILE_SOURCE)
    expect(document.body.contains(container)).toBe(true)
    expect(findButton('Close')).toBeDefined()
  })

  it('shows the edited diagram in the preview after closing', async () => {
    mockFetchSuccess()
    session.exportSource.mockReturnValue(EDITED_SOURCE)
    mountModeler()
    await flushPromises()

    await openAndCloseModeler()

    expect(exportSvg).toHaveBeenCalledTimes(2)
    expect(exportSvg.mock.calls[1][0]).toBe(EDITED_SOURCE)
    expect(findButton('Close')).toBeUndefined()
  })

  it('reopens the modeler with the edited source', async () => {
    mockFetchSuccess()
    session.exportSource.mockReturnValue(EDITED_SOURCE)
    mountModeler()
    await flushPromises()
    await openAndCloseModeler()

    findButton('Edit')!.click()
    await flushPromises()

    expect(openModeler.mock.calls[1][0]).toBe(EDITED_SOURCE)
  })

  it('leaves the preview alone when nothing was edited', async () => {
    mockFetchSuccess()
    mountModeler()
    await flushPromises()

    await openAndCloseModeler()

    expect(exportSvg).toHaveBeenCalledOnce()
  })

  it('destroys the modeler when closing', async () => {
    mockFetchSuccess()
    mountModeler()
    await flushPromises()

    await openAndCloseModeler()

    expect(session.destroy).toHaveBeenCalledOnce()
  })

  it('keeps the preview when the edited diagram cannot be exported', async () => {
    mockFetchSuccess()
    session.exportSource.mockImplementation(() => {
      throw new Error('export failed')
    })
    mountModeler()
    await flushPromises()

    await openAndCloseModeler()

    expect(exportSvg).toHaveBeenCalledOnce()
    expect(session.destroy).toHaveBeenCalledOnce()
    expect(wrapper.html()).toContain('<svg')
  })

  it('applies the modeler styles only while the modeler is open', async () => {
    mockFetchSuccess()
    mountModeler()
    await flushPromises()
    expect(modelerStylesAreApplied()).toBe(false)

    findButton('Edit')!.click()
    await flushPromises()
    expect(modelerStylesAreApplied()).toBe(true)

    findButton('Close')!.click()
    await flushPromises()
    expect(modelerStylesAreApplied()).toBe(false)
  })

  it('removes the modeler styles when the slide is unmounted with the modeler open', async () => {
    mockFetchSuccess()
    mountModeler()
    await flushPromises()
    findButton('Edit')!.click()
    await flushPromises()

    wrapper.unmount()

    expect(modelerStylesAreApplied()).toBe(false)
  })

  it('lets the modeler see key strokes but keeps them from the slide navigation while open', async () => {
    const modelerShortcuts = vi.fn()
    const slideNavigation = vi.fn()
    document.addEventListener('keydown', modelerShortcuts)
    window.addEventListener('keydown', slideNavigation)
    mockFetchSuccess()
    mountModeler()
    await flushPromises()
    findButton('Edit')!.click()
    await flushPromises()

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

    expect(modelerShortcuts).toHaveBeenCalledOnce()
    expect(slideNavigation).not.toHaveBeenCalled()
    document.removeEventListener('keydown', modelerShortcuts)
    window.removeEventListener('keydown', slideNavigation)
  })

  it('hands key strokes back to the slide navigation after closing', async () => {
    const slideNavigation = vi.fn()
    window.addEventListener('keydown', slideNavigation)
    mockFetchSuccess()
    mountModeler()
    await flushPromises()
    await openAndCloseModeler()

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

    expect(slideNavigation).toHaveBeenCalledOnce()
    window.removeEventListener('keydown', slideNavigation)
  })

  it('destroys an open modeler when the slide is unmounted', async () => {
    mockFetchSuccess()
    mountModeler()
    await flushPromises()
    findButton('Edit')!.click()
    await flushPromises()

    wrapper.unmount()

    expect(session.destroy).toHaveBeenCalledOnce()
  })
})
