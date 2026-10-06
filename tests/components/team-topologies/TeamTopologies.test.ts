import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { mockImportDocument, mockSaveSVG, mockDestroy, MockViewer } = vi.hoisted(() => ({
  mockImportDocument: vi.fn(),
  mockSaveSVG: vi.fn(),
  mockDestroy: vi.fn(),
  MockViewer: vi.fn(),
}))

vi.mock('@miragon/team-topologies-renderer', () => ({ Viewer: MockViewer, Modeler: vi.fn() }))

import { emptyDocument, serializeDocument } from '@miragon/team-topologies-schema-model'
import TeamTopologies from '../../../components/team-topologies/TeamTopologies.vue'

const SAMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>'
const DOCUMENT_JSON = serializeDocument(emptyDocument('Online shop'))
const DOCUMENT_WITH_UNKNOWN_TEAM_TYPE_JSON = '{"version":3,"title":"Online shop","nodes":[{"id":"team_a","type":"unknown-type"}]}'

function mockFetchSuccess(source = DOCUMENT_JSON) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(source),
  }))
}

describe('TeamTopologies.vue', () => {
  beforeEach(() => {
    mockSaveSVG.mockReturnValue({ svg: SAMPLE_SVG })
    MockViewer.mockImplementation(function () {
      return {
        importDocument: mockImportDocument,
        saveSVG: mockSaveSVG,
        destroy: mockDestroy,
      }
    })

    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows loading state initially', () => {
    mockFetchSuccess()

    const wrapper = mount(TeamTopologies, { props: { teamTopologiesFilePath: 'teams.tt' } })

    expect(wrapper.text()).toContain('Loading Team Topologies diagram...')
  })

  it('renders the exported SVG', async () => {
    mockFetchSuccess()

    const wrapper = mount(TeamTopologies, { props: { teamTopologiesFilePath: 'teams.tt' } })
    await flushPromises()

    expect(wrapper.html()).toContain('<svg')
    expect(wrapper.html()).toContain('<rect')
  })

  it('validates the JSON file and imports the parsed document', async () => {
    mockFetchSuccess()

    mount(TeamTopologies, { props: { teamTopologiesFilePath: 'teams.tt' } })
    await flushPromises()

    expect(mockImportDocument).toHaveBeenCalledWith(expect.objectContaining({ title: 'Online shop', nodes: [] }))
  })

  it('shows a validation error for an invalid document without rendering it', async () => {
    mockFetchSuccess(DOCUMENT_WITH_UNKNOWN_TEAM_TYPE_JSON)

    const wrapper = mount(TeamTopologies, { props: { teamTopologiesFilePath: 'teams.tt' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load Team Topologies: nodes.0.type')
    expect(MockViewer).not.toHaveBeenCalled()
  })

  it('shows an error when the file is not JSON', async () => {
    mockFetchSuccess('not json')

    const wrapper = mount(TeamTopologies, { props: { teamTopologiesFilePath: 'teams.tt' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load Team Topologies')
    expect(MockViewer).not.toHaveBeenCalled()
  })

  it('applies default and custom sizes to the wrapper', async () => {
    mockFetchSuccess()

    const withDefaults = mount(TeamTopologies, { props: { teamTopologiesFilePath: 'teams.tt' } })
    const withCustomSize = mount(TeamTopologies, {
      props: { teamTopologiesFilePath: 'teams.tt', width: '60%', height: '320px' },
    })
    await flushPromises()

    expect(withDefaults.find('.static-diagram').attributes('style')).toContain('width: 100%')
    expect(withDefaults.find('.static-diagram').attributes('style')).toContain('height: auto')
    expect(withCustomSize.find('.static-diagram').attributes('style')).toContain('width: 60%')
    expect(withCustomSize.find('.static-diagram').attributes('style')).toContain('height: 320px')
  })

  it('destroys the viewer after rendering', async () => {
    mockFetchSuccess()

    mount(TeamTopologies, { props: { teamTopologiesFilePath: 'teams.tt' } })
    await flushPromises()

    expect(mockDestroy).toHaveBeenCalledOnce()
  })

  it('destroys the viewer when the import fails', async () => {
    mockFetchSuccess()
    mockImportDocument.mockImplementation(() => {
      throw new Error('unknown team type')
    })

    const wrapper = mount(TeamTopologies, { props: { teamTopologiesFilePath: 'teams.tt' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load Team Topologies: unknown team type')
    expect(mockDestroy).toHaveBeenCalledOnce()
  })
})
