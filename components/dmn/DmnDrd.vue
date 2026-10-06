<template>
  <div>
    <p v-if="loading">Loading DMN diagram...</p>
    <p v-else-if="error" class="text-red-500">{{ error }}</p>
    <div v-else-if="svg" v-html="svg"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DmnViewer from 'dmn-js/lib/Viewer'
import 'dmn-js/dist/assets/diagram-js.css'
import 'dmn-js/dist/assets/dmn-js-shared.css'
import 'dmn-js/dist/assets/dmn-js-drd.css'
import 'dmn-js/dist/assets/dmn-font/css/dmn-embedded.css'
import { useDiagramFile } from '../../shared/lib/useDiagramFile'

const { loading, error, fetchDiagramFile, withLoading } = useDiagramFile('DMN')
const svg = ref<string | null>(null)

const props = withDefaults(defineProps<{
  dmnFilePath: string
  width?: string
  height?: string
  fontSize?: string
}>(), {
  width: '100%',
  height: 'auto',
  fontSize: '12px',
})

onMounted(() => {
  withLoading(() => loadAndRenderDrd(props.dmnFilePath))
})

async function loadAndRenderDrd(path: string): Promise<void> {
  const dmnXml = await fetchDiagramFile(path)

  const container = document.createElement('div')
  container.style.width = '1920px'
  container.style.height = '1080px'
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  document.body.appendChild(container)

  const viewer = new DmnViewer({
    container,
    drd: {
      textRenderer: {
        defaultStyle: { fontSize: parseInt(props.fontSize, 10) || 12 }
      }
    }
  })

  try {
    await viewer.importXML(dmnXml)

    const views = viewer.getViews()
    const drdView = views.find((v: any) => v.type === 'drd')
    if (!drdView) {
      throw new Error('No DRD view found in DMN file')
    }
    await viewer.open(drdView)

    const activeViewer = viewer.getActiveViewer()
    const { svg: svgContent } = await activeViewer.saveSVG()

    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml')
    const svgElement = svgDoc.documentElement

    svgElement.style.maxWidth = props.width
    svgElement.style.height = props.height
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')

    svg.value = svgElement.outerHTML
  } finally {
    document.body.removeChild(container)
    viewer.destroy()
  }
}
</script>
