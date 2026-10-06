<template>
  <DiagramModeler
    diagramKind="Wardley Map"
    :filePath="props.wardleyMapFilePath"
    :blankSource="blankWardleyMap"
    :width="props.width"
    :height="props.height"
    :exportSvg="exportWardleyMapSvg"
    :openModeler="openWardleyMapModeler"
    :modelerStyles="modelerStyles"
  />
</template>

<script setup lang="ts">
import modelerStyles from '@miragon/wardley-renderer/assets/wardley.css?inline'
import {
  blankWardleyMap,
  exportWardleyMapSvg,
  openWardleyMapModeler,
} from '../../plugins/wardley-maps/wardleyMap'
import DiagramModeler from '../../shared/ui/DiagramModeler.vue'

const props = withDefaults(defineProps<{
  wardleyMapFilePath?: string
  width?: string
  height?: string
}>(), {
  width: '100%',
  height: '500px',
})
</script>
