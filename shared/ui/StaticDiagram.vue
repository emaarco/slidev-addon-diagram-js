<template>
  <div class="static-diagram" :style="{ width: props.width, height: props.height }">
    <p v-if="loading && !svg">Loading {{ props.diagramKind }} diagram...</p>
    <p v-if="error" class="text-red-500">{{ error }}</p>
    <div v-if="svg" v-html="svg" class="static-diagram-inner"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { ExportSvg } from '../lib/diagramAdapter'
import { useDiagramFile } from '../lib/useDiagramFile'
import { renderStaticSvg } from '../lib/renderStaticSvg'

const props = defineProps<{
  diagramKind: string
  filePath?: string
  source?: string
  width: string
  height: string
  exportSvg: ExportSvg
}>()

const emit = defineEmits<{ rendered: [source: string] }>()

const { loading, error, fetchDiagramFile, withLoading } = useDiagramFile(props.diagramKind)
const svg = ref<string | null>(null)

onMounted(render)
watch(() => props.source, render)

function render(): Promise<void | undefined> {
  return withLoading(async () => {
    const source = props.source ?? await fetchDiagramFile(props.filePath!)
    svg.value = await renderStaticSvg(container => props.exportSvg(source, container))
    emit('rendered', source)
  })
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
