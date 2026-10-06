import { Modeler, Viewer } from '@miragon/wardley-renderer'
import commandStackMissingInReadOnlyViewer from 'diagram-js/lib/command/index.js'
import type { ExportSvg, OpenModeler } from '../../shared/lib/diagramAdapter'

export const blankWardleyMap = 'title New Map'

export const exportWardleyMapSvg: ExportSvg = async (source, container) => {
  const viewer = new Viewer({ container, additionalModules: [commandStackMissingInReadOnlyViewer] })
  try {
    await viewer.importDSL(source)
    const { svg } = await viewer.saveSVG()
    return svg
  } finally {
    viewer.destroy()
  }
}

export const openWardleyMapModeler: OpenModeler = async (source, container) => {
  const modeler = new Modeler({ container })
  await modeler.importDSL(source)

  return {
    exportSource: () => modeler.exportDSL(),
    destroy: () => modeler.destroy(),
  }
}
