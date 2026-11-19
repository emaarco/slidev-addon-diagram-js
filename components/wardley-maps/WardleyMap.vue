<template>
  <StaticDiagram
    :notation="notation"
    :filePath="props.wardleyMapFilePath"
    :width="props.width"
    :height="props.height"
  />
</template>

<script setup lang="ts">
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import { WardleyMapNotation } from '../../src/wardley-maps/WardleyMapNotation'
import StaticDiagram from '../../src/shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  wardleyMapFilePath: string
  width?: string
  height?: string
  theme?: DiagramThemeName
}>(), {
  width: '100%',
  height: 'auto',
  theme: 'light',
})

const notation = new WardleyMapNotation(new DiagramTheme(props.theme))
</script>
