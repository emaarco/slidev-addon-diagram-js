<template>
  <div :style="{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: props.width, height: containerHeight }">
    <p v-if="loading">Loading DMN diagram...</p>
    <p v-if="error" class="text-red-500">{{ error }}</p>

    <div ref="viewerContainerRef" class="dmn-modeler-container" :style="{
      width: `calc(${props.width} - ${margin * 2}px)`,
      height: `calc(${containerHeight} - ${margin * 2}px)`,
      margin: `${margin}px`,
    }"></div>

    <ToolbarButton
      v-if="!loading && !error"
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
      <div
        v-if="isFullscreen"
        :style="{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          background: 'white',
          display: 'flex',
        }"
        @keydown.stop
      >
        <div :style="{ flex: 1, height: '100%', position: 'relative' }">
          <div ref="modelerContainerRef" :style="{ width: '100%', height: '100%' }"></div>

          <div :style="{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '8px',
          }">
            <ToolbarButton
              title="Close modeler"
              label="Close"
              @click="closeFullscreen"
            >
              <template #icon>
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </template>
            </ToolbarButton>
            <ToolbarButton
              v-if="props.engine"
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
          </div>
        </div>

        <div
          v-if="props.engine"
          v-show="isPanelOpen"
          ref="propertiesPanelRef"
          :style="{
            width: '350px',
            height: '100%',
            overflowY: 'auto',
            borderLeft: '1px solid #ccc',
            background: '#fafafa',
          }"
        ></div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { type Ref, nextTick, onMounted, onUnmounted, ref } from 'vue'
import DmnViewer from 'dmn-js/lib/Viewer'
import DmnModeler from 'dmn-js/lib/Modeler'
import 'dmn-js/dist/assets/diagram-js.css'
import 'dmn-js/dist/assets/dmn-js-shared.css'
import 'dmn-js/dist/assets/dmn-js-drd.css'
import 'dmn-js/dist/assets/dmn-js-decision-table.css'
import 'dmn-js/dist/assets/dmn-js-decision-table-controls.css'
import 'dmn-js/dist/assets/dmn-js-literal-expression.css'
import 'dmn-js/dist/assets/dmn-font/css/dmn-embedded.css'
import '@bpmn-io/properties-panel/dist/assets/properties-panel.css'
import { onSlideEnter } from '@slidev/client'
import { useDiagramFile } from '../../shared/lib/useDiagramFile'
import { camundaEngine } from '../../plugins/dmn/engines/camunda'
import type { Engine } from '../../plugins/dmn/engines/types'
import { fitDiagram } from '../../shared/lib/fitDiagram'
import ToolbarButton from '../../shared/ui/ToolbarButton.vue'

const margin = 5
const containerWaitTimeout = 5000
const nativeSizeScale = 1

// A bare DMN 1.3 model with an empty DRD canvas — the starting point when no
// `dmnFilePath` is given, so the modeler opens ready to build from scratch.
const BLANK_DMN = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/" xmlns:dmndi="https://www.omg.org/spec/DMN/20191111/DMNDI/" id="blank_definitions" name="New Decision Model" namespace="http://camunda.org/schema/1.0/dmn">
  <dmndi:DMNDI>
    <dmndi:DMNDiagram id="DMNDiagram_1" />
  </dmndi:DMNDI>
</definitions>`

const { loading, error, fetchDiagramFile, withLoading } = useDiagramFile('DMN')
const viewerContainerRef = ref<HTMLDivElement | null>(null)
const modelerContainerRef = ref<HTMLDivElement | null>(null)
const propertiesPanelRef = ref<HTMLDivElement | null>(null)
const isRendered = ref(false)
const isFullscreen = ref(false)
const isPanelOpen = ref(true)
const currentXml = ref<string | null>(null)
let viewer: any = null
let modeler: any = null

const props = withDefaults(defineProps<{
  dmnFilePath?: string
  width?: string
  height?: string
  engine?: Engine
}>(), {
  width: '100%',
  height: '500px',
})

function resolveEngineConfig() {
  if (props.engine === 'camunda') return camundaEngine
  return null
}

const containerHeight = props.height

async function waitForContainer(containerRef: Ref<HTMLDivElement | null>): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now()
    const checkDimensions = () => {
      if (containerRef.value && containerRef.value.clientWidth > 0 && containerRef.value.clientHeight > 0) {
        resolve(true)
      } else if (Date.now() - start > containerWaitTimeout) {
        resolve(false)
      } else {
        requestAnimationFrame(checkDimensions)
      }
    }
    checkDimensions()
  })
}

function fitActiveDrd(instance: any): void {
  const activeViewer = instance.getActiveViewer?.()
  const canvas = activeViewer?.get?.('canvas')
  if (!canvas) return
  canvas.resized()
  fitDiagram(canvas, undefined, nativeSizeScale)
}

async function renderViewer(): Promise<boolean> {
  if (viewer) {
    viewer.destroy()
    viewer = null
  }

  const ready = await waitForContainer(viewerContainerRef)
  if (!ready) return false

  viewer = new DmnViewer({ container: viewerContainerRef.value! })

  if (!currentXml.value) {
    currentXml.value = props.dmnFilePath ? await fetchDiagramFile(props.dmnFilePath) : BLANK_DMN
  }

  await viewer.importXML(currentXml.value)

  // Open the DRD view so the thumbnail always shows the diagram, not a table.
  const drdView = viewer.getViews().find((v: any) => v.type === 'drd')
  if (drdView) await viewer.open(drdView)
  fitActiveDrd(viewer)

  return true
}

async function renderDmn() {
  if (isRendered.value) return
  isRendered.value = true

  const result = await withLoading(() => renderViewer())

  // result === false → container hidden (preload). Reset guard so onSlideEnter retries.
  // result === undefined → withLoading caught a real error.
  if (result === false || (result === undefined && error.value)) {
    isRendered.value = false
  }
}

async function openFullscreen() {
  if (!currentXml.value) return

  isFullscreen.value = true
  await nextTick()
  await waitForContainer(modelerContainerRef)

  const config = resolveEngineConfig()
  const options: any = { container: modelerContainerRef.value! }
  if (config) {
    options.drd = {
      additionalModules: config.additionalModules,
      propertiesPanel: { parent: propertiesPanelRef.value! },
    }
    options.moddleExtensions = config.moddleExtensions
  }
  modeler = new DmnModeler(options)

  await modeler.importXML(currentXml.value)
  fitActiveDrd(modeler)
}

async function closeFullscreen() {
  let changed = false

  if (modeler) {
    try {
      const { xml } = await modeler.saveXML({ format: true })
      if (xml && xml !== currentXml.value) {
        currentXml.value = xml
        changed = true
      }
    } catch (err) {
      console.error('Failed to save DMN changes:', err)
    }
    modeler.destroy()
    modeler = null
  }

  isFullscreen.value = false
  isPanelOpen.value = true

  if (changed) {
    await nextTick()
    await renderViewer()
  }
}

async function togglePanel() {
  isPanelOpen.value = !isPanelOpen.value
  await nextTick()
  if (modeler) {
    const canvas = modeler.getActiveViewer?.()?.get?.('canvas')
    canvas?.resized()
  }
}

defineExpose({ openFullscreen, closeFullscreen, togglePanel })

onMounted(async () => {
  await nextTick()
  await renderDmn()
})

onSlideEnter(async () => {
  await renderDmn()
})

onUnmounted(() => {
  viewer?.destroy()
  viewer = null
  modeler?.destroy()
  modeler = null
})
</script>

<style scoped>
/* dmn-js watermark anchored bottom-right; shrink so it stays subordinate in
   small tiles. The fullscreen overlay uses its own viewer instance and is not
   targeted by this scoped rule. */
.dmn-modeler-container :deep(.bjs-powered-by) {
  transform: scale(0.7);
  transform-origin: bottom right;
}
</style>
