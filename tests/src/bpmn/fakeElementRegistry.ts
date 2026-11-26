// An element registry that only knows element names, enough for BpmnPathSimulationViewer.elementName.
export function fakeElementRegistry(names: Record<string, string | undefined>) {
  return {
    get: (id: string) => (id in names ? { businessObject: { name: names[id] } } : undefined),
  }
}

export const BIKE_ORDER_NAMES = { Gateway_Credit: 'Credit OK?', Flow_Review: 'large order', Flow_Note: undefined }
