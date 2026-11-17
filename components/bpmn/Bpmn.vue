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
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import StaticDiagram from '../../src/shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  bpmnFilePath: string
  width?: string
  height?: string
  theme?: DiagramThemeName
}>(), {
  width: '100%',
  height: 'auto',
  theme: 'light',
})

const notation = new BpmnDiagramNotation(new DiagramTheme(props.theme))
</script>
