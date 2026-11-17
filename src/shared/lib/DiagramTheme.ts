export type DiagramThemeName = 'light' | 'dark'

const LIGHT_ON_DARK = '#e6e6e6'

export class DiagramTheme {
  constructor(private readonly name: DiagramThemeName = 'light') {}

  // The default colours of the bpmn-js and dmn-js renderers; colours set on an element in the model still win.
  rendererColors(): Record<string, string> {
    if (this.name === 'light') return {}
    return { defaultFillColor: 'transparent', defaultStrokeColor: LIGHT_ON_DARK, defaultLabelColor: LIGHT_ON_DARK }
  }
}
