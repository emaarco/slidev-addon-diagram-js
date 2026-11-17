<template>
  <StaticDiagram
    :notation="notation"
    :filePath="props.dmnFilePath"
    :width="props.width"
    :height="props.height"
  />
</template>

<script setup lang="ts">
import '../../src/dmn/dmn.css'
import { DrdDiagramNotation } from '../../src/dmn/DrdDiagramNotation'
import type { DiagramTheme } from '../../src/shared/lib/diagramTheme'
import StaticDiagram from '../../src/shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  dmnFilePath: string
  width?: string
  height?: string
  fontSize?: string
  theme?: DiagramTheme
}>(), {
  width: '100%',
  height: 'auto',
  fontSize: '12px',
  theme: 'light',
})

const notation = new DrdDiagramNotation(props.fontSize, props.theme)
</script>
