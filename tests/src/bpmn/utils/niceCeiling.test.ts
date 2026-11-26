import { describe, expect, it } from 'vitest'
import { niceCeiling } from '../../../../src/bpmn/utils/niceCeiling'

describe('niceCeiling', () => {
  it.each([
    [6800, 10000],
    [10000, 10000],
    [120, 200],
    [3, 5],
    [0.4, 0.5],
  ])('rounds %j up to %j', (value, expected) => {
    expect(niceCeiling(value)).toBe(expected)
  })

  it.each([0, -5])('falls back to 1 for %j', (value) => {
    expect(niceCeiling(value)).toBe(1)
  })
})
