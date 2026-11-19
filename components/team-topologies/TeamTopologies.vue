<template>
  <StaticDiagram
    :notation="notation"
    :filePath="props.teamTopologiesFilePath"
    :width="props.width"
    :height="props.height"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import { DocumentTheme } from '../../src/shared/lib/DocumentTheme'
import { TeamTopologiesNotation } from '../../src/team-topologies/TeamTopologiesNotation'
import StaticDiagram from '../../src/shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  teamTopologiesFilePath: string
  width?: string
  height?: string
  theme?: DiagramThemeName
}>(), {
  width: '100%',
  height: 'auto',
})

const theme = new DocumentTheme(() => props.theme).name
const notation = computed(() => new TeamTopologiesNotation(new DiagramTheme(theme.value)))
</script>
