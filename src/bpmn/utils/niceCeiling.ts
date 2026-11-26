const NICE_STEPS = [1, 2, 5, 10]

// The smallest 1, 2 or 5 times a power of ten that is at least `value`: 6800 → 10000, 120 → 200.
export function niceCeiling(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return NICE_STEPS.find(step => step * magnitude >= value)! * magnitude
}
