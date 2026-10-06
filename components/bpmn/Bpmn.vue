<template>
  <div class="bpmn-static" :style="{ width: props.width, height: props.height }">
    <p v-if="loading">Loading BPMN diagram...</p>
    <p v-if="error" class="text-red-500">{{ error }}</p>
    <div v-if="svg" v-html="svg" class="bpmn-static-inner"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BpmnViewer from 'bpmn-js/lib/Viewer'
import 'bpmn-js/dist/assets/bpmn-js.css'
import { useDiagramFile } from '../../shared/lib/useDiagramFile'
import { renderStaticSvg } from '../../shared/lib/renderStaticSvg'

const { loading, error, fetchDiagramFile, withLoading } = useDiagramFile('BPMN')
const svg = ref<string | null>(null)

const props = withDefaults(defineProps<{
  bpmnFilePath: string
  width?: string
  height?: string
}>(), {
  width: '100%',
  height: 'auto',
})

onMounted(() => {
  withLoading(() => loadAndRenderBpmn(props.bpmnFilePath))
})

async function loadAndRenderBpmn(path: string): Promise<void> {
  const bpmnXml = await fetchDiagramFile(path)
  svg.value = await renderStaticSvg(container => exportBpmnSvg(bpmnXml, container))
}

async function exportBpmnSvg(bpmnXml: string, container: HTMLElement): Promise<string> {
  const viewer = new BpmnViewer({ container })
  await viewer.importXML(bpmnXml)
  const { svg: exportedSvg } = await viewer.saveSVG()
  viewer.destroy()
  return exportedSvg
}
</script>

<style scoped>
.bpmn-static {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.bpmn-static-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
}

/* Cap to the box; the SVG's intrinsic size keeps it from collapsing to 0. */
.bpmn-static-inner :deep(svg) {
  max-width: 100%;
  max-height: 100%;
}
</style>
