export type ExportSvg = (source: string, container: HTMLElement) => Promise<string>

export interface ModelerSession {
  exportSource: () => string
  destroy: () => void
}

export type OpenModeler = (source: string, container: HTMLElement) => Promise<ModelerSession>
