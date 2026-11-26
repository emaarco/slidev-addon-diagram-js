<template>
  <StaticDiagram
    :notation="notation"
    :filePath="props.eventStormingFilePath"
    :width="props.width"
    :height="props.height"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import { DocumentTheme } from '../../src/shared/lib/DocumentTheme'
import { EventStormingNotation } from '../../src/event-storming/EventStormingNotation'
import StaticDiagram from '../../src/shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  eventStormingFilePath: string
  width?: string
  height?: string
  theme?: DiagramThemeName
  typeCaptions?: boolean
}>(), {
  width: '100%',
  height: 'auto',
  typeCaptions: true,
})

const theme = new DocumentTheme(() => props.theme).name
const notation = computed(() => new EventStormingNotation(new DiagramTheme(theme.value), props.typeCaptions))
</script>
