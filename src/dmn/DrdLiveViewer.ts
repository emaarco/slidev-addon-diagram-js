import DmnViewer from 'dmn-js/lib/Viewer'
import { DiagramTheme } from '../shared/lib/DiagramTheme'
import type { LiveViewer } from '../shared/lib/notation'
import { fitActiveDrd } from './utils/fitActiveDrd'

export class DrdLiveViewer implements LiveViewer {
  private readonly viewer: any

  constructor(container: HTMLElement, theme = new DiagramTheme()) {
    this.viewer = new DmnViewer({ container, drd: { drdRenderer: theme.rendererColors() } })
  }

  async show(source: string): Promise<void> {
    await this.viewer.importXML(source)
    const drdView = this.viewer.getViews().find((view: any) => view.type === 'drd')
    if (drdView) await this.viewer.open(drdView)
  }

  fit(): void {
    fitActiveDrd(this.viewer)
  }

  destroy(): void {
    this.viewer.destroy()
  }
}
