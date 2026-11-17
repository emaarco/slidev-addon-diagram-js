import BpmnViewer from 'bpmn-js/lib/Viewer'
import { type DiagramTheme, rendererColors } from '../shared/lib/diagramTheme'
import type { StaticNotation } from '../shared/lib/notation'

export class BpmnDiagramNotation implements StaticNotation {
  readonly kind = 'BPMN'
  readonly rendering = 'static'

  constructor(private readonly theme: DiagramTheme = 'light') {}

  async exportSvg(source: string, container: HTMLElement): Promise<string> {
    const viewer = new BpmnViewer({ container, bpmnRenderer: rendererColors[this.theme] })
    try {
      await viewer.importXML(source)
      const { svg } = await viewer.saveSVG()
      return svg
    } finally {
      viewer.destroy()
    }
  }
}
