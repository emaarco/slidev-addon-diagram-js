<template>
  <StaticDiagram
    diagramKind="Wardley Map"
    :filePath="props.wardleyMapFilePath"
    :width="props.width"
    :height="props.height"
    :exportSvg="exportWardleyMapSvg"
  />
</template>

<script setup lang="ts">
import { Viewer } from '@miragon/wardley-renderer'
import commandStackMissingInReadOnlyViewer from 'diagram-js/lib/command/index.js'
import '@miragon/wardley-renderer/assets/wardley.css'
import StaticDiagram from '../../shared/ui/StaticDiagram.vue'

const props = withDefaults(defineProps<{
  wardleyMapFilePath: string
  width?: string
  height?: string
}>(), {
  width: '100%',
  height: 'auto',
})

async function exportWardleyMapSvg(source: string, container: HTMLElement): Promise<string> {
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
