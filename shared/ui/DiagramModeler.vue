<template>
  <div class="diagram-modeler" :style="{ width: props.width, height: props.height }">
    <StaticDiagram
      :diagramKind="props.diagramKind"
      :filePath="props.filePath"
      :source="previewSource"
      width="100%"
      height="100%"
      :exportSvg="props.exportSvg"
      @rendered="rememberRenderedSource"
    />

    <ToolbarButton
      v-if="renderedSource !== null"
      title="Open modeler"
      label="Edit"
      :position="{ top: '12px', right: '12px', zIndex: 10 }"
      @click="openFullscreen"
    >
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </template>
    </ToolbarButton>

    <Teleport to="body">
      <div v-if="isFullscreen" class="diagram-modeler-overlay">
        <div ref="modelerContainerRef" class="diagram-modeler-canvas"></div>

        <div class="diagram-modeler-toolbar">
          <ToolbarButton title="Close modeler" label="Close" @click="closeFullscreen">
            <template #icon>
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </template>
          </ToolbarButton>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue'
import { attachStylesheet } from '../lib/attachStylesheet'
import type { ExportSvg, ModelerSession, OpenModeler } from '../lib/diagramAdapter'
import StaticDiagram from './StaticDiagram.vue'
import ToolbarButton from './ToolbarButton.vue'

const props = defineProps<{
  diagramKind: string
  filePath?: string
  blankSource: string
  width: string
  height: string
  exportSvg: ExportSvg
  openModeler: OpenModeler
  modelerStyles: string
}>()

const previewSource = ref<string | undefined>(props.filePath ? undefined : props.blankSource)
const renderedSource = ref<string | null>(null)
const isFullscreen = ref(false)
const modelerContainerRef = ref<HTMLDivElement | null>(null)
let modelerSession: ModelerSession | null = null
let detachModelerStyles: (() => void) | null = null

function rememberRenderedSource(source: string): void {
  renderedSource.value = source
}

async function openFullscreen(): Promise<void> {
  if (renderedSource.value === null) return

  isFullscreen.value = true
  detachModelerStyles = attachStylesheet(props.modelerStyles)
  document.addEventListener('keydown', keepKeyStrokesFromSlideNavigation)
  await nextTick()
  modelerSession = await props.openModeler(renderedSource.value, modelerContainerRef.value!)
}

function closeFullscreen(): void {
  const editedSource = exportEditedSource()
  discardModelerSession()
  isFullscreen.value = false

  if (editedSource !== null && editedSource !== renderedSource.value) {
    previewSource.value = editedSource
  }
}

function discardModelerSession(): void {
  modelerSession?.destroy()
  modelerSession = null
  detachModelerStyles?.()
  detachModelerStyles = null
  document.removeEventListener('keydown', keepKeyStrokesFromSlideNavigation)
}

// The modelers handle shortcuts on document, Slidev navigates on window:
// stopping here lets the modeler see a key stroke and keeps the slide in place.
function keepKeyStrokesFromSlideNavigation(event: KeyboardEvent): void {
  event.stopPropagation()
}

function exportEditedSource(): string | null {
  if (!modelerSession) return null

  try {
    return modelerSession.exportSource()
  } catch (err) {
    console.error(`Failed to save ${props.diagramKind} changes:`, err)
    return null
  }
}

defineExpose({ openFullscreen, closeFullscreen })

onUnmounted(discardModelerSession)
</script>

<style scoped>
.diagram-modeler {
  position: relative;
}

.diagram-modeler-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: white;
}

.diagram-modeler-canvas {
  width: 100%;
  height: 100%;
}

.diagram-modeler-toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10000;
}
</style>
