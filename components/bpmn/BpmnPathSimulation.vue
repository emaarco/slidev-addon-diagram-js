<template>
  <div class="bpmn-path-simulation" :class="{ 'diagram-theme-dark': theme === 'dark' }" :style="{ width: props.width }">
    <LiveDiagram
      :notation="notation"
      :filePath="props.bpmnFilePath"
      width="100%"
      :height="props.height"
      @rendered="activateShownViewer"
    />

    <p v-if="scenarioError" class="text-red-500">{{ scenarioError }}</p>

    <div v-if="hasPanel" class="bpmn-path-panel">
      <div v-if="scenarios.length > 1 || fields.length" class="bpmn-path-inputs">
        <label v-if="scenarios.length > 1" class="bpmn-path-field">
          <span class="bpmn-path-label">Scenario</span>
          <select v-model="selectedScenarioId" class="bpmn-path-input" @change="resetValues">
            <option v-for="scenario in scenarios" :key="scenario.id" :value="scenario.id">{{ scenario.name }}</option>
          </select>
        </label>

        <template v-for="field in fields" :key="field.name">
          <label v-if="field.control.kind === 'boolean'" class="bpmn-path-field bpmn-path-field--boolean">
            <span class="bpmn-path-label">{{ field.name }}</span>
            <span class="bpmn-path-check">
              <input type="checkbox" :name="field.name" :checked="values[field.name] === true" @change="updateFromCheckbox(field.name, $event)" />
              <span class="bpmn-path-check-value">{{ values[field.name] === true }}</span>
            </span>
          </label>

          <div v-else-if="field.control.kind === 'number'" class="bpmn-path-field bpmn-path-field--number">
            <span class="bpmn-path-label-row">
              <span class="bpmn-path-label">{{ field.name }}</span>
              <input
                type="number"
                step="any"
                class="bpmn-path-value"
                :name="field.name"
                :aria-label="field.name"
                :value="values[field.name]"
                @input="updateFromNumber(field.name, $event)"
              />
            </span>
            <input
              type="range"
              class="bpmn-path-slider"
              :name="`${field.name}-slider`"
              :aria-label="field.name"
              :min="field.control.min"
              :max="field.control.max"
              :step="field.control.step"
              :value="values[field.name]"
              :style="{ '--bpmn-path-fill': `${sliderFill(field)}%` }"
              @input="updateFromNumber(field.name, $event)"
            />
          </div>

          <label v-else class="bpmn-path-field">
            <span class="bpmn-path-label">{{ field.name }}</span>
            <input type="text" class="bpmn-path-input" :name="field.name" :value="formatText(field)" @input="updateFromText(field, $event)" />
          </label>
        </template>
      </div>

      <div v-if="measureRows.length || decisionRows.length" class="bpmn-path-results">
        <div v-if="measureRows.length" class="bpmn-path-measures">
          <div v-for="row in measureRows" :key="row.label" class="bpmn-path-stat">
            <span class="bpmn-path-label">{{ row.label }}</span>
            <span class="bpmn-path-stat-value">{{ row.value }}</span>
          </div>
        </div>

        <!-- Divs with list roles: deck themes style every ul/li in a slide as bullets. -->
        <div v-if="decisionRows.length" class="bpmn-path-decisions" role="list" aria-label="Gateway decisions">
          <div v-for="row in decisionRows" :key="row.gatewayId" class="bpmn-path-decision" :class="{ 'is-stuck': row.stuck }" role="listitem">
            <span class="bpmn-path-gateway">{{ row.gateway }}</span>
            <span class="bpmn-path-outcome">{{ row.outcome }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef, useId, watch } from 'vue'
import { useSlideContext } from '@slidev/client'
import {
  type Scenario,
  ScenarioParser,
  type SimulatedPath,
  type StartField,
  StartFieldCodec,
  type Variables,
} from '@emaarco/bpmn-js-data-simulation'
import '../../src/bpmn/bpmn.css'
import { BpmnPathSimulationNotation } from '../../src/bpmn/BpmnPathSimulationNotation'
import type { BpmnPathSimulationViewer } from '../../src/bpmn/BpmnPathSimulationViewer'
import type { Engine } from '../../src/bpmn/engines/bpmnEngines'
import type { PathVariableField } from '../../src/bpmn/PathVariableFields'
import { parseMaxScale } from '../../src/bpmn/utils/parseMaxScale'
import { DiagramFileLoader } from '../../src/shared/lib/DiagramFileLoader'
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import { DocumentTheme } from '../../src/shared/lib/DocumentTheme'
import LiveDiagram from '../../src/shared/ui/LiveDiagram.vue'

const props = withDefaults(defineProps<{
  bpmnFilePath: string
  engine?: Engine
  variables?: Variables
  scenariosFilePath?: string
  controls?: 'auto' | 'none' | string[]
  steps?: Variables[]
  measures?: Record<string, string>
  showDecisions?: boolean
  width?: string
  height?: string
  maxScale?: number
  theme?: DiagramThemeName
}>(), {
  engine: 'zeebe',
  controls: 'auto',
  showDecisions: false,
  width: '100%',
  height: '400px',
})

const codec = new StartFieldCodec()
const scenariosLoader = new DiagramFileLoader('BPMN')
const theme = new DocumentTheme(() => props.theme).name

// The viewer that imported last; it becomes the active one once LiveDiagram reports it rendered.
let shownViewer: BpmnPathSimulationViewer | null = null
const notation = computed(() => new BpmnPathSimulationNotation({
  engine: props.engine,
  maxScale: parseMaxScale(props.maxScale),
  theme: new DiagramTheme(theme.value),
  onShown: (viewer) => { shownViewer = viewer },
}))

const viewer = shallowRef<BpmnPathSimulationViewer | null>(null)
const scenarios = shallowRef<Scenario[]>([])
const selectedScenarioId = ref('')
const scenarioError = ref<string | null>(null)
const values = shallowRef<Variables>({})
const path = shallowRef<SimulatedPath | null>(null)

let currentClick = () => 0
if (props.steps?.length) {
  const { $clicks, $clicksContext } = useSlideContext()
  const clickKey = `bpmn-path-steps-${useId()}`
  $clicksContext.register(clickKey, { delta: 0, max: props.steps.length })
  onUnmounted(() => $clicksContext.unregister(clickKey))
  currentClick = () => $clicks.value
  watch($clicks, () => {
    if (viewer.value) resetValues()
  })
}

const fields = computed<PathVariableField[]>(() => {
  if (!viewer.value || props.controls === 'none') return []
  const derived = viewer.value.variableFields().derive(values.value)
  const controls = props.controls
  return controls === 'auto' ? derived : derived.filter(field => controls.includes(field.name))
})

const measureRows = computed(() => Object.entries(props.measures ?? {}).map(([label, attribute]) => ({
  label,
  value: path.value?.measures[attribute] ?? 0,
})))

const decisionRows = computed(() => {
  const activeViewer = viewer.value
  if (!props.showDecisions || !activeViewer || !path.value) return []
  return Object.entries(path.value.decisions).map(([gatewayId, decision]) => ({
    gatewayId,
    gateway: activeViewer.elementName(gatewayId),
    outcome: decision.stuckReason ?? decision.takenFlowIds.map(id => activeViewer.elementName(id)).join(', '),
    stuck: Boolean(decision.stuckReason),
  }))
})

const hasPanel = computed(() =>
  scenarios.value.length > 1 || fields.value.length > 0 || measureRows.value.length > 0 || decisionRows.value.length > 0)

watch(values, simulate)

async function activateShownViewer(): Promise<void> {
  const isFirstRender = viewer.value === null
  viewer.value = shownViewer
  if (!isFirstRender) return simulate()
  await loadScenarios()
  resetValues()
}

async function loadScenarios(): Promise<void> {
  if (!props.scenariosFilePath) return
  try {
    scenarios.value = new ScenarioParser().parse(JSON.parse(await scenariosLoader.fetchFile(props.scenariosFilePath)))
    selectedScenarioId.value = scenarios.value[0]?.id ?? ''
  } catch (error) {
    scenarioError.value = `Failed to load the scenarios: ${error instanceof Error ? error.message : String(error)}`
  }
}

// The scenario's variables over the `variables` prop, then every step up to the current click.
function resetValues(): void {
  const scenario = scenarios.value.find(candidate => candidate.id === selectedScenarioId.value)
  const prefilled = viewer.value && scenarios.value.length ? viewer.value.variableFields().prefill(scenario, scenarios.value) : {}
  const reachedSteps = (props.steps ?? []).slice(0, currentClick())
  values.value = Object.assign({ ...props.variables, ...prefilled }, ...reachedSteps)
}

function simulate(): void {
  if (!viewer.value) return
  path.value = viewer.value.simulate(values.value, Object.values(props.measures ?? {}))
}

function update(name: string, value: unknown): void {
  values.value = { ...values.value, [name]: value }
}

function updateFromCheckbox(name: string, event: Event): void {
  update(name, (event.target as HTMLInputElement).checked)
}

function updateFromNumber(name: string, event: Event): void {
  const number = (event.target as HTMLInputElement).valueAsNumber
  if (!Number.isNaN(number)) update(name, number)
}

// How far the slider is filled, in percent of its range.
function sliderFill(field: PathVariableField): number {
  if (field.control.kind !== 'number') return 0
  const { min, max } = field.control
  const value = Number(values.value[field.name])
  return Number.isFinite(value) ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0
}

function startField(field: PathVariableField): StartField {
  return { name: field.name, type: field.control.kind === 'json' ? 'json' : 'auto', usedBy: [] }
}

function formatText(field: PathVariableField): string {
  return String(codec.format(startField(field), values.value[field.name]))
}

function updateFromText(field: PathVariableField, event: Event): void {
  const input = event.target as HTMLInputElement
  const parsed = codec.parse(startField(field), input.value)
  input.classList.toggle('is-invalid', !parsed.ok)
  if (parsed.ok) update(field.name, parsed.value)
}
</script>

<style scoped>
/* Colours follow the roles of the Miragon design system (--cd-ui-*). A deck theme restyles the panel
   by setting the --bpmn-path-* custom properties on any ancestor; the dark theme sets them here. */
.bpmn-path-simulation {
  display: flex;
  flex-direction: column;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.4;
  color: var(--bpmn-path-text, #1d1d1d);
}

.bpmn-path-simulation.diagram-theme-dark {
  --bpmn-path-text: #ffffff;
  --bpmn-path-muted: #bbbbbb;
  --bpmn-path-line: #464646;
  --bpmn-path-outline: #8f8a8a;
  --bpmn-path-field: #1d1d1d;
  --bpmn-path-chip: #383838;
  --bpmn-path-accent: #6b8aff;
  --bpmn-path-focus: #6b8aff;
  --bpmn-path-danger: #fb6d73;
  --bpmn-path-danger-surface: #282828;
}

/* bpmn.io watermark; shrink so it stays subordinate, as in the modeler preview. */
.bpmn-path-simulation :deep(.bjs-powered-by) {
  transform: scale(0.6);
  transform-origin: bottom right;
}

.bpmn-path-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px 24px;
  margin: 2px 5px 0;
  padding-top: 10px;
  border-top: 1px solid var(--bpmn-path-line, #e6e2e2);
}

.bpmn-path-inputs,
.bpmn-path-results,
.bpmn-path-measures {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px 20px;
}

.bpmn-path-results {
  margin-left: auto;
}

/* Without controls the results span the panel: measures left, decisions right. */
.bpmn-path-results:only-child {
  flex: 1;
  margin-left: 0;
  justify-content: space-between;
}

.bpmn-path-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bpmn-path-label {
  font-weight: 600;
  white-space: nowrap;
}

.bpmn-path-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bpmn-path-input,
.bpmn-path-value {
  box-sizing: border-box;
  height: 28px;
  padding: 0 8px;
  font: inherit;
  color: inherit;
  background: var(--bpmn-path-field, #f9f7f7);
  border: 1px solid var(--bpmn-path-outline, #8f8a8a);
  border-radius: 6px;
}

.bpmn-path-input {
  min-width: 120px;
}

.bpmn-path-value {
  width: 72px;
  height: 22px;
  padding: 0 6px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  -moz-appearance: textfield;
}

.bpmn-path-value::-webkit-inner-spin-button,
.bpmn-path-value::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.bpmn-path-input:focus,
.bpmn-path-value:focus {
  border-color: var(--bpmn-path-accent, #335de5);
}

.bpmn-path-input:focus-visible,
.bpmn-path-value:focus-visible,
.bpmn-path-slider:focus-visible,
.bpmn-path-check input:focus-visible {
  outline: 2px solid var(--bpmn-path-focus, #2b50d4);
  outline-offset: 2px;
}

.bpmn-path-input.is-invalid {
  border-color: var(--bpmn-path-danger, #cd1839);
}

/* Slider: a thin track filled in the accent up to the value, a round thumb. */
.bpmn-path-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 180px;
  height: 28px;
  margin: 0;
  background: transparent;
  cursor: pointer;
}

.bpmn-path-slider::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(to right, var(--bpmn-path-accent, #335de5) var(--bpmn-path-fill), var(--bpmn-path-line, #e6e2e2) var(--bpmn-path-fill));
}

.bpmn-path-slider::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(to right, var(--bpmn-path-accent, #335de5) var(--bpmn-path-fill), var(--bpmn-path-line, #e6e2e2) var(--bpmn-path-fill));
}

.bpmn-path-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -5px;
  border-radius: 50%;
  background: var(--bpmn-path-accent, #335de5);
  border: 2px solid var(--bpmn-path-field, #f9f7f7);
  box-shadow: 0 0 0 1px var(--bpmn-path-accent, #335de5);
}

.bpmn-path-slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--bpmn-path-accent, #335de5);
  border: 2px solid var(--bpmn-path-field, #f9f7f7);
  box-shadow: 0 0 0 1px var(--bpmn-path-accent, #335de5);
}

/* Checkbox: inset like a field, checked shows the tick and border in the accent, no blue fill. */
.bpmn-path-check {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  cursor: pointer;
}

.bpmn-path-check input {
  -webkit-appearance: none;
  appearance: none;
  position: relative;
  width: 16px;
  height: 16px;
  margin: 0;
  background: var(--bpmn-path-field, #f9f7f7);
  border: 1.5px solid var(--bpmn-path-outline, #8f8a8a);
  border-radius: 4px;
  cursor: pointer;
}

.bpmn-path-check input:checked {
  border-color: var(--bpmn-path-accent, #335de5);
}

.bpmn-path-check input:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid var(--bpmn-path-accent, #335de5);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.bpmn-path-check-value {
  color: var(--bpmn-path-muted, #6b6666);
  font-variant-numeric: tabular-nums;
}

.bpmn-path-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bpmn-path-stat .bpmn-path-label {
  color: var(--bpmn-path-muted, #6b6666);
}

.bpmn-path-stat-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 26px;
  font-variant-numeric: tabular-nums;
}

.bpmn-path-decisions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bpmn-path-decision {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  background: var(--bpmn-path-chip, #eef1fd);
  white-space: nowrap;
}

.bpmn-path-gateway {
  font-weight: 600;
}

.bpmn-path-gateway::after {
  content: ' →';
  font-weight: 400;
  color: var(--bpmn-path-muted, #6b6666);
}

.bpmn-path-decision.is-stuck {
  background: var(--bpmn-path-danger-surface, #fbeef0);
  box-shadow: inset 3px 0 0 var(--bpmn-path-danger, #cd1839);
}

.bpmn-path-decision.is-stuck .bpmn-path-outcome {
  color: var(--bpmn-path-danger, #cd1839);
}
</style>
