<template>
  <DiagramModeler
    diagramKind="Team Topologies"
    :filePath="props.teamTopologiesFilePath"
    :blankSource="blankTeamTopologiesDiagram"
    :width="props.width"
    :height="props.height"
    :exportSvg="exportTeamTopologiesSvg"
    :openModeler="openTeamTopologiesModeler"
    :modelerStyles="modelerStyles"
  />
</template>

<script setup lang="ts">
import modelerStyles from '@miragon/team-topologies-renderer/assets/team-topologies.css?inline'
import {
  blankTeamTopologiesDiagram,
  exportTeamTopologiesSvg,
  openTeamTopologiesModeler,
} from '../../plugins/team-topologies/teamTopologiesDiagram'
import DiagramModeler from '../../shared/ui/DiagramModeler.vue'

const props = withDefaults(defineProps<{
  teamTopologiesFilePath?: string
  width?: string
  height?: string
}>(), {
  width: '100%',
  height: '500px',
})
</script>
