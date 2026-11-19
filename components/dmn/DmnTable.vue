<template>
  <LiveDiagram
    class="dmn-table-wrapper"
    :class="{ 'hide-annotations': !props.showAnnotations, 'hide-drd-button': !props.showDrdButton, 'dmn-theme-dark': theme === 'dark' }"
    :style="{ '--dmn-table-font-size': props.fontSize }"
    :notation="notation"
    :filePath="props.dmnFilePath"
    :width="props.width"
    :height="containerHeight"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import '../../src/dmn/dmn.css'
import { DecisionTableNotation } from '../../src/dmn/DecisionTableNotation'
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import { DocumentTheme } from '../../src/shared/lib/DocumentTheme'
import LiveDiagram from '../../src/shared/ui/LiveDiagram.vue'

const props = withDefaults(defineProps<{
  dmnFilePath: string
  width?: string
  height?: string
  decisionId?: string
  fontSize?: string
  showAnnotations?: boolean
  showDrdButton?: boolean
  theme?: DiagramThemeName
}>(), {
  width: '100%',
  height: 'auto',
  fontSize: '12px',
  showAnnotations: false,
  showDrdButton: false,
})

const containerHeight = computed(() => props.height === 'auto' ? '500px' : props.height)
const theme = new DocumentTheme(() => props.theme).name
const notation = computed(() => new DecisionTableNotation(props.decisionId, new DiagramTheme(theme.value)))
</script>
