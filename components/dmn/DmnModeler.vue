<template>
  <DiagramModeler
    :notation="notation"
    :filePath="props.dmnFilePath"
    :width="props.width"
    :height="props.height"
    :propertiesPanelOpen="props.propertiesPanelOpen"
  />
</template>

<script setup lang="ts">
import '../../src/dmn/dmn.css'
import { DmnModelerNotation } from '../../src/dmn/DmnModelerNotation'
import type { Engine } from '../../src/dmn/engines/dmnEngines'
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import DiagramModeler from '../../src/shared/ui/DiagramModeler.vue'

const props = withDefaults(defineProps<{
  dmnFilePath?: string
  width?: string
  height?: string
  engine?: Engine
  propertiesPanelOpen?: boolean
  theme?: DiagramThemeName
}>(), {
  width: '100%',
  height: '500px',
  propertiesPanelOpen: false,
  theme: 'light',
})

const notation = new DmnModelerNotation(props.engine, new DiagramTheme(props.theme))
</script>

