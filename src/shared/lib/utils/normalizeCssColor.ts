const HEX_COLOR = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/
const NAMED_COLORS: Record<string, string> = { white: 'rgb(255,255,255)', black: 'rgb(0,0,0)' }

export function normalizeCssColor(value: string): string {
  const compact = value.toLowerCase().replace(/\s+/g, '')
  const hex = HEX_COLOR.exec(compact)
  if (hex) return `rgb(${hex.slice(1).map(channel => parseInt(channel, 16)).join(',')})`
  return NAMED_COLORS[compact] ?? compact
}
