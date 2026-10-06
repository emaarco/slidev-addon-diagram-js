import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDiagramFile } from '../../../shared/lib/useDiagramFile'

describe('useDiagramFile', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('starts with loading true and error null', () => {
      const { loading, error } = useDiagramFile('BPMN')
      expect(loading.value).toBe(true)
      expect(error.value).toBeNull()
    })
  })

  describe('fetchDiagramFile', () => {
    it('resolves the correct URL and returns XML text', async () => {
      const xml = '<definitions></definitions>'
      fetchMock.mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })

      const { fetchDiagramFile } = useDiagramFile('BPMN')
      const result = await fetchDiagramFile('diagram.bpmn')

      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/diagram.bpmn')
      expect(result).toBe(xml)
    })

    describe('when the deck is served from a sub-path', () => {
      beforeEach(() => {
        vi.stubEnv('BASE_URL', '/deck/')
        fetchMock.mockResolvedValue({ ok: true, text: () => Promise.resolve('') })
      })

      afterEach(() => {
        vi.unstubAllEnvs()
      })

      it('keeps a root-relative path inside the base', async () => {
        await useDiagramFile('BPMN').fetchDiagramFile('/diagram.bpmn')

        expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/deck/diagram.bpmn')
      })

      it('does not prefix a path that already carries the base', async () => {
        await useDiagramFile('BPMN').fetchDiagramFile('/deck/diagram.bpmn')

        expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/deck/diagram.bpmn')
      })

      it('resolves a relative path against the base', async () => {
        await useDiagramFile('BPMN').fetchDiagramFile('diagram.bpmn')

        expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/deck/diagram.bpmn')
      })
    })

    it('throws on non-ok response', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 404 })

      const { fetchDiagramFile } = useDiagramFile('BPMN')
      await expect(fetchDiagramFile('missing.bpmn')).rejects.toThrow('404')
    })

    it('names the diagram kind in the fetch error', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 404 })

      const { fetchDiagramFile } = useDiagramFile('DMN')
      await expect(fetchDiagramFile('missing.dmn')).rejects.toThrow('Failed to fetch DMN file: 404')
    })

    it('throws on network error', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'))

      const { fetchDiagramFile } = useDiagramFile('BPMN')
      await expect(fetchDiagramFile('any.bpmn')).rejects.toThrow('fetch failed')
    })
  })

  describe('withLoading', () => {
    it('returns result and clears loading on success', async () => {
      const { loading, error, withLoading } = useDiagramFile('BPMN')

      const result = await withLoading(async () => 'success')

      expect(result).toBe('success')
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('captures error message and returns undefined on failure', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const { loading, error, withLoading } = useDiagramFile('BPMN')

      const result = await withLoading(async () => {
        throw new Error('boom')
      })

      expect(result).toBeUndefined()
      expect(loading.value).toBe(false)
      expect(error.value).toContain('boom')
    })

    it('names the diagram kind in the load error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const { error, withLoading } = useDiagramFile('DMN')

      await withLoading(async () => {
        throw new Error('boom')
      })

      expect(error.value).toBe('Failed to load DMN: boom')
    })


  })
})
