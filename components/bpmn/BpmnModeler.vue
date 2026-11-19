<template>
  <DiagramModeler
    :notation="notation"
    :filePath="props.bpmnFilePath"
    :width="props.width"
    :height="props.height"
    :propertiesPanelOpen="props.propertiesPanelOpen"
    :theme="theme"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import '../../src/bpmn/bpmn.css'
import { BpmnModelerNotation } from '../../src/bpmn/BpmnModelerNotation'
import type { Engine } from '../../src/bpmn/engines/bpmnEngines'
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
  theme?: DiagramThemeName
}>(), {
  width: '100%',
  height: '500px',
  propertiesPanelOpen: false,
  tokenSimulation: false,
  transactionBoundaries: false,
})

const theme = new DocumentTheme(() => props.theme).name
const notation = computed(() => new BpmnModelerNotation({
  engine: props.engine,
  tokenSimulation: props.tokenSimulation,
  transactionBoundaries: props.transactionBoundaries,
  maxScale: parseMaxScale(props.maxScale),
}, new DiagramTheme(theme.value)))
</script>

