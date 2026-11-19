<template>
  <StaticDiagram
    :notation="notation"
    :filePath="props.eventStormingFilePath"
    :width="props.width"
    :height="props.height"
  />
</template>

<script setup lang="ts">
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import { EventStormingNotation } from '../../src/event-storming/EventStormingNotation'
import StaticDiagram from '../../src/shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  eventStormingFilePath: string
  width?: string
  height?: string
  theme?: DiagramThemeName
}>(), {
  width: '100%',
  height: 'auto',
  theme: 'light',
})

const notation = new EventStormingNotation(new DiagramTheme(props.theme))
</script>
