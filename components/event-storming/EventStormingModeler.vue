<template>
  <DiagramModeler
    diagramKind="Event Storming"
    :filePath="props.eventStormingFilePath"
    :blankSource="blankEventStormingBoard"
    :width="props.width"
    :height="props.height"
    :exportSvg="exportEventStormingSvg"
    :openModeler="openEventStormingModeler"
    :modelerStyles="modelerStyles"
  />
</template>

<script setup lang="ts">
import modelerStyles from '@miragon/event-storming-renderer/assets/event-storming.css?inline'
import {
  blankEventStormingBoard,
  exportEventStormingSvg,
  openEventStormingModeler,
} from '../../plugins/event-storming/eventStormingBoard'
import DiagramModeler from '../../shared/ui/DiagramModeler.vue'

const props = withDefaults(defineProps<{
  eventStormingFilePath?: string
  width?: string
  height?: string
}>(), {
  width: '100%',
  height: '500px',
})
</script>
