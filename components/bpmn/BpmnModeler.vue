<template>
  <DiagramModeler
    :notation="notation"
    :filePath="props.bpmnFilePath"
    :width="props.width"
    :height="props.height"
    :propertiesPanelOpen="props.propertiesPanelOpen"
    :theme="theme"
  >
    <template v-if="props.pathSimulation" #panel="{ inFullscreen }">
      <PathSimulationPanel
        :target="pathTarget"
        :revision="modelRevision"
        :variables="props.variables"
        :scenariosFilePath="props.scenariosFilePath"
        :controls="props.controls"
        :ranges="props.ranges"
        :scenario="props.scenario"
        :theme="theme"
        :divider="!inFullscreen"
      />
    </template>
  </DiagramModeler>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import type { NumberRange, Variables } from '@emaarco/bpmn-js-data-simulation'
import '../../src/bpmn/bpmn.css'
import { BpmnModelerNotation } from '../../src/bpmn/BpmnModelerNotation'
import type { Engine } from '../../src/bpmn/engines/bpmnEngines'
import type { PathSimulationTarget } from '../../src/bpmn/PathSimulationTarget'
import PathSimulationPanel from '../../src/bpmn/ui/PathSimulationPanel.vue'
import { parseMaxScale } from '../../src/bpmn/utils/parseMaxScale'
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import { DocumentTheme } from '../../src/shared/lib/DocumentTheme'
import DiagramModeler from '../../src/shared/ui/DiagramModeler.vue'

const props = withDefaults(defineProps<{
  bpmnFilePath?: string
  width?: string
  height?: string
  engine?: Engine
  propertiesPanelOpen?: boolean
  maxScale?: number
  tokenSimulation?: boolean
  transactionBoundaries?: boolean
  pathSimulation?: boolean
  variables?: Variables
  scenariosFilePath?: string
  controls?: 'auto' | 'none' | string[]
  ranges?: Record<string, Partial<NumberRange>>
  scenario?: string
  theme?: DiagramThemeName
}>(), {
  width: '100%',
  height: '500px',
  propertiesPanelOpen: false,
  tokenSimulation: false,
  transactionBoundaries: false,
  pathSimulation: false,
  controls: 'auto',
})

const theme = new DocumentTheme(() => props.theme).name

// The path is marked on the open modeler while there is one, else on the preview.
const previewTarget = shallowRef<PathSimulationTarget | null>(null)
const modelerTarget = shallowRef<PathSimulationTarget | null>(null)
const pathTarget = computed(() => modelerTarget.value ?? previewTarget.value)
const modelRevision = ref(0)

const notation = computed(() => new BpmnModelerNotation({
  engine: props.engine,
  tokenSimulation: props.tokenSimulation,
  transactionBoundaries: props.transactionBoundaries,
  pathSimulation: props.pathSimulation
    ? {
        engine: props.engine ?? 'zeebe',
        onTarget: (target, of) => { (of === 'modeler' ? modelerTarget : previewTarget).value = target },
        onModelChanged: () => { modelRevision.value++ },
      }
    : undefined,
  maxScale: parseMaxScale(props.maxScale),
}, new DiagramTheme(theme.value)))
</script>
