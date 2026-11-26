import { Modeler, Viewer, saveSVG, type BoardBounds, type EventStormingViewOptions } from '@miragon/event-storming-renderer'
import type Canvas from 'diagram-js/lib/core/Canvas'
import commandStackMissingInReadOnlyViewer from 'diagram-js/lib/command/index.js'
import { DiagramTheme } from '../shared/lib/DiagramTheme'
import type { ModelerContainers, ModelerNotation, ModelerSession, StaticNotation } from '../shared/lib/notation'

// The renderer's own saveSVG() frames a board with 120 px, which leaves it small on a slide.
// 16 px still holds the sticky shadow (5 px offset, 5 px blur).
const EXPORT_MARGIN = 16

export class EventStormingNotation implements StaticNotation, ModelerNotation {
  readonly kind = 'Event Storming'
  readonly rendering = 'static'
  readonly blankSource = 'title New Board'

  constructor(
    private readonly theme = new DiagramTheme(),
    private readonly typeCaptions = true,
  ) {}

  async exportSvg(source: string, container: HTMLElement): Promise<string> {
    const viewer = new Viewer({ container, additionalModules: [commandStackMissingInReadOnlyViewer] })
    try {
      viewer.get<EventStormingViewOptions>('eventStormingViewOptions').setTypeCaptionsVisible(this.typeCaptions)
      await viewer.importDSL(source)
      this.theme.darkCanvas()?.paint(container)
      const boardBounds = viewer.get<BoardBounds>('boardBounds').contentBounds(EXPORT_MARGIN)
      return saveSVG(viewer.get<Canvas>('canvas'), boardBounds).svg
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
