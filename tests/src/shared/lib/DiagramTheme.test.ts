import { describe, expect, it } from 'vitest'
import { DiagramTheme } from '../../../../src/shared/lib/DiagramTheme'

describe('DiagramTheme', () => {
  it('keeps the renderer defaults in the light theme', () => {
    expect(new DiagramTheme().rendererColors()).toEqual({})
    expect(new DiagramTheme('light').rendererColors()).toEqual({})
  })

  it('draws light strokes and labels on transparent fills in the dark theme', () => {
    expect(new DiagramTheme('dark').rendererColors()).toEqual({
      defaultFillColor: 'transparent',
      defaultStrokeColor: '#e6e6e6',
      defaultLabelColor: '#e6e6e6',
    })
  })
})
