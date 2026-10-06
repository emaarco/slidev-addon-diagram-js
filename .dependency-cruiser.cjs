/**
 * Architecture guardrail for the addon's source modules.
 *
 * Layering (imports only ever point "down"):
 *   components/<modeler>/ -> plugins/<modeler>/, composables/, shared/   (the public component surface)
 *   plugins/<modeler>/    -> shared/
 *   composables/          -> shared/
 *   shared/               -> (leaf; imports nothing from the layers above)
 *
 * A modeler (bpmn, dmn, ...) never imports another modeler; they only meet in shared/.
 *
 * See components/README.md for why components/ is the public surface.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Circular dependencies make the module graph hard to reason about.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'modelers-are-isolated',
      comment: 'A modeler must not import another modeler; code they both need lives in shared/.',
      severity: 'error',
      from: { path: '^(components|plugins)/([^/]+)/' },
      to: { path: '^(components|plugins)/[^/]+/', pathNot: '^(components|plugins)/$2/' },
    },
    {
      name: 'plugins-not-to-ui',
      comment: 'Plugins hold engine wiring and must not know about the UI (components/composables).',
      severity: 'error',
      from: { path: '^plugins/' },
      to: { path: '^(components|composables)/' },
    },
    {
      name: 'composables-not-to-components',
      comment: 'Composables are lower-level than components and must not import them.',
      severity: 'error',
      from: { path: '^composables/' },
      to: { path: '^components/' },
    },
    {
      name: 'shared-is-a-leaf',
      comment: 'shared/ holds reusable UI atoms + helpers; it must not import upward.',
      severity: 'error',
      from: { path: '^shared/' },
      to: { path: '^(components|composables|plugins)/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    includeOnly: '^(components|composables|plugins|shared)/',
    enhancedResolveOptions: {
      extensions: ['.ts', '.js', '.vue'],
    },
  },
}
