import { BpmnLiveViewer } from './BpmnLiveViewer'
import { DiagramPathSimulation } from './DiagramPathSimulation'

/** A bpmn-js viewer with the path simulation: marks the path the gateways take for given variables. */
export class BpmnPathSimulationViewer extends BpmnLiveViewer {
  readonly pathSimulation = new DiagramPathSimulation(name => this.viewer.get(name))

  constructor(
    container: HTMLElement,
    viewerOptions: Record<string, unknown>,
    maxScale: number | undefined,
    private readonly onShown: (viewer: BpmnPathSimulationViewer) => void,
  ) {
    super(container, viewerOptions, maxScale)
  }

  override async show(source: string): Promise<void> {
    await super.show(source)
    this.onShown(this)
  }
}
