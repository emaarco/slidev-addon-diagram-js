<template>
  <DiagramModeler
    :notation="notation"
    :filePath="props.bpmnFilePath"
    :width="props.width"
    :height="props.height"
    :propertiesPanelOpen="props.propertiesPanelOpen"
  />
</template>

<script setup lang="ts">
import '../../src/bpmn/bpmn.css'
import { BpmnModelerNotation } from '../../src/bpmn/BpmnModelerNotation'
import type { Engine } from '../../src/bpmn/engines/bpmnEngines'
import { parseMaxScale } from '../../src/bpmn/utils/parseMaxScale'
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
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
  theme?: DiagramThemeName
}>(), {
  width: '100%',
  height: '500px',
  propertiesPanelOpen: false,
  tokenSimulation: false,
  transactionBoundaries: false,
  theme: 'light',
})

const notation = new BpmnModelerNotation({
  engine: props.engine,
  tokenSimulation: props.tokenSimulation,
  transactionBoundaries: props.transactionBoundaries,
  maxScale: parseMaxScale(props.maxScale),
}, new DiagramTheme(props.theme))
</script>

