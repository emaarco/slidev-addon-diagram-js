<template>
  <div class="bpmn-path-simulation" :class="{ 'diagram-theme-dark': theme === 'dark' }" :style="{ width: props.width }">
    <LiveDiagram
      :notation="notation"
      :filePath="props.bpmnFilePath"
      width="100%"
      :height="props.height"
      @rendered="activateShownViewer"
    />
    <PathSimulationPanel
      :target="target"
      :variables="props.variables"
      :scenariosFilePath="props.scenariosFilePath"
      :controls="props.controls"
      :ranges="props.ranges"
      :scenario="props.scenario"
      :steps="props.steps"
      :theme="theme"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { NumberRange, Variables } from '@emaarco/bpmn-js-data-simulation'
import '../../src/bpmn/bpmn.css'
import { BpmnPathSimulationNotation } from '../../src/bpmn/BpmnPathSimulationNotation'
import type { BpmnPathSimulationViewer } from '../../src/bpmn/BpmnPathSimulationViewer'
import type { Engine } from '../../src/bpmn/engines/bpmnEngines'
import type { PathSimulationTarget } from '../../src/bpmn/PathSimulationTarget'
import PathSimulationPanel from '../../src/bpmn/ui/PathSimulationPanel.vue'
import { parseMaxScale } from '../../src/bpmn/utils/parseMaxScale'
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import { DocumentTheme } from '../../src/shared/lib/DocumentTheme'
import LiveDiagram from '../../src/shared/ui/LiveDiagram.vue'

const props = withDefaults(defineProps<{
  bpmnFilePath: string
  engine?: Engine
  variables?: Variables
  scenariosFilePath?: string
  controls?: 'auto' | 'none' | string[]
  ranges?: Record<string, Partial<NumberRange>>
  scenario?: string
  steps?: Variables[]
  width?: string
  height?: string
  maxScale?: number
  theme?: DiagramThemeName
}>(), {
  engine: 'zeebe',
  controls: 'auto',
  width: '100%',
  height: '400px',
})

const theme = new DocumentTheme(() => props.theme).name

// The viewer that imported last; it becomes the target once LiveDiagram reports it rendered.
let shownViewer: BpmnPathSimulationViewer | null = null
const notation = computed(() => new BpmnPathSimulationNotation({
  engine: props.engine,
  maxScale: parseMaxScale(props.maxScale),
  theme: new DiagramTheme(theme.value),
  onShown: (viewer) => { shownViewer = viewer },
}))

const target = shallowRef<PathSimulationTarget | null>(null)

function activateShownViewer(): void {
  target.value = shownViewer?.pathSimulation ?? null
}
</script>

<style scoped>
.bpmn-path-simulation {
  display: flex;
  flex-direction: column;
}

/* bpmn.io watermark; shrink so it stays subordinate, as in the modeler preview. */
.bpmn-path-simulation :deep(.bjs-powered-by) {
  transform: scale(0.6);
  transform-origin: bottom right;
}
</style>
