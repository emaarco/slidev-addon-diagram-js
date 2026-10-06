<template>
  <div class="static-diagram" :style="{ width: props.width, height: props.height }">
    <p v-if="loading">Loading {{ props.diagramKind }} diagram...</p>
    <p v-if="error" class="text-red-500">{{ error }}</p>
    <div v-if="svg" v-html="svg" class="static-diagram-inner"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDiagramFile } from '../lib/useDiagramFile'
import { renderStaticSvg } from '../lib/renderStaticSvg'

const props = defineProps<{
  filePath: string
  diagramKind: string
  width: string
  height: string
  exportSvg: (source: string, container: HTMLElement) => Promise<string>
}>()

const { loading, error, fetchDiagramFile, withLoading } = useDiagramFile(props.diagramKind)
const svg = ref<string | null>(null)

onMounted(() => {
  withLoading(loadAndRender)
})

async function loadAndRender(): Promise<void> {
  const source = await fetchDiagramFile(props.filePath)
  svg.value = await renderStaticSvg(container => props.exportSvg(source, container))
}
</script>

<style scoped>
.static-diagram {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.static-diagram-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
}

/* Cap to the box; the SVG's intrinsic size keeps it from collapsing to 0. */
.static-diagram-inner :deep(svg) {
  max-width: 100%;
  max-height: 100%;
}
</style>
