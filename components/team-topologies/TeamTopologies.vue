<template>
  <StaticDiagram
    :notation="notation"
    :filePath="props.teamTopologiesFilePath"
    :width="props.width"
    :height="props.height"
  />
</template>

<script setup lang="ts">
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
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
  theme: 'light',
})

const notation = new TeamTopologiesNotation(new DiagramTheme(props.theme))
</script>
