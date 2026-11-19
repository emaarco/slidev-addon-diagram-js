<template>
  <StaticDiagram
    :notation="notation"
    :filePath="props.dmnFilePath"
    :width="props.width"
    :height="props.height"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import '../../src/dmn/dmn.css'
import { DrdDiagramNotation } from '../../src/dmn/DrdDiagramNotation'
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import { DocumentTheme } from '../../src/shared/lib/DocumentTheme'
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
})

const theme = new DocumentTheme(() => props.theme).name
const notation = computed(() => new DrdDiagramNotation(props.fontSize, new DiagramTheme(theme.value)))
</script>
