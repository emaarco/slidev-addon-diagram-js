import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

const bpmnCss = readFileSync(join(__dirname, '../../../src/bpmn/bpmn.css'), 'utf8')

describe('bpmn.css', () => {
  it('imports the transaction boundaries stylesheet, which colours the markers since camunda-transaction-boundaries 2.0', () => {
    expect(bpmnCss).toContain("@import 'camunda-transaction-boundaries/assets/transaction-boundaries.css';")
  })

  it('paints transaction boundaries in Miragon blue, lighter on the dark theme', () => {
    expect(bpmnCss).toMatch(/\.transaction-boundary\.transaction-boundary \{\s*--transaction-boundary-background-color: #335DE5;/)
    expect(bpmnCss).toMatch(
      /\.diagram-theme-dark \.transaction-boundary\.transaction-boundary \{\s*--transaction-boundary-background-color: #6B8AFF;/,
    )
  })

  it('draws the simulated path in the lighter Miragon blue on the dark theme', () => {
    expect(bpmnCss).toMatch(/\.diagram-theme-dark \{\s*--bds-path-taken: #6b8aff;/)
  })
})
