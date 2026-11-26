import { describe, expect, it } from 'vitest'
import { type Scenario, zeebeEngine } from '@emaarco/bpmn-js-data-simulation'
import { PathVariableFields } from '../../../src/bpmn/PathVariableFields'
import { BIKE_ORDER, fakeElementRegistry } from './fakeElementRegistry'

const fields = new PathVariableFields(fakeElementRegistry(BIKE_ORDER), zeebeEngine)

function scenario(id: string, variables: Scenario['variables'], taskResults: Scenario['taskResults'] = {}): Scenario {
  return { id, name: id, variables, taskResults }
}

describe('PathVariableFields', () => {
  it('derives one field per variable the gateway conditions read', () => {
    expect(fields.derive({}).map(field => field.name)).toEqual(['creditworthy', 'orderTotal', 'accessories', 'customer'])
  })

  it('picks the control from the current value', () => {
    const derived = fields.derive({ creditworthy: true, orderTotal: 1290, accessories: ['lock'], customer: 'Ada' })

    expect(Object.fromEntries(derived.map(field => [field.name, field.control.kind]))).toEqual({
      creditworthy: 'boolean',
      orderTotal: 'number',
      accessories: 'json',
      customer: 'text',
    })
  })

  it('spans a number slider up to twice the larger of its value and the literals it is compared with', () => {
    const orderTotal = fields.derive({ orderTotal: 1290 }).find(field => field.name === 'orderTotal')

    expect(orderTotal?.control).toEqual({ kind: 'number', min: 0, max: 10000, step: 100 })
  })

  it('prefills from the scenario after the output mappings ran on its task results', () => {
    const smallOrder = scenario('small-order', { orderTotal: 1290 }, { Task_CheckCredit: { score: 720 } })

    expect(fields.prefill(smallOrder, [smallOrder])).toEqual({ orderTotal: 1290, score: 720, creditworthy: true })
  })

  it('fills what the scenario leaves out from the other scenarios', () => {
    const withAccessories = scenario('with-accessories', { accessories: ['lock'] })
    const smallOrder = scenario('small-order', { orderTotal: 1290 })

    expect(fields.prefill(smallOrder, [withAccessories, smallOrder])).toEqual({ orderTotal: 1290, accessories: ['lock'] })
  })
})
