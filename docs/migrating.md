# Migrating from slidev-addon-bpmn / slidev-addon-dmn

[← Back to the overview](../README.md)

`slidev-addon-diagram-js` replaces both `slidev-addon-bpmn` and `slidev-addon-dmn` — they are consolidated into this single package. The move is designed to be painless.

## Swap the dependencies

```bash
npm uninstall slidev-addon-bpmn slidev-addon-dmn
npm install slidev-addon-diagram-js
```

## Point your deck at the new addon

List the new addon instead of the two old ones, in your slide's frontmatter:

```yaml
---
addons:
  - slidev-addon-diagram-js
---
```

or in `package.json`:

```json
{
  "slidev": {
    "addons": ["slidev-addon-diagram-js"]
  }
}
```

## That's it

Component names, props and defaults are **unchanged** — `<Bpmn>`, `<DmnTable>`, `<DmnModeler>` and the rest behave exactly as before, so your existing slides need no edits. On top of what you had, you now also get Team Topologies, Wardley Maps and Event Storming (see the [overview](../README.md)).
