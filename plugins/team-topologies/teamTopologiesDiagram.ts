import { Modeler, Viewer } from '@miragon/team-topologies-renderer'
import {
  type TtDocument,
  emptyDocument,
  parseDocument,
  serializeDocument,
} from '@miragon/team-topologies-schema-model'
import type { ExportSvg, OpenModeler } from '../../shared/lib/diagramAdapter'

export const blankTeamTopologiesDiagram = serializeDocument(emptyDocument())

export const exportTeamTopologiesSvg: ExportSvg = async (source, container) => {
  const teamTopologies = parseTeamTopologies(source)

  const viewer = new Viewer({ container })
  try {
    viewer.importDocument(teamTopologies)
    return viewer.saveSVG().svg
  } finally {
    viewer.destroy()
  }
}

export const openTeamTopologiesModeler: OpenModeler = async (source, container) => {
  const modeler = new Modeler({ container })
  modeler.importDocument(parseTeamTopologies(source))

  return {
    exportSource: () => serializeDocument(modeler.exportDocument()),
    destroy: () => modeler.destroy(),
  }
}

function parseTeamTopologies(source: string): TtDocument {
  const parsed = parseDocument(JSON.parse(source))
  if (!parsed.ok) {
    throw new Error(parsed.error)
  }
  return parsed.document
}
