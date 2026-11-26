# BPMN

[← Back to the overview](../README.md)

![Example BPMN diagram in Slidev](./bpmn-example.png)

Four components for BPMN 2.0 processes: a static viewer for exports, an animated token simulation for walkthroughs, a path simulation for what-if questions, and a live modeler for workshops.

## `<Bpmn>` — Static viewer

Renders BPMN diagrams as static SVG images. Perfect for PDF exports and presentations.

```vue
<Bpmn
  bpmnFilePath="./my-process.bpmn"
  width="100%"
  height="400px"
/>
```

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `bpmnFilePath` | `string` | *required* | Path to the `.bpmn` file (relative to `public/`) |
| `width` | `string` | `'100%'` | Maximum width of the diagram |
| `height` | `string` | `'auto'` | Height of the diagram |
| `theme` | `'light' \| 'dark'` | the deck's mode | Unset, the diagram follows the deck: dark while `<html>` has the `dark` class (Slidev's dark mode), light otherwise, redrawn when it switches. `'light'` or `'dark'` pins it. `'dark'` draws strokes and labels light on transparent fills, for dark slides. Colours set on elements in the model are kept. |

## `<BpmnTokenSimulation>` — Token simulation

Renders interactive BPMN diagrams with token simulation capabilities. Perfect for process walkthroughs and training — step through the execution with an animated token flow.

```vue
<BpmnTokenSimulation
  bpmnFilePath="./my-process.bpmn"
  width="100%"
  height="500px"
/>
```

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `bpmnFilePath` | `string` | *required* | Path to the `.bpmn` file (relative to `public/`) |
| `width` | `string` | `'100%'` | Width of the diagram container |
| `height` | `string` | `'auto'` | Height of the diagram container (defaults to 500px when 'auto') |
| `fullscreen` | `boolean` | `true` | Show the button that expands the simulation to fullscreen |
| `theme` | `'light' \| 'dark'` | the deck's mode | Unset, the diagram follows the deck: dark while `<html>` has the `dark` class (Slidev's dark mode), light otherwise, redrawn when it switches. `'light'` or `'dark'` pins it. `'dark'` draws strokes and labels light on transparent fills, for dark slides. Colours set on elements in the model are kept. The fullscreen view stays light. |
| `maxScale` | `number` | `2` | Cap on how far a small diagram is enlarged past its native size. Lower keeps it smaller; higher lets it fill more. |
| `propertiesPanelOpen` | `boolean` | `false` | Shows the properties panel expanded when the modeler opens. It starts collapsed by default; the toolbar button toggles it either way. |

## `<BpmnPathSimulation>` — Path simulation

Shows which path a process takes for given data, without a token or an instance: the exclusive and inclusive gateways evaluate their conditions at once, the path is drawn in blue and everything off it fades. Change a variable and the path follows. It uses the path simulation of [`@emaarco/bpmn-js-data-simulation`](https://github.com/emaarco/bpmn-js-data-simulation/blob/main/docs/usage.md#path-simulation-what-if) and needs no token simulation, so it also fits a narrow column.

```vue
<BpmnPathSimulation
  bpmnFilePath="./bike-order.bpmn"
  engine="zeebe"
  :variables="{ orderTotal: 6800, creditworthy: true }"
  height="300px"
/>
```

Below the diagram, a control for every variable the conditions read lets you change the data live: a switch for a boolean, a slider for a number (up to twice the largest number it is compared with), a text field otherwise. Start from a scenario file instead of `variables` and a dropdown switches between its scenarios:

```vue
<BpmnPathSimulation bpmnFilePath="./bike-order.bpmn" scenariosFilePath="./bike-order.scenarios.json" />
```

For a fixed story, give `steps`: every slide click applies the next set of variables, so the path changes click by click and the PDF export shows each step:

```vue
<BpmnPathSimulation
  bpmnFilePath="./bike-order.bpmn"
  :variables="{ orderTotal: 1290, creditworthy: true, approved: true, insurance: false, accessories: [] }"
  :steps="[{ orderTotal: 6800 }, { insurance: true, accessories: ['lock'] }]"
  controls="none"
  showDecisions
/>
```

`measures` sums a numeric attribute of the elements on the path, for example a lead time. Declare its namespace in the model (`xmlns:sim="http://example.org/simulation"`) and set it on the tasks (`<bpmn:task sim:duration="2">`); elements without it count as 0:

```vue
<BpmnPathSimulation bpmnFilePath="./bike-order.bpmn" :measures="{ 'Lead time (days)': 'sim:duration' }" />
```

Mappings and task results are not applied along the path, so pass every variable the conditions read (a scenario's task results are run through the output mappings once, when it is picked). Gateways whose condition cannot be evaluated stop the path; `showDecisions` tells why.

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `bpmnFilePath` | `string` | *required* | Path to the `.bpmn` file (relative to `public/`) |
| `engine` | `'zeebe' \| 'camunda7'` | `'zeebe'` | How conditions are read: FEEL for Zeebe, the JUEL subset for Camunda 7 |
| `variables` | `object` | `{}` | The variables to start from. A scenario overrides them. |
| `scenariosFilePath` | `string` | — | A [scenario file](https://github.com/emaarco/bpmn-js-data-simulation/blob/main/docs/scenarios.md) to start from its first scenario, with a dropdown when it holds several |
| `controls` | `'auto' \| 'none' \| string[]` | `'auto'` | Which variables get a control: every variable the conditions read, none, or the listed ones |
| `steps` | `object[]` | — | Variables applied one slide click after the other, each on top of the ones before |
| `measures` | `Record<string, string>` | — | Label → numeric attribute summed along the path, e.g. `{ 'Lead time (days)': 'sim:duration' }` |
| `showDecisions` | `boolean` | `false` | Lists each gateway on the path with the flows it took, or why it could not decide |
| `width` | `string` | `'100%'` | Width of the component |
| `height` | `string` | `'400px'` | Height of the diagram; the controls sit below it |
| `maxScale` | `number` | `2` | Cap on how far a small diagram is enlarged past its native size |
| `theme` | `'light' \| 'dark'` | the deck's mode | Unset, the diagram follows the deck. `'dark'` draws the diagram for dark slides and the path in a lighter blue. |

The path colour is `--bds-path-taken`, the fade of everything else `--bds-path-skipped-opacity`. The controls take their colours from `--bpmn-path-text`, `--bpmn-path-muted`, `--bpmn-path-border`, `--bpmn-path-surface`, `--bpmn-path-accent` and `--bpmn-path-danger`; set them on any ancestor to match a deck theme.

## `<BpmnModeler>` — Live modeler

Embeds an interactive BPMN modeler for live diagram editing. Ideal for workshops, trainings, and collaborative sessions where you build diagrams step by step.

```vue
<BpmnModeler
  bpmnFilePath="./my-process.bpmn"
  width="100%"
  height="500px"
/>
```

Or start with a blank canvas (a single start event):

```vue
<BpmnModeler height="500px" />
```

Pass an `engine` to mount an engine-specific properties panel side-by-side with the canvas, so you can edit Zeebe `taskDefinition`s, Camunda 7 expressions, message names, and other technical attributes live:

```vue
<!-- Camunda 8 / Zeebe -->
<BpmnModeler bpmnFilePath="./my-process.bpmn" engine="zeebe" height="500px" />

<!-- Camunda 7 / Platform -->
<BpmnModeler bpmnFilePath="./my-process.bpmn" engine="camunda7" height="500px" />
```

In fullscreen mode, the panel can be hidden and shown again via the toolbar — handy when you need the full canvas width.

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `bpmnFilePath` | `string` | — | Optional path to a `.bpmn` file (relative to `public/`). Omit for a blank diagram. |
| `width` | `string` | `'100%'` | Width of the modeler container |
| `height` | `string` | `'500px'` | Height of the modeler container |
| `engine` | `'zeebe' \| 'camunda7'` | — | Optional engine. Mounts a `bpmn-js-properties-panel` configured for the chosen engine. Omit for a panel-less modeler. |
| `maxScale` | `number` | `2` | Cap on how far a small diagram is enlarged past its native size (e.g. a lone start event on a blank canvas). Lower keeps it smaller; higher lets it fill more. |
| `tokenSimulation` | `boolean` | `false` | Adds the token simulation to the modeler |
| `transactionBoundaries` | `boolean` | `false` | Overlays Camunda 7 transaction boundaries as bars across the sequence flows, in Miragon blue (`#335DE5`, `#6B8AFF` with `theme="dark"`), overridable via `--transaction-boundary-background-color`. Only takes effect with `engine="camunda7"`. |
| `theme` | `'light' \| 'dark'` | the deck's mode | Unset, the diagram follows the deck: dark while `<html>` has the `dark` class (Slidev's dark mode), light otherwise, redrawn when it switches. `'light'` or `'dark'` pins it. `'dark'` draws strokes and labels light on transparent fills, for dark slides. Colours set on elements in the model are kept. The fullscreen modeler follows: canvas, palette, menus and properties panel. |
