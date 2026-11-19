import { type ComputedRef, computed, onScopeDispose, ref } from 'vue'
import type { DiagramThemeName } from './DiagramTheme'

const DARK_MODE_CLASS = 'dark'

// Slidev's colour-scheme toggle sets `dark` on <html>; print and export render without it, so they stay light.
export class DocumentTheme {
  readonly name: ComputedRef<DiagramThemeName>

  constructor(pinnedName: () => DiagramThemeName | undefined) {
    const documentName = ref(this.read())
    const followDarkModeClass = new MutationObserver(() => { documentName.value = this.read() })
    followDarkModeClass.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    onScopeDispose(() => followDarkModeClass.disconnect())

    this.name = computed(() => pinnedName() ?? documentName.value)
  }

  private read(): DiagramThemeName {
    return document.documentElement.classList.contains(DARK_MODE_CLASS) ? 'dark' : 'light'
  }
}
