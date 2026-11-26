import type { PathSimulation, PathVariable, Scenario, SimulatedPath, Variables } from '@emaarco/bpmn-js-data-simulation'
import { BpmnLiveViewer } from './BpmnLiveViewer'

interface ElementRegistry {
  get(id: string): { businessObject: { name?: unknown } } | undefined
}

/** A bpmn-js viewer with the path simulation: marks the path the gateways take for given variables. */
export class BpmnPathSimulationViewer extends BpmnLiveViewer {
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

  simulate(variables: Variables): SimulatedPath {
    return this.pathSimulation().simulate(variables)
  }

  // The variables the gateway conditions read, each typed by its current value.
  variablesReadByConditions(values: Variables): PathVariable[] {
    return this.pathSimulation().deriveVariables(values)
  }

  // The scenario's variables after the diagram's output mappings, the other scenarios filling the gaps.
  variablesOf(scenario: Scenario | undefined, scenarios: readonly Scenario[]): Variables {
    return this.pathSimulation().variablesOf(scenario, scenarios)
  }

  // The element's name, or its id when it has none.
  elementName(id: string): string {
    const name = this.elementRegistry().get(id)?.businessObject.name
    return typeof name === 'string' && name.trim() ? name.trim() : id
  }

  private pathSimulation(): PathSimulation {
    return this.viewer.get('pathSimulation') as PathSimulation
  }

  private elementRegistry(): ElementRegistry {
    return this.viewer.get('elementRegistry') as ElementRegistry
  }
}
