import { ref } from 'vue'

function resolveWithinBase(path: string): string {
  const base = import.meta.env.BASE_URL
  const pathWithinBase = path.startsWith(base) ? path.slice(base.length) : path.replace(/^\//, '')
  return new URL(pathWithinBase, window.location.origin + base).href
}

export function useDiagramFile(diagramKind: string) {
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function fetchDiagramFile(path: string): Promise<string> {
    const response = await fetch(resolveWithinBase(path))
    if (!response.ok) {
      throw new Error(`Failed to fetch ${diagramKind} file: ${response.status}`)
    }
    return response.text()
  }

  async function withLoading<T>(fn: () => Promise<T>): Promise<T | undefined> {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (err) {
      error.value = `Failed to load ${diagramKind}: ${err instanceof Error ? err.message : String(err)}`
      console.error(`${diagramKind} loading error:`, err)
      return undefined
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchDiagramFile, withLoading }
}
