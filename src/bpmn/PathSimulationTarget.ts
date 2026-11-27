import type { NumberRange, PathVariable, Scenario, SimulatedPath, Variables } from '@emaarco/bpmn-js-data-simulation'

/** A rendered diagram with the path simulation: a viewer, or a modeler that is being edited. */
export interface PathSimulationTarget {
  simulate(variables: Variables): SimulatedPath
  clear(): void
  // The variables the conditions read, each typed by its current value; `ranges` fixes slider bounds.
  variablesReadByConditions(values: Variables, ranges?: Readonly<Record<string, Partial<NumberRange>>>): PathVariable[]
  // The scenario's variables after the diagram's output mappings, the other scenarios filling the gaps.
  variablesOf(scenario: Scenario | undefined, scenarios: readonly Scenario[]): Variables
  // The element's name, or its id when it has none.
  elementName(id: string): string
}
