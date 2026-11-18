<template>
  <div class="diagram-modeler" :class="{ 'diagram-theme-dark': props.theme === 'dark' }" :style="{ width: props.width, height: props.height }">
    <LiveDiagram
      v-if="props.notation.rendering === 'live'"
      :notation="props.notation"
      :filePath="props.filePath"
      :source="previewSource"
      width="100%"
      height="100%"
      @rendered="rememberRenderedSource"
    />
    <StaticDiagram
      v-else
      :notation="props.notation"
      :filePath="props.filePath"
      :source="previewSource"
      width="100%"
      height="100%"
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

    <FullscreenOverlay :open="isFullscreen" :theme="props.theme">
      <div ref="modelerCanvasRef" class="diagram-modeler-canvas"></div>

      <template #toolbar>
        <ToolbarButton title="Close modeler" label="Close" @click="closeFullscreen">
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </template>
        </ToolbarButton>
        <ToolbarButton
          v-if="props.notation.hasPropertiesPanel"
          :title="isPanelOpen ? 'Hide properties panel' : 'Show properties panel'"
          :label="isPanelOpen ? 'Hide panel' : 'Show panel'"
          @click="togglePanel"
        >
          <template #icon>
            <svg v-if="isPanelOpen" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </template>
        </ToolbarButton>
      </template>

      <template #aside>
        <div
          v-if="props.notation.hasPropertiesPanel"
          v-show="isPanelOpen"
          ref="propertiesPanelRef"
          class="diagram-modeler-properties-panel"
        ></div>
      </template>
    </FullscreenOverlay>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue'
import type { DiagramThemeName } from '../lib/DiagramTheme'
import type { ModelerNotation, ModelerSession, PreviewNotation } from '../lib/notation'
import { PageStylesheet } from '../lib/PageStylesheet'
import FullscreenOverlay from './FullscreenOverlay.vue'
import LiveDiagram from './LiveDiagram.vue'
import StaticDiagram from './StaticDiagram.vue'
import ToolbarButton from './ToolbarButton.vue'

const props = defineProps<{
  notation: ModelerNotation & PreviewNotation
  filePath?: string
  width: string
  height: string
  modelerStyles?: string
  propertiesPanelOpen?: boolean
  theme?: DiagramThemeName
}>()

const previewSource = ref<string | undefined>(props.filePath ? undefined : props.notation.blankSource)
const renderedSource = ref<string | null>(null)
const isFullscreen = ref(false)
const isPanelOpen = ref(props.propertiesPanelOpen)
const modelerCanvasRef = ref<HTMLDivElement | null>(null)
const propertiesPanelRef = ref<HTMLDivElement | null>(null)
const modelerStylesheet = props.modelerStyles ? new PageStylesheet(props.modelerStyles) : null
let modelerSession: ModelerSession | null = null
let latestOpenRequest = 0

function rememberRenderedSource(source: string): void {
  renderedSource.value = source
}

async function openFullscreen(): Promise<void> {
  if (renderedSource.value === null) return

  const openRequest = ++latestOpenRequest
  isFullscreen.value = true
  isPanelOpen.value = props.propertiesPanelOpen
  modelerStylesheet?.attach()
  await nextTick()
  const session = await openModeler(renderedSource.value)

  const isStillWanted = isFullscreen.value && openRequest === latestOpenRequest
  if (!isStillWanted) session?.destroy()
  else if (session) modelerSession = session
  else leaveFullscreen()
}

async function openModeler(source: string): Promise<ModelerSession | null> {
  try {
    return await props.notation.openModeler(source, {
      canvas: modelerCanvasRef.value!,
      propertiesPanel: props.notation.hasPropertiesPanel ? propertiesPanelRef.value! : undefined,
    })
  } catch (err) {
    console.error(`Failed to open the ${props.notation.kind} modeler:`, err)
    return null
  }
}

async function closeFullscreen(): Promise<void> {
  const editedSource = await exportChanges()
  leaveFullscreen()

  if (editedSource !== null) previewSource.value = editedSource
}

async function togglePanel(): Promise<void> {
  isPanelOpen.value = !isPanelOpen.value
  await nextTick()
  modelerSession?.resized?.()
}

function leaveFullscreen(): void {
  discardModelerSession()
  isFullscreen.value = false
}

function discardModelerSession(): void {
  modelerSession?.destroy()
  modelerSession = null
  modelerStylesheet?.detach()
}

async function exportChanges(): Promise<string | null> {
  if (!modelerSession) return null

  try {
    return await modelerSession.exportChanges()
  } catch (err) {
    console.error(`Failed to save ${props.notation.kind} changes:`, err)
    return null
  }
}

onUnmounted(discardModelerSession)
</script>

<style scoped>
.diagram-modeler {
  position: relative;
}

/* bpmn.io watermark of a live preview; shrink so it stays subordinate in small tiles. */
.diagram-modeler :deep(.bjs-powered-by) {
  transform: scale(0.7);
  transform-origin: bottom right;
}

.diagram-modeler-canvas {
  width: 100%;
  height: 100%;
}

.diagram-modeler-properties-panel {
  width: 350px;
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid #ccc;
  background: #fafafa;
}

.diagram-theme-dark .diagram-modeler-properties-panel {
  border-left-color: #4d4d4d;
  background: #1e1e1e;
}
</style>

<style>
.fullscreen-overlay.diagram-theme-dark .bio-theme-parent {
  --bio-surface: #1e1e1e;
  --bio-surface-overlay: #262626;
  --bio-surface-subtle: #262626;
  --bio-surface-medium: #2e2e2e;
  --bio-surface-strong: #3a3a3a;
  --bio-surface-inverted: #e6e6e6;
  --bio-surface-inverted-subtle: #b3b3b3;
  --bio-text: #e6e6e6;
  --bio-text-subtle: #b3b3b3;
  --bio-text-subtlest: #808080;
  --bio-text-on-inverted: #1e1e1e;
  --bio-border: #4d4d4d;
  --bio-border-subtle: #3a3a3a;
  --bio-border-disabled: #333333;
  --bio-border-input: #4d4d4d;
  --bio-primary: hsl(205, 90%, 58%);
  --bio-primary-hover: hsl(205, 90%, 50%);
  --bio-primary-surface: hsl(205, 50%, 20%);
  --bio-primary-surface-strong: hsl(205, 50%, 28%);
  --bio-neutral: #8c8c8c;
  --bio-danger: hsl(360, 90%, 65%);
  --bio-danger-hover: hsl(360, 90%, 58%);
  --bio-danger-text: hsl(360, 90%, 72%);
  --bio-danger-surface: hsl(360, 45%, 22%);
  --bio-danger-surface-subtle: hsl(360, 35%, 16%);
  --bio-warning-text: hsl(39, 100%, 65%);
  --bio-warning-surface: hsl(38, 45%, 16%);
  --bio-info: hsl(205, 90%, 58%);
  --bio-info-on-inverted: hsl(205, 100%, 35%);
  --bio-focus: hsl(205, 90%, 58%);
  --bio-focus-surface: hsl(205, 50%, 20%);
  --bio-canvas-accent: hsl(205, 90%, 58%);
  --bio-canvas-accent-subtle: hsl(205, 60%, 35%);
  --bio-shadow: hsla(0, 0%, 0%, 60%);
  --bio-shadow-subtle: hsla(0, 0%, 0%, 30%);
}
</style>
