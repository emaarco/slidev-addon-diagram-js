import { Modeler, Viewer } from '@miragon/event-storming-renderer'
import commandStackMissingInReadOnlyViewer from 'diagram-js/lib/command/index.js'
import type { ExportSvg, OpenModeler } from '../../shared/lib/diagramAdapter'

export const blankEventStormingBoard = 'title New Board'

export const exportEventStormingSvg: ExportSvg = async (source, container) => {
  const viewer = new Viewer({ container, additionalModules: [commandStackMissingInReadOnlyViewer] })
  try {
    await viewer.importDSL(source)
    const { svg } = await viewer.saveSVG()
    return svg
  } finally {
    viewer.destroy()
  }
}

export const openEventStormingModeler: OpenModeler = async (source, container) => {
  const modeler = new Modeler({ container })
  await modeler.importDSL(source)

  return {
    exportSource: () => modeler.exportDSL(),
    destroy: () => modeler.destroy(),
  }
}
