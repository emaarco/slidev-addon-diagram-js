<template>
  <DiagramModeler
    :notation="notation"
    :filePath="props.eventStormingFilePath"
    :width="props.width"
    :height="props.height"
    :theme="theme"
    :modelerStyles="modelerStyles"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import modelerStyles from '@miragon/event-storming-renderer/assets/event-storming.css?inline'
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import { DocumentTheme } from '../../src/shared/lib/DocumentTheme'
import { EventStormingNotation } from '../../src/event-storming/EventStormingNotation'
import DiagramModeler from '../../src/shared/ui/DiagramModeler.vue'

const props = withDefaults(defineProps<{
  eventStormingFilePath?: string
  width?: string
  height?: string
  theme?: DiagramThemeName
}>(), {
  width: '100%',
  height: '500px',
})

const theme = new DocumentTheme(() => props.theme).name
const notation = computed(() => new EventStormingNotation(new DiagramTheme(theme.value)))
</script>
