<template>
  <div class="bpmn-path-controls" :class="{ 'diagram-theme-dark': props.theme === 'dark' }">
    <p v-if="scenarioError" class="text-red-500">{{ scenarioError }}</p>

    <!-- Only the one thing the marked path cannot say: why a gateway did not decide. -->
    <p v-for="gateway in stuckGateways" :key="gateway.id" class="bpmn-path-stuck" role="status">
      <span class="bpmn-path-stuck-gateway">{{ gateway.name }}</span> {{ gateway.reason }}
    </p>

    <div v-if="hasPanel" class="bpmn-path-panel" :class="{ 'bpmn-path-panel--divided': props.divider }">
      <div v-if="hasScenarioChoice || fields.length" class="bpmn-path-inputs">
        <label v-if="hasScenarioChoice" class="bpmn-path-field">
          <span class="bpmn-path-label">Scenario</span>
          <select v-model="selectedScenarioId" class="bpmn-path-input" @change="resetValues">
            <option :value="NO_DATA">No data</option>
            <option v-for="scenario in scenarios" :key="scenario.id" :value="scenario.id">{{ scenario.name }}</option>
          </select>
        </label>

        <template v-for="field in fields" :key="field.name">
          <label v-if="field.type === 'boolean'" class="bpmn-path-field bpmn-path-field--boolean">
            <span class="bpmn-path-label">{{ field.name }}</span>
            <span class="bpmn-path-check">
              <input
                type="checkbox"
                :name="field.name"
                :checked="values[field.name] === true"
                :indeterminate="values[field.name] === undefined"
                @change="updateFromCheckbox(field.name, $event)"
              />
              <span class="bpmn-path-check-value">{{ values[field.name] === undefined ? UNSET : values[field.name] === true }}</span>
            </span>
          </label>

          <div v-else-if="field.type === 'number'" class="bpmn-path-field bpmn-path-field--number">
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
              :class="{ 'is-unset': values[field.name] === undefined }"
              :name="`${field.name}-slider`"
              :aria-label="field.name"
              :min="field.range.min"
              :max="field.range.max"
              :step="field.range.step"
              :value="values[field.name] ?? field.range.min"
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

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef, useId, watch } from 'vue'
import { useSlideContext } from '@slidev/client'
import {
  type NumberRange,
  type PathVariable,
  type Scenario,
  ScenarioParser,
  type SimulatedPath,
  type StartField,
  StartFieldCodec,
  type Variables,
} from '@emaarco/bpmn-js-data-simulation'
import { DiagramFileLoader } from '../../shared/lib/DiagramFileLoader'
import type { DiagramThemeName } from '../../shared/lib/DiagramTheme'
import type { PathSimulationTarget } from '../PathSimulationTarget'

const props = withDefaults(defineProps<{
  // The diagram the path is marked on; null until it has rendered. A new target keeps the values.
  target: PathSimulationTarget | null
  // Changes whenever the target's model is edited, so the controls and the path follow the edit.
  revision?: number
  variables?: Variables
  scenariosFilePath?: string
  controls?: 'auto' | 'none' | string[]
  ranges?: Record<string, Partial<NumberRange>>
  scenario?: string
  steps?: Variables[]
  theme?: DiagramThemeName
  // A line above the controls, separating them from the diagram they sit below.
  divider?: boolean
}>(), {
  revision: 0,
  divider: true,
  controls: 'auto',
})

// The dropdown value for no data (`scenario="none"`): every control unset, the diagram unmarked until one is set. The
// variables without a control keep their value, so a fixed minimum still applies.
const NO_DATA = ''
const UNSET = '–'
const codec = new StartFieldCodec()
const scenariosLoader = new DiagramFileLoader('BPMN')

const scenarios = shallowRef<Scenario[]>([])
const selectedScenarioId = ref('')
const scenarioError = ref<string | null>(null)
const values = shallowRef<Variables>({})
const path = shallowRef<SimulatedPath | null>(null)
const showsNoData = computed(() => scenarios.value.length > 0 && selectedScenarioId.value === NO_DATA)
// Whether a control was set since the values were last reset; "No data" stays unmarked until then.
const touched = ref(false)

let currentClick = () => 0
if (props.steps?.length) {
  const { $clicks, $clicksContext } = useSlideContext()
  const clickKey = `bpmn-path-steps-${useId()}`
  $clicksContext.register(clickKey, { delta: 0, max: props.steps.length })
  onUnmounted(() => $clicksContext.unregister(clickKey))
  currentClick = () => $clicks.value
  watch($clicks, () => {
    if (props.target) resetValues()
  })
}

const fields = computed<PathVariable[]>(() => {
  void props.revision
  return props.target ? withControl(props.target.variablesReadByConditions(values.value, props.ranges)) : []
})

function withControl(variables: PathVariable[]): PathVariable[] {
  const controls = props.controls
  if (controls === 'none') return []
  return controls === 'auto' ? variables : variables.filter(variable => controls.includes(variable.name))
}

// Gateways on the path that could not decide, with the reason the path simulation gives. A gateway that only waits for
// variables to be set is no error: the path ends there until they are.
const stuckGateways = computed(() => {
  const activeTarget = props.target
  if (!activeTarget || !path.value) return []
  return Object.entries(path.value.decisions)
    .filter(([, decision]) => decision.stuckReason && !decision.missingVariables)
    .map(([id, decision]) => ({ id, name: activeTarget.elementName(id), reason: decision.stuckReason! }))
})

// One scenario alone needs no dropdown, unless the slide starts without data and has to reach it.
const hasScenarioChoice = computed(() => scenarios.value.length > 1 || (scenarios.value.length > 0 && props.scenario === 'none'))
const hasPanel = computed(() => hasScenarioChoice.value || fields.value.length > 0)

watch(values, simulate)
watch(() => props.revision, simulate)

let hasStarted = false
watch(() => props.target, async (target) => {
  if (!target) return
  if (hasStarted) return simulate()
  hasStarted = true
  await loadScenarios()
  resetValues()
}, { immediate: true })

async function loadScenarios(): Promise<void> {
  if (!props.scenariosFilePath) return
  try {
    scenarios.value = new ScenarioParser().parse(JSON.parse(await scenariosLoader.fetchFile(props.scenariosFilePath)))
    selectedScenarioId.value = initialScenarioId()
  } catch (error) {
    scenarioError.value = `Failed to load the scenarios: ${error instanceof Error ? error.message : String(error)}`
  }
}

function initialScenarioId(): string {
  if (props.scenario === 'none') return NO_DATA
  const firstId = scenarios.value[0]?.id ?? NO_DATA
  if (props.scenario === undefined) return firstId
  if (scenarios.value.some(candidate => candidate.id === props.scenario)) return props.scenario
  scenarioError.value = `Unknown scenario "${props.scenario}", starting from "${firstId}"`
  return firstId
}

// The scenario's variables over the `variables` prop, then every step up to the current click.
function resetValues(): void {
  touched.value = false
  if (showsNoData.value) {
    values.value = withoutControls({ ...props.target?.variablesOf(undefined, scenarios.value), ...props.variables })
    return
  }
  const scenario = scenarios.value.find(candidate => candidate.id === selectedScenarioId.value)
  const prefilled = props.target && scenarios.value.length ? props.target.variablesOf(scenario, scenarios.value) : {}
  const reachedSteps = (props.steps ?? []).slice(0, currentClick())
  values.value = Object.assign({ ...props.variables, ...prefilled }, ...reachedSteps)
}

function withoutControls(variables: Variables): Variables {
  const controlled = new Set(withControl(props.target?.variablesReadByConditions({}) ?? []).map(variable => variable.name))
  return Object.fromEntries(Object.entries(variables).filter(([name]) => !controlled.has(name)))
}

function simulate(): void {
  const target = props.target
  if (!target) return
  if (Object.keys(values.value).length === 0 || (showsNoData.value && !touched.value)) {
    target.clear()
    path.value = null
    return
  }
  path.value = target.simulate(values.value)
}

function update(name: string, value: unknown): void {
  touched.value = true
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
function sliderFill(field: PathVariable): number {
  if (field.type !== 'number') return 0
  const { min, max } = field.range
  const value = Number(values.value[field.name])
  return Number.isFinite(value) ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0
}

function startField(field: PathVariable): StartField {
  return { name: field.name, type: field.type === 'json' ? 'json' : 'auto', usedBy: [] }
}

function formatText(field: PathVariable): string {
  return String(codec.format(startField(field), values.value[field.name]))
}

function updateFromText(field: PathVariable, event: Event): void {
  const input = event.target as HTMLInputElement
  const parsed = codec.parse(startField(field), input.value)
  input.classList.toggle('is-invalid', !parsed.ok)
  if (parsed.ok) update(field.name, parsed.value)
}
</script>

<style scoped>
/* Colours follow the roles of the Miragon design system (--cd-ui-*). A deck theme restyles the panel
   by setting the --bpmn-path-* custom properties on any ancestor; the dark theme sets them here. */
.bpmn-path-controls {
  font-family: inherit;
  font-size: 12px;
  line-height: 1.4;
  color: var(--bpmn-path-text, #1d1d1d);
}

.bpmn-path-controls.diagram-theme-dark {
  --bpmn-path-text: #ffffff;
  --bpmn-path-muted: #bbbbbb;
  --bpmn-path-line: #464646;
  --bpmn-path-outline: #8f8a8a;
  --bpmn-path-field: #1d1d1d;
  --bpmn-path-accent: #6b8aff;
  --bpmn-path-focus: #6b8aff;
  --bpmn-path-danger: #fb6d73;
  --bpmn-path-danger-surface: #282828;
}

.bpmn-path-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px 24px;
}

.bpmn-path-panel--divided {
  margin: 2px 5px 0;
  padding-top: 10px;
  border-top: 1px solid var(--bpmn-path-line, #e6e2e2);
}

.bpmn-path-inputs {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px 20px;
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

/* Unset: a hollow thumb at the start until the slider is moved. */
.bpmn-path-slider.is-unset::-webkit-slider-thumb {
  background: var(--bpmn-path-field, #f9f7f7);
  box-shadow: 0 0 0 1px var(--bpmn-path-outline, #8f8a8a);
}

.bpmn-path-slider.is-unset::-moz-range-thumb {
  background: var(--bpmn-path-field, #f9f7f7);
  box-shadow: 0 0 0 1px var(--bpmn-path-outline, #8f8a8a);
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

/* Unset: an outlined checkbox with a dash. */
.bpmn-path-check input:indeterminate::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 6px;
  width: 7px;
  border-top: 2px solid var(--bpmn-path-muted, #6b6666);
}

/* As wide as "false", so toggling a switch never reflows the controls. */
.bpmn-path-check-value {
  min-width: 2.6em;
  color: var(--bpmn-path-muted, #6b6666);
  font-variant-numeric: tabular-nums;
}

.bpmn-path-stuck {
  margin: 6px 5px 0;
  padding: 6px 10px;
  border: 1px solid var(--bpmn-path-danger, #cd1839);
  border-left-width: 4px;
  border-radius: 6px;
  background: var(--bpmn-path-danger-surface, #fbeef0);
}

.bpmn-path-stuck-gateway {
  font-weight: 600;
}
</style>
