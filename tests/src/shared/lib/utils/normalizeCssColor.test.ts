import { describe, expect, it } from 'vitest'
import { normalizeCssColor } from '../../../../../src/shared/lib/utils/normalizeCssColor'

describe('normalizeCssColor', () => {
  it('writes hex colours as rgb', () => {
    expect(normalizeCssColor('#1D1D1D')).toBe('rgb(29,29,29)')
  })

  it('drops whitespace and case of rgb colours', () => {
    expect(normalizeCssColor('RGBA(29, 29, 29, 0.024)')).toBe('rgba(29,29,29,0.024)')
  })

  it('writes the named colours the renderers use as rgb', () => {
    expect(normalizeCssColor('white')).toBe('rgb(255,255,255)')
  })

  it('keeps other values as they are', () => {
    expect(normalizeCssColor('none')).toBe('none')
    expect(normalizeCssColor('')).toBe('')
  })
})
