import { describe, expect, it } from 'vitest'
import { numberLiterals } from '../../../../src/bpmn/utils/numberLiterals'

describe('numberLiterals', () => {
  it('reads the numbers an expression compares with', () => {
    expect(numberLiterals('=orderTotal > 5000 and score >= 600.5')).toEqual([5000, 600.5])
  })

  it('skips digits that are part of a name', () => {
    expect(numberLiterals('=step2 and item.3')).toEqual([])
  })
})
