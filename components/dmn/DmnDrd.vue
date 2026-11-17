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
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import StaticDiagram from '../../src/shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  dmnFilePath: string
  width?: string
  height?: string
  fontSize?: string
  theme?: DiagramThemeName
}>(), {
  width: '100%',
  height: 'auto',
  fontSize: '12px',
  theme: 'light',
})

const notation = new DrdDiagramNotation(props.fontSize, new DiagramTheme(props.theme))
</script>
