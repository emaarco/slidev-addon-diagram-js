# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Slidev addon that displays diagram-js based models in presentations: BPMN 2.0 processes (via bpmn-js), DMN decisions (via dmn-js), and Team Topologies, Wardley Maps and Event Storming boards (via the Miragon renderers). It replaces the former `slidev-addon-bpmn` and `slidev-addon-dmn` packages and is laid out so further diagram-js modelers can be added next to them.

## Development Commands

```bash
# Run the example deck through portless for a stable, git-worktree-aware .localhost URL.
# One-time per machine: `npx portless service install` (needs sudo).
npm run dev

# Run the dev server directly, without portless (plain port, no stable URL)
npm run dev:app

# Build the example presentation
npm run build

# Export presentation to PDF
npm run export

# Export presentation to PNG screenshots
npm run screenshot

# Run the unit tests (vitest + jsdom)
npm test

# Lint the module graph (layering + modeler isolation + no-circular rules)
npm run lint:deps

# Find unused files, exports and dependencies (knip)
npm run knip
```

## Code Hygiene

Two static-analysis gates run in the `Build` CI workflow (`.github/workflows/build.yml`):

- **`lint:deps`** (dependency-cruiser) — enforces the module boundaries in `.dependency-cruiser.cjs`.
- **`knip`** (config in `knip.ts`) — flags unused files, exports and dependencies.
  Entry points are `setup/main.ts` (Slidev auto-loads it to register the components)
  and `components/**/*.vue` (the published surface external decks import). `@slidev/client`
  and `@slidev/types` come from the `@slidev/cli` peer dependency, and
  `@miragon/slidev-toolkit` is the theme in `example.md`'s frontmatter — all three are
  imported outside what knip can see, so they're listed under `ignoreDependencies`.

## Architecture

### Module layout

```
components/<modeler>/   public Vue components (Slidev registers them globally by filename)
plugins/<modeler>/      modeler-specific logic that is not a component (engine wiring)
shared/                 diagram-js infrastructure used by every modeler
  lib/fitDiagram.ts       pads, clamps and centres a diagram-js canvas viewbox
  lib/useDiagramFile.ts   fetches a diagram file + loading/error state
  lib/renderStaticSvg.ts  off-screen render: container, SVG clean-up, unique ids, padding, sizing
  lib/diagramAdapter.ts   the adapter types a modeler plugin implements (ExportSvg, OpenModeler)
  lib/attachStylesheet.ts adds a stylesheet to the page and returns its remover
  ui/StaticDiagram.vue    renders a file or a given source as a static SVG
  ui/DiagramModeler.vue   StaticDiagram preview + Edit button + fullscreen modeler
  ui/ToolbarButton.vue    toolbar button used by the interactive components
setup/main.ts           registers the BPMN components for this repo's own demo deck
tests/                  mirrors the layout above
```

The vue components have to live under `components/`: Slidev only registers components from
`<root>/components` (subfolders included, by filename). Nothing but components may live there,
because every `.vue`/`.ts` file in it becomes a global in the consuming deck — see
`components/README.md`.

dependency-cruiser enforces that imports only point "down" (`components/` → `plugins/` →
`shared/`, with `shared/` as a leaf) and that **one modeler never imports another**: `bpmn` and
`dmn` only meet in `shared/`.

**Adding a modeler** = a `components/<name>/` folder for its components, a `plugins/<name>/`
folder if it needs non-component logic, its entries in `vite.config.ts` `optimizeDeps.include`,
and tests under `tests/`. The isolation rule covers the new folder without changes. The quickest
route is the adapter in `shared/lib/diagramAdapter.ts`: implement `ExportSvg` and `OpenModeler` in
`plugins/<name>/`, then wrap `shared/ui/StaticDiagram.vue` and `shared/ui/DiagramModeler.vue` in two
thin components — see `plugins/wardley-maps/wardleyMap.ts` and `components/wardley-maps/`.

### BPMN components (`components/bpmn/`)

- **`Bpmn.vue`** — Static SVG rendering (off-screen render approach, best for PDF exports)
- **`BpmnTokenSimulation.vue`** — Interactive viewer with animated token flow simulation
- **`BpmnModeler.vue`** — Interactive BPMN modeler for live diagram editing (workshops/trainings). Accepts an optional `engine` prop (`"zeebe"` | `"camunda7"`) that mounts an engine-specific properties panel side-by-side with the canvas. Engine wiring lives in `plugins/bpmn/engines/zeebe.ts` and `plugins/bpmn/engines/camunda7.ts` — one file per engine (SRP); the component picks one via a small `if` in `resolveEngineConfig()`. Adding a new engine = one new file under `plugins/bpmn/engines/` plus one `if` line. Also accepts a `transactionBoundaries` prop (default `false`) that overlays Camunda 7 transaction boundaries via the `camunda-transaction-boundaries` module (registered in `plugins/bpmn/engines/camunda7.ts`); it only takes effect with `engine="camunda7"` since the visualization reads `camunda:asyncBefore`/`asyncAfter` from the Camunda moddle.

#### Bpmn.vue (Static Viewer)

1. **Fetches BPMN XML**: Loads `.bpmn` files from the `public/` folder via fetch
2. **Renders using bpmn-js**: Creates an off-screen DOM container (1920x1080) to render the diagram
3. **Exports to SVG**: Extracts the rendered SVG from bpmn-js viewer
4. **Injects into template**: Inserts the SVG with responsive sizing into the component's DOM

### DMN components (`components/dmn/`)

- **`DmnDrd.vue`** — Static SVG rendering of the Decision Requirements Diagram. Same off-screen approach as `Bpmn.vue`: imports the XML, opens the `drd` view and calls `saveSVG()` on the active viewer.
- **`DmnTable.vue`** — Renders a decision table **directly in the DOM**, because decision tables are HTML, not SVG. Opens the table selected by `decisionId` (or the first one). Renders from both `onMounted` and `onSlideEnter` so PDF export and live preview both work.
- **`DmnSimulate.vue`** — Decision table plus an input form. Parses the table with `parseDecisionModelFromXml` and evaluates it with `evaluateDecision`, both from the external [`@emaarco/dmn-js-simulation`](https://github.com/emaarco/dmn-simulation) package (FEEL via `feelin`, full DMN hit-policy set). Reported rules get the `sim-match` class, rules that matched but were dropped by the hit policy get `sim-candidate`. One demo slide per hit policy lives in the appendix of `example.md` (`public/hit-policies/*.dmn`).
- **`DmnModeler.vue`** — Read-only DRD thumbnail in the slide plus a fullscreen `dmn-js/lib/Modeler` in a `<Teleport>` overlay. On close, `saveXML()` is compared to the loaded XML and the thumbnail re-renders if it changed. With `engine="camunda"` it mounts `dmn-js-properties-panel`; the config from `plugins/dmn/engines/camunda.ts` is nested under the modeler's **`drd:` key** (dmn-js modelers are composed of per-view editors), with `moddleExtensions` at the top level. Without a `dmnFilePath` it imports a blank DMN template.

### Team Topologies, Wardley Maps and Event Storming

Each notation has two thin components under `components/<notation>/` and one adapter file under
`plugins/<notation>/` (`teamTopologiesDiagram.ts`, `wardleyMap.ts`, `eventStormingBoard.ts`). The
adapter exports three things:

- `export<Notation>Svg(source, container)` — creates the renderer's read-only `Viewer` in the
  off-screen container, imports the source, returns `saveSVG()`, destroys the viewer.
- `open<Notation>Modeler(source, container)` — creates the renderer's `Modeler` and returns a
  session with `exportSource()` and `destroy()`.
- `blank<Notation>` — the source a modeler starts from when no file path is given.

The static component (`TeamTopologies.vue`, …) passes `exportSvg` to `shared/ui/StaticDiagram.vue`.
The modeler component (`TeamTopologiesModeler.vue`, …) passes all three plus the renderer's
stylesheet to `shared/ui/DiagramModeler.vue`, which shows a `StaticDiagram` preview, opens the
modeler fullscreen on Edit and feeds the exported source back into the preview on Close.

- **Team Topologies** files are JSON. They are validated with `parseDocument` from
  `@miragon/team-topologies-schema-model` before `importDocument()` and written back with
  `serializeDocument()`.
- **Wardley Maps** (OWM text) and **Event Storming** boards (`.storm` text) go through
  `importDSL()` / `exportDSL()`.
- The read-only `Viewer` of `@miragon/wardley-renderer` 0.6.2 and
  `@miragon/event-storming-renderer` 0.2.2 clears a `commandStack` on import without registering
  one, so both adapters pass diagram-js's command module via `additionalModules`. Drop that
  once the renderers register it themselves; each static component has a test guarding it.
- **Renderer stylesheets are only applied while a modeler is open.** They style `.djs-palette` and
  other diagram-js classes globally, so loading several of them at once breaks each other's palette
  and the BPMN/DMN modelers. The modeler components import the CSS with `?inline` and
  `DiagramModeler` attaches it on open and removes it on close. The static viewers need no CSS:
  `saveSVG()` returns a self-contained SVG.
- **Key strokes:** the renderers handle shortcuts on `document`, Slidev navigates on `window`. While
  a modeler is open, `DiagramModeler` stops `keydown` at `document` so Delete, undo and the arrow
  keys reach the modeler without changing the slide.

### Key Implementation Details

- `Bpmn.vue`, `DmnDrd.vue`, the three static viewers and the previews of their modelers use an **off-screen rendering approach** because diagram-js requires a DOM element to render. All but `DmnDrd.vue` share `shared/lib/renderStaticSvg.ts`
- The off-screen container has a **fixed 1920x1080 size** — this may clip large diagrams or waste space for small ones
- SVG sizing is controlled via `maxWidth` and `height` style properties with `preserveAspectRatio="xMidYMid meet"` for responsive scaling
- `renderStaticSvg` gives every id in an exported SVG a per-render suffix. The Event Storming renderer uses a fixed id for its sticky shadow filter; with two boards in one deck, `url(#id)` would otherwise resolve to the first board and stop rendering once that slide is hidden
- Diagram file paths are resolved relative to `window.location.origin + import.meta.env.BASE_URL` (`shared/lib/useDiagramFile.ts`)
- `fitDiagram` lets a small diagram grow up to 2× by default. BPMN components expose that cap as the `maxScale` prop; `DmnModeler.vue` passes `1` so a DRD thumbnail is never enlarged past its native size
- The `engine` props are typed per modeler (`plugins/bpmn/engines/types.ts`: `'zeebe' | 'camunda7'`, `plugins/dmn/engines/types.ts`: `'camunda'`)

### Vite Configuration

The `vite.config.ts` file is **critical** for this addon to work. It lists the bpmn-js and dmn-js entry points (viewer, modeler, properties panels, simulation) and the Miragon renderers in Vite's dependency optimization to prevent runtime module resolution issues in Slidev projects.

## Package Distribution

The npm package includes only:
- `components/` directory (`bpmn/*.vue`, `dmn/*.vue`, `team-topologies/*.vue`, `wardley-maps/*.vue`, `event-storming/*.vue`)
- `plugins/` directory (`bpmn/engines/*`, `dmn/engines/*`, and one adapter file each for `team-topologies`, `wardley-maps`, `event-storming`)
- `shared/` directory (`ui/*.vue`, `lib/*.ts`)
- `vite.config.ts` (required Vite configuration)

Everything else (`example.md`, `public/`, `docs/`, `setup/`, `tests/`) is excluded via the `files` field in package.json.

## Testing

`npm test` runs the vitest suites under `tests/`. Use `example.md` as the manual test deck — it demonstrates every component with sample diagrams (`public/newsletter.bpmn`, `public/example.dmn`, `public/hit-policies/*.dmn`, `public/online-shop.tt`, `public/tea-shop.owm`, `public/order-checkout.storm`).

## Development Process
- When working with this repository, always use semantic commit-messages (e.g. feat: add bpmn component)

## Release & Publishing

Releases are automated by the single `release-please.yml` workflow, built on
[release-please](https://github.com/googleapis/release-please). Land conventional
commits on `main` (`feat:`, `fix:`, `feat!:`) — release-please opens a
`chore(main): release X.Y.Z` PR with the version bump and `CHANGELOG.md` diff. Merging that
PR tags the commit and publishes a GitHub Release; the same workflow then runs its gated
`publish` job (`npm publish --provenance`) and `deploy-pages` job (publish the example to
GitHub Pages). The workflow exposes a `dry_run` input via `workflow_dispatch` that runs a
`publish-dry-run` job (`npm publish --dry-run`) without creating a release or publishing.
