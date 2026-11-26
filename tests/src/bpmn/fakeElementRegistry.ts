import type { DiagramElement, ElementRegistry } from '../../../src/bpmn/PathVariableFields'

export function sequenceFlow(id: string, condition?: string, name?: string): DiagramElement {
  const businessObject = { $type: 'bpmn:SequenceFlow', id, name, conditionExpression: condition ? { body: condition } : undefined }
  return { id, type: 'bpmn:SequenceFlow', businessObject: { ...businessObject, $instanceOf: () => false } }
}

export function flowNode(id: string, name?: string, outputs: Array<{ source: string; target: string }> = []): DiagramElement {
  const extensionElements = { values: [{ $type: 'zeebe:IoMapping', outputParameters: outputs }] }
  const businessObject = { $type: 'bpmn:ServiceTask', id, name, extensionElements }
  return { id, type: 'bpmn:ServiceTask', businessObject: { ...businessObject, $instanceOf: (type: string) => type === 'bpmn:FlowNode' } }
}

export function fakeElementRegistry(elements: DiagramElement[]): ElementRegistry {
  return {
    get: id => elements.find(element => element.id === id),
    filter: predicate => elements.filter(predicate),
  }
}

// The bike order of public/bike-order.bpmn, reduced to what the path simulation's controls read.
export const BIKE_ORDER = [
  flowNode('Task_CheckCredit', 'Check credit rating', [{ source: '=score >= 600', target: 'creditworthy' }]),
  flowNode('Gateway_Credit', 'Credit OK?'),
  sequenceFlow('Flow_Approved', '=creditworthy and orderTotal <= 5000', 'yes'),
  sequenceFlow('Flow_Review', '=creditworthy and orderTotal > 5000', 'large order'),
  sequenceFlow('Flow_Rejected', undefined, 'no'),
  sequenceFlow('Flow_Accessories', '=count(accessories) > 0'),
  sequenceFlow('Flow_Note', '=customer.note'),
]
