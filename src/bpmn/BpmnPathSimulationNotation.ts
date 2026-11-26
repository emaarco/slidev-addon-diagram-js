import { PathSimulationModule } from '@emaarco/bpmn-js-data-simulation'
import type { DiagramTheme } from '../shared/lib/DiagramTheme'
import type { LiveNotation, LiveViewer } from '../shared/lib/notation'
import { BpmnPathSimulationViewer } from './BpmnPathSimulationViewer'
import { type Engine, bpmnEngines } from './engines/bpmnEngines'

export interface BpmnPathSimulationOptions {
  engine: Engine
  maxScale?: number
  theme?: DiagramTheme
  // Called with every viewer once it has imported its diagram.
  onShown: (viewer: BpmnPathSimulationViewer) => void
}

export class BpmnPathSimulationNotation implements LiveNotation {
  readonly kind = 'BPMN'
  readonly rendering = 'live'

  constructor(private readonly options: BpmnPathSimulationOptions) {}

  async createViewer(container: HTMLElement): Promise<LiveViewer> {
    const { engine, maxScale, theme, onShown } = this.options
    const viewerOptions = {
      additionalModules: [PathSimulationModule],
      moddleExtensions: bpmnEngines[engine].moddleExtensions,
      dataSimulation: { engine },
      bpmnRenderer: theme?.rendererColors() ?? {},
    }
    return new BpmnPathSimulationViewer(container, viewerOptions, maxScale, onShown)
  }
}
