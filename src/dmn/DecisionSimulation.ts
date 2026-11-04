import {
  type DecisionModel,
  type EvaluationResult,
  type RawValue,
  DecisionTableEvaluator,
  DmnXmlReader,
} from '@emaarco/dmn-js-simulation'

export class DecisionSimulation {
  private readonly model: DecisionModel
  private readonly evaluator: DecisionTableEvaluator

  constructor(dmnXml: string, decisionId?: string) {
    this.model = new DmnXmlReader().readDecisionTable(dmnXml, decisionId)
    this.evaluator = new DecisionTableEvaluator(this.model)
  }

  get inputs(): DecisionModel['inputs'] {
    return this.model.inputs
  }

  emptyValues(): RawValue[] {
    return this.model.inputs.map(() => '')
  }

  // An incomplete input set can never match a concrete rule.
  isComplete(values: RawValue[]): boolean {
    return this.model.inputs.length > 0
      && values.length === this.model.inputs.length
      && values.every(value => value !== '' && value !== null && value !== undefined)
  }

  evaluate(values: RawValue[]): EvaluationResult {
    return this.evaluator.evaluate(values)
  }
}
