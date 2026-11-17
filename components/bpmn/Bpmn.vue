<template>
  <StaticDiagram
    :notation="notation"
    :filePath="props.bpmnFilePath"
    :width="props.width"
    :height="props.height"
  />
</template>

<script setup lang="ts">
import '../../src/bpmn/bpmn.css'
import { BpmnDiagramNotation } from '../../src/bpmn/BpmnDiagramNotation'
import type { DiagramTheme } from '../../src/shared/lib/diagramTheme'
import StaticDiagram from '../../src/shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  bpmnFilePath: string
  width?: string
  height?: string
  theme?: DiagramTheme
}>(), {
  width: '100%',
  height: 'auto',
  theme: 'light',
})

const notation = new BpmnDiagramNotation(props.theme)
</script>
