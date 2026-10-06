<template>
  <StaticDiagram
    diagramKind="Wardley Map"
    :filePath="props.wardleyMapFilePath"
    :width="props.width"
    :height="props.height"
    :exportSvg="exportWardleyMapSvg"
  />
</template>

<script setup lang="ts">
import { exportWardleyMapSvg } from '../../plugins/wardley-maps/wardleyMap'
import StaticDiagram from '../../shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  wardleyMapFilePath: string
  width?: string
  height?: string
}>(), {
  width: '100%',
  height: 'auto',
})
</script>
