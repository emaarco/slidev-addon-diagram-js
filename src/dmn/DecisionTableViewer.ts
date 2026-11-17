import DmnViewer from 'dmn-js/lib/Viewer'
import { DiagramTheme } from '../shared/lib/DiagramTheme'
import type { LiveViewer } from '../shared/lib/notation'

export class DecisionTableViewer implements LiveViewer {
  private readonly viewer: any

  constructor(container: HTMLElement, private readonly decisionId?: string, theme = new DiagramTheme()) {
    this.viewer = new DmnViewer({ container, drd: { drdRenderer: theme.rendererColors() } })
  }

  async show(source: string): Promise<void> {
    await this.viewer.importXML(source)
    const tableView = this.viewer.getViews().find((view: any) =>
      view.type === 'decisionTable' && (!this.decisionId || view.element?.id === this.decisionId))
    if (!tableView) {
      throw new Error('No decision table view found in DMN file')
    }
    await this.viewer.open(tableView)
  }

  destroy(): void {
    this.viewer.destroy()
  }
}
