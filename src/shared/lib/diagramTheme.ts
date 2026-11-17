export type DiagramTheme = 'light' | 'dark'

const LIGHT_ON_DARK = '#e6e6e6'

// The default colours of the bpmn-js and dmn-js renderers; colours set on an element in the model still win.
export const rendererColors: Record<DiagramTheme, Record<string, string>> = {
  light: {},
  dark: { defaultFillColor: 'transparent', defaultStrokeColor: LIGHT_ON_DARK, defaultLabelColor: LIGHT_ON_DARK },
}
