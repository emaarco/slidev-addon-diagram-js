<template>
  <DiagramModeler
    :notation="notation"
    :filePath="props.teamTopologiesFilePath"
    :width="props.width"
    :height="props.height"
    :theme="props.theme"
    :modelerStyles="modelerStyles"
  />
</template>

<script setup lang="ts">
import modelerStyles from '@miragon/team-topologies-renderer/assets/team-topologies.css?inline'
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
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
  theme: 'light',
})

const notation = new TeamTopologiesNotation(new DiagramTheme(props.theme))
</script>
