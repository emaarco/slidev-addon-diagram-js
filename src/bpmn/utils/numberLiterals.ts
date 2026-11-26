// The number literals of an expression, e.g. [5000] for `orderTotal > 5000`; digits inside names are skipped.
export function numberLiterals(expression: string): number[] {
  return (expression.match(/(?<![\w.])\d+(?:\.\d+)?/g) ?? []).map(Number)
}
