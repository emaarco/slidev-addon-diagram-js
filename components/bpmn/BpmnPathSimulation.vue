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
      <label v-if="scenarios.length > 1" class="bpmn-path-field">
        <span class="bpmn-path-name">Scenario</span>
        <select v-model="selectedScenarioId" @change="resetValues">
          <option v-for="scenario in scenarios" :key="scenario.id" :value="scenario.id">{{ scenario.name }}</option>
        </select>
      </label>

      <label v-for="field in fields" :key="field.name" class="bpmn-path-field" :class="`bpmn-path-field--${field.control.kind}`">
        <span class="bpmn-path-name">{{ field.name }}</span>
        <input
          v-if="field.control.kind === 'boolean'"
          type="checkbox"
          role="switch"
          :name="field.name"
          :checked="values[field.name] === true"
          @change="updateFromCheckbox(field.name, $event)"
        />
        <template v-else-if="field.control.kind === 'number'">
          <input
            type="range"
            :name="`${field.name}-slider`"
            :min="field.control.min"
            :max="field.control.max"
            :step="field.control.step"
            :value="values[field.name]"
            @input="updateFromNumber(field.name, $event)"
          />
          <input type="number" step="any" :name="field.name" :value="values[field.name]" @input="updateFromNumber(field.name, $event)" />
        </template>
        <input v-else type="text" :name="field.name" :value="formatText(field)" @input="updateFromText(field, $event)" />
      </label>

      <dl v-if="measureRows.length" class="bpmn-path-measures">
        <div v-for="row in measureRows" :key="row.label">
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
        </div>
      </dl>

      <!-- Divs with list roles: deck themes style every ul/li in a slide as bullets. -->
      <div v-if="decisionRows.length" class="bpmn-path-decisions" role="list">
        <div v-for="row in decisionRows" :key="row.gatewayId" class="bpmn-path-decision" :class="{ 'is-stuck': row.stuck }" role="listitem">
          <span class="bpmn-path-gateway">{{ row.gateway }}</span>
          <span class="bpmn-path-outcome">{{ row.outcome }}</span>
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
/* Colours come from --bpmn-path-* custom properties, so a theme can restyle the panel from any ancestor. */
.bpmn-path-simulation {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: var(--bpmn-path-text, #1d1d1d);
}

.bpmn-path-simulation.diagram-theme-dark {
  --bpmn-path-text: #e6e6e6;
  --bpmn-path-muted: #b3b3b3;
  --bpmn-path-border: #4d4d4d;
  --bpmn-path-surface: #262626;
  --bpmn-path-accent: #6b8aff;
  --bpmn-path-danger: #ff8787;
}

.bpmn-path-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 16px;
  padding: 0 5px;
  font-size: 12px;
}

.bpmn-path-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.bpmn-path-field--boolean {
  align-items: flex-start;
}

.bpmn-path-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--bpmn-path-muted, #5b5b5b);
}

.bpmn-path-field input[type='number'],
.bpmn-path-field input[type='text'],
.bpmn-path-field select {
  font: inherit;
  width: 110px;
  padding: 3px 6px;
  border: 1px solid var(--bpmn-path-border, #d4d4d4);
  border-radius: 4px;
  background: var(--bpmn-path-surface, #ffffff);
  color: inherit;
}

.bpmn-path-field select {
  width: auto;
}

.bpmn-path-field input[type='range'],
.bpmn-path-field input[type='checkbox'] {
  accent-color: var(--bpmn-path-accent, #335de5);
}

.bpmn-path-field input.is-invalid {
  border-color: var(--bpmn-path-danger, #c92a2a);
}

.bpmn-path-measures {
  display: flex;
  gap: 16px;
  margin: 0;
}

.bpmn-path-measures dt {
  font-size: 11px;
  font-weight: 600;
  color: var(--bpmn-path-muted, #5b5b5b);
}

.bpmn-path-measures dd {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--bpmn-path-accent, #335de5);
}

.bpmn-path-decisions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}

.bpmn-path-gateway {
  font-weight: 600;
}

.bpmn-path-gateway::after {
  content: ' → ';
  color: var(--bpmn-path-muted, #5b5b5b);
}

.bpmn-path-decisions .is-stuck .bpmn-path-outcome {
  color: var(--bpmn-path-danger, #c92a2a);
}
</style>
