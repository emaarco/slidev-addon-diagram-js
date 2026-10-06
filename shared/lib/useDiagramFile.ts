import { ref } from 'vue'

export function useDiagramFile(diagramKind: string) {
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function fetchDiagramFile(path: string): Promise<string> {
    const url = new URL(path, window.location.origin + import.meta.env.BASE_URL).href
    const response = await fetch(url)
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
