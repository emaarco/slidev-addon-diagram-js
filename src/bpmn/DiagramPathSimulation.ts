import type { NumberRange, PathSimulation, PathVariable, Scenario, SimulatedPath, Variables } from '@emaarco/bpmn-js-data-simulation'
import type { PathSimulationTarget } from './PathSimulationTarget'

interface ElementRegistry {
  get(id: string): { businessObject: { name?: unknown } } | undefined
}

type ServiceLookup = (name: string) => unknown

/** The path simulation of a bpmn-js viewer or modeler that has the PathSimulationModule. */
export class DiagramPathSimulation implements PathSimulationTarget {
  constructor(private readonly service: ServiceLookup) {}

  simulate(variables: Variables): SimulatedPath {
    return this.pathSimulation().simulate(variables)
  }

  clear(): void {
    this.pathSimulation().clear()
  }

  variablesReadByConditions(values: Variables, ranges?: Readonly<Record<string, Partial<NumberRange>>>): PathVariable[] {
    return this.pathSimulation().deriveVariables(values, { ranges })
  }

  variablesOf(scenario: Scenario | undefined, scenarios: readonly Scenario[]): Variables {
    return this.pathSimulation().variablesOf(scenario, scenarios)
  }

  elementName(id: string): string {
    const name = (this.service('elementRegistry') as ElementRegistry).get(id)?.businessObject.name
    return typeof name === 'string' && name.trim() ? name.trim() : id
  }

  private pathSimulation(): PathSimulation {
    return this.service('pathSimulation') as PathSimulation
  }
}
