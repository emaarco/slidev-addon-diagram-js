<template>
  <DiagramModeler
    :notation="notation"
    :filePath="props.wardleyMapFilePath"
    :width="props.width"
    :height="props.height"
    :theme="theme"
    :modelerStyles="modelerStyles"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import modelerStyles from '@miragon/wardley-renderer/assets/wardley.css?inline'
import { DiagramTheme, type DiagramThemeName } from '../../src/shared/lib/DiagramTheme'
import { DocumentTheme } from '../../src/shared/lib/DocumentTheme'
import { WardleyMapNotation } from '../../src/wardley-maps/WardleyMapNotation'
import DiagramModeler from '../../src/shared/ui/DiagramModeler.vue'

const props = withDefaults(defineProps<{
  wardleyMapFilePath?: string
  width?: string
  height?: string
  theme?: DiagramThemeName
}>(), {
  width: '100%',
  height: '500px',
})

const theme = new DocumentTheme(() => props.theme).name
const notation = computed(() => new WardleyMapNotation(new DiagramTheme(theme.value)))
</script>
