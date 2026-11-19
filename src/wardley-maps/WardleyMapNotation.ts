import { Modeler, Viewer } from '@miragon/wardley-renderer'
import commandStackMissingInReadOnlyViewer from 'diagram-js/lib/command/index.js'
import { DiagramTheme } from '../shared/lib/DiagramTheme'
import type { ModelerContainers, ModelerNotation, ModelerSession, StaticNotation } from '../shared/lib/notation'

export class WardleyMapNotation implements StaticNotation, ModelerNotation {
  readonly kind = 'Wardley Map'
  readonly rendering = 'static'
  readonly blankSource = 'title New Map'

  constructor(private readonly theme = new DiagramTheme()) {}

  async exportSvg(source: string, container: HTMLElement): Promise<string> {
    const viewer = new Viewer({ container, additionalModules: [commandStackMissingInReadOnlyViewer] })
    try {
      await viewer.importDSL(source)
      this.theme.darkCanvas()?.paint(container)
      const { svg } = await viewer.saveSVG()
      return svg
    } finally {
      viewer.destroy()
    }
  }

  async openModeler(source: string, { canvas }: ModelerContainers): Promise<ModelerSession> {
    const modeler = new Modeler({ container: canvas })
    await modeler.importDSL(source)
    const stopPainting = this.theme.darkCanvas()?.follow(canvas)
    const importedSource = modeler.exportDSL()

    return {
      exportChanges: async () => {
        const source = modeler.exportDSL()
        return source === importedSource ? null : source
      },
      destroy: () => {
        stopPainting?.()
        modeler.destroy()
      },
    }
  }
}
