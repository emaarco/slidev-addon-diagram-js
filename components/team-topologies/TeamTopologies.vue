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
import { Viewer } from '@miragon/team-topologies-renderer'
import { parseDocument } from '@miragon/team-topologies-schema-model'
import '@miragon/team-topologies-renderer/assets/team-topologies.css'
import StaticDiagram from '../../shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  teamTopologiesFilePath: string
  width?: string
  height?: string
}>(), {
  width: '100%',
  height: 'auto',
})

async function exportTeamTopologiesSvg(source: string, container: HTMLElement): Promise<string> {
  const parsed = parseDocument(JSON.parse(source))
  if (!parsed.ok) {
    throw new Error(parsed.error)
  }

  const viewer = new Viewer({ container })
  try {
    viewer.importDocument(parsed.document)
    return viewer.saveSVG().svg
  } finally {
    viewer.destroy()
  }
}
</script>
