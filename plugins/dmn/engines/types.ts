export type Engine = 'camunda'

export interface EngineConfig {
  additionalModules: any[]
  moddleExtensions: Record<string, any>
}
