<template>
  <StaticDiagram
    diagramKind="Event Storming"
    :filePath="props.eventStormingFilePath"
    :width="props.width"
    :height="props.height"
    :exportSvg="exportEventStormingSvg"
  />
</template>

<script setup lang="ts">
import { exportEventStormingSvg } from '../../plugins/event-storming/eventStormingBoard'
import StaticDiagram from '../../shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  eventStormingFilePath: string
  width?: string
  height?: string
}>(), {
  width: '100%',
  height: 'auto',
})
</script>
