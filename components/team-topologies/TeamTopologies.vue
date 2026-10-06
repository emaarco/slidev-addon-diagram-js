<template>
  <StaticDiagram
    diagramKind="Team Topologies"
    :filePath="props.teamTopologiesFilePath"
    :width="props.width"
    :height="props.height"
    :exportSvg="exportTeamTopologiesSvg"
  />
</template>

<script setup lang="ts">
import { exportTeamTopologiesSvg } from '../../plugins/team-topologies/teamTopologiesDiagram'
import StaticDiagram from '../../shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  teamTopologiesFilePath: string
  width?: string
  height?: string
}>(), {
  width: '100%',
  height: 'auto',
})
</script>
