<template>
  <StaticDiagram
    diagramKind="Event Storming"
    :filePath="props.eventStormingFilePath"
    :width="props.width"
    :height="props.height"
    :exportSvg="exportEventStormingSvg"
  />
</template>

<script setup lang="ts">
import { Viewer } from '@miragon/event-storming-renderer'
import commandStackMissingInReadOnlyViewer from 'diagram-js/lib/command/index.js'
import '@miragon/event-storming-renderer/assets/event-storming.css'
import StaticDiagram from '../../shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  eventStormingFilePath: string
  width?: string
  height?: string
}>(), {
  width: '100%',
  height: 'auto',
})

async function exportEventStormingSvg(source: string, container: HTMLElement): Promise<string> {
  const viewer = new Viewer({ container, additionalModules: [commandStackMissingInReadOnlyViewer] })
  try {
    await viewer.importDSL(source)
    const { svg } = await viewer.saveSVG()
    return svg
  } finally {
    viewer.destroy()
  }
}
</script>
