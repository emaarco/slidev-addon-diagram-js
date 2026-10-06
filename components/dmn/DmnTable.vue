<template>
  <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: props.width, height: containerHeight }">
    <p v-if="loading">Loading DMN decision table...</p>
    <p v-else-if="error" class="text-red-500">{{ error }}</p>
    <div ref="containerRef"
         class="dmn-table-wrapper"
         :class="{ 'hide-annotations': !props.showAnnotations, 'hide-drd-button': !props.showDrdButton }"
         :style="{
           width: `calc(${props.width} - ${5 * 2}px)`,
           height: `calc(${containerHeight} - ${5 * 2}px)`,
           margin: `5px`,
           '--dmn-table-font-size': props.fontSize,
         }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import DmnViewer from 'dmn-js/lib/Viewer'
import 'dmn-js/dist/assets/diagram-js.css'
import 'dmn-js/dist/assets/dmn-js-shared.css'
import 'dmn-js/dist/assets/dmn-js-decision-table.css'
import 'dmn-js/dist/assets/dmn-js-decision-table-controls.css'
import 'dmn-js/dist/assets/dmn-font/css/dmn-embedded.css'
import { onSlideEnter } from '@slidev/client'
import { useDiagramFile } from '../../shared/lib/useDiagramFile'

const { loading, error, fetchDiagramFile } = useDiagramFile('DMN')
const containerRef = ref<HTMLDivElement | null>(null)
const isRendered = ref(false)
const isUnmounted = ref(false)

// Stop the container-polling loop once the component goes away, otherwise the
// recursive requestAnimationFrame keeps rescheduling forever when the container
// never gains dimensions (e.g. a slide that is never shown, or a jsdom test).
onBeforeUnmount(() => {
  isUnmounted.value = true
})

const props = withDefaults(defineProps<{
  dmnFilePath: string
  width?: string
  height?: string
  decisionId?: string
  fontSize?: string
  showAnnotations?: boolean
  showDrdButton?: boolean
}>(), {
  width: '100%',
  height: 'auto',
  fontSize: '12px',
  showAnnotations: false,
  showDrdButton: false,
})

const containerHeight = computed(() => props.height === 'auto' ? '500px' : props.height)

// Wait for the container to have dimensions; dmn-js throws "non-finite" SVG
// matrix errors if it measures a zero-size element.
async function waitForContainer(): Promise<void> {
  return new Promise((resolve) => {
    const checkDimensions = () => {
      if (isUnmounted.value) {
        resolve()
      } else if (containerRef.value && containerRef.value.clientWidth > 0 && containerRef.value.clientHeight > 0) {
        resolve()
      } else {
        requestAnimationFrame(checkDimensions)
      }
    }
    checkDimensions()
  })
}

// Guarded against the duplicate onMounted/onSlideEnter calls Slidev makes.
async function renderDmnTable() {

  if (isRendered.value) return
  isRendered.value = true
  loading.value = true
  error.value = null

  try {
    await waitForContainer()
    if (isUnmounted.value) return
    const dmnXml = await fetchDiagramFile(props.dmnFilePath)
    const viewer = new DmnViewer({
      container: containerRef.value!,
    })

    await viewer.importXML(dmnXml)

    const views = viewer.getViews()
    const tableView = props.decisionId
      ? views.find((v: any) => v.type === 'decisionTable' && v.element?.id === props.decisionId)
      : views.find((v: any) => v.type === 'decisionTable')

    if (!tableView) {
      throw new Error('No decision table view found in DMN file')
    }

    await viewer.open(tableView)

  } catch (err) {
    isRendered.value = false
    error.value = `Failed to load DMN: ${err instanceof Error ? err.message : String(err)}`
    console.error('DMN loading error:', err)
  } finally {
    loading.value = false
  }
}

// Render on mount for PDF export: onSlideEnter doesn't fire in headless mode.
onMounted(async () => {
  await nextTick()
  await renderDmnTable()
})

// Render on slide enter: the container only has valid dimensions when visible.
onSlideEnter(async () => {
  await renderDmnTable()
})
</script>

<style>
.dmn-table-wrapper .dmn-decision-table-container {
  font-size: var(--dmn-table-font-size, 12px) !important;
}

.dmn-table-wrapper .dmn-decision-table-container .decision-table-name {
  font-size: calc(var(--dmn-table-font-size, 12px) * 1.5) !important;
}

.dmn-table-wrapper .dmn-decision-table-container thead .input-label,
.dmn-table-wrapper .dmn-decision-table-container thead .input-expression,
.dmn-table-wrapper .dmn-decision-table-container thead .output-label,
.dmn-table-wrapper .dmn-decision-table-container thead .output-name {
  font-size: calc(var(--dmn-table-font-size, 12px) * 1.15) !important;
}

.dmn-table-wrapper .dmn-decision-table-container thead .clause,
.dmn-table-wrapper .dmn-decision-table-container thead .input-variable,
.dmn-table-wrapper .dmn-decision-table-container thead .output-variable {
  font-size: calc(var(--dmn-table-font-size, 12px) * 0.85) !important;
}

/* Force table to fill container width, no x-scroll. Also re-point the body font
   size at the variable: dmn-js pins `.tjs-container` to a fixed 21px, so the rule
   cells would otherwise ignore the `font-size` set on the container above and the
   rows would never shrink. */
.dmn-table-wrapper .tjs-container {
  width: 100% !important;
  font-size: var(--dmn-table-font-size, 12px) !important;
}

.dmn-table-wrapper .tjs-table-container {
  overflow-x: hidden !important;
  overflow-y: auto !important;
}

.dmn-table-wrapper .tjs-table {
  width: 100% !important;
  table-layout: fixed !important;
}

.dmn-table-wrapper th:not(:first-child),
.dmn-table-wrapper td:not(:first-child) {
  padding: 2px !important;
}

.dmn-table-wrapper thead .input-label,
.dmn-table-wrapper thead .input-expression,
.dmn-table-wrapper thead .output-label,
.dmn-table-wrapper thead .output-name {
  margin: 4px 4px !important;
}

.dmn-table-wrapper .decision-table-header-separator {
  height: 16px !important;
}

.dmn-table-wrapper th.index-column {
  width: 36px !important;
}

.dmn-table-wrapper.hide-annotations th.annotation,
.dmn-table-wrapper.hide-annotations td.annotation {
  display: none !important;
}

.dmn-table-wrapper.hide-drd-button .view-drd {
  display: none !important;
}
</style>
