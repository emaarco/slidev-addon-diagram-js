import BpmnViewer from 'bpmn-js/lib/Viewer'
import { DiagramTheme } from '../shared/lib/DiagramTheme'
import type { StaticNotation } from '../shared/lib/notation'

export class BpmnDiagramNotation implements StaticNotation {
  readonly kind = 'BPMN'
  readonly rendering = 'static'

  constructor(private readonly theme = new DiagramTheme()) {}

  async exportSvg(source: string, container: HTMLElement): Promise<string> {
    const viewer = new BpmnViewer({ container, bpmnRenderer: this.theme.rendererColors() })
    try {
      await viewer.importXML(source)
      const { svg } = await viewer.saveSVG()
      return svg
    } finally {
      viewer.destroy()
    }
  }
}
