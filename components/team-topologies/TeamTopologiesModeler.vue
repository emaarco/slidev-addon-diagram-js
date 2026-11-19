<template>
  <DiagramModeler
    :notation="notation"
    :filePath="props.teamTopologiesFilePath"
    :width="props.width"
    :height="props.height"
    :theme="theme"
    :modelerStyles="modelerStyles"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import modelerStyles from '@miragon/team-topologies-renderer/assets/team-topologies.css?inline'
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import { DocumentTheme } from '../../src/shared/lib/DocumentTheme'
import { TeamTopologiesNotation } from '../../src/team-topologies/TeamTopologiesNotation'
import DiagramModeler from '../../src/shared/ui/DiagramModeler.vue'

const props = withDefaults(defineProps<{
  teamTopologiesFilePath?: string
  width?: string
  height?: string
  theme?: DiagramThemeName
}>(), {
  width: '100%',
  height: '500px',
})

const theme = new DocumentTheme(() => props.theme).name
const notation = computed(() => new TeamTopologiesNotation(new DiagramTheme(theme.value)))
</script>
