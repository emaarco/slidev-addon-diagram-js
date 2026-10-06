# DMN

[← Back to the overview](../README.md)

![Example DMN diagram in Slidev](./dmn-example.png)

Four components for DMN decisions: a static DRD viewer, a decision-table renderer, a live table simulator, and a full modeler.

## `<DmnDrd>` — Static DRD viewer

Renders Decision Requirements Diagrams as static SVG images. Perfect for PDF exports and presentations.

```vue
<DmnDrd
  dmnFilePath="./my-decisions.dmn"
  width="100%"
  height="400px"
/>
```

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `dmnFilePath` | `string` | *required* | Path to the `.dmn` file (relative to `public/`) |
| `width` | `string` | `'100%'` | Maximum width of the diagram |
| `height` | `string` | `'auto'` | Height of the diagram |
| `fontSize` | `string` | `'12px'` | Font size of the diagram labels |

## `<DmnTable>` — Decision table

Renders DMN Decision Tables directly in the slide. Perfect for presenting business rules and decision logic.

```vue
<DmnTable
  dmnFilePath="./my-decisions.dmn"
  width="100%"
  decisionId="Decision_Dish"
/>
```

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `dmnFilePath` | `string` | *required* | Path to the `.dmn` file (relative to `public/`) |
| `width` | `string` | `'100%'` | Width of the table container |
| `height` | `string` | `'auto'` | Height of the table container (defaults to 500px when 'auto') |
| `decisionId` | `string` | *first found* | ID of the decision to display (optional, defaults to the first decision table) |
| `fontSize` | `string` | `'12px'` | Font size of the table content |
| `showAnnotations` | `boolean` | `false` | Show or hide the annotations column |
| `showDrdButton` | `boolean` | `false` | Show or hide the built-in "View DRD" button |

## `<DmnSimulate>` — Live decision simulation

Renders a Decision Table together with an input form and evaluates it live. Pick the inputs, hit **Simulate**, and the matching rule row is highlighted while the resulting output is shown below the table. Because DMN is declarative (no wandering token like BPMN), this is the DMN equivalent of a token simulation: feed inputs in, watch which rule fires. Evaluation (FEEL matching + hit policies) is powered by the [`@emaarco/dmn-js-simulation`](https://github.com/emaarco/dmn-simulation) package, which evaluates FEEL expressions with the [feelin](https://github.com/nikku/feelin) engine.

Use the **Fullscreen** button next to the form to blow the whole simulation up to the full viewport — handy for wide tables in workshops. Press **Escape** or click **Exit** to return to the slide; the current inputs and result are preserved.

```vue
<DmnSimulate
  dmnFilePath="./my-decisions.dmn"
  width="100%"
  height="340px"
/>
```

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `dmnFilePath` | `string` | *required* | Path to the `.dmn` file (relative to `public/`) |
| `width` | `string` | `'100%'` | Width of the container |
| `height` | `string` | `'340px'` | Height of the decision table |
| `decisionId` | `string` | *first found* | ID of the decision to simulate (defaults to the first decision table) |
| `fontSize` | `string` | `'12px'` | Font size of the table content in the slide |
| `fullscreenFontSize` | `string` | `'12px'` | Font size of the table content in fullscreen (raise it so the table reads from the back of the room) |
| `showAnnotations` | `boolean` | `false` | Show or hide the annotations column |
| `showDrdButton` | `boolean` | `false` | Show or hide the built-in "View DRD" button |

> **Hit policies:** the full DMN set is supported — `UNIQUE`, `ANY`, `PRIORITY`, `FIRST`, `COLLECT` (incl. `SUM`/`MIN`/`MAX`/`COUNT` aggregation), `RULE ORDER` and `OUTPUT ORDER`. The rule(s) the policy actually reports are highlighted strongly; rules that merely matched but were dropped (e.g. under `FIRST`/`PRIORITY`) are shown as faint candidates. `PRIORITY` and `OUTPUT ORDER` use the output's `<outputValues>` list as the priority order. `UNIQUE`/`ANY` show a violation badge when their constraint is broken. Input cells are evaluated as FEEL unary tests via [feelin](https://github.com/nikku/feelin); an empty cell matches any value.
>
> The appendix of the [`example.md`](../example.md) deck includes one slide per hit policy (`public/hit-policies/*.dmn`) demonstrating each behaviour live.

## `<DmnModeler>` — Live modeler

Embeds an interactive DMN modeler for live editing. A thumbnail of the DRD is shown in the slide; clicking **Edit** opens the model fullscreen where you can rearrange the DRD and double-click a decision to edit its table. On **Close**, any changes are reflected back in the slide thumbnail. Ideal for workshops, trainings, and collaborative sessions.

```vue
<DmnModeler
  dmnFilePath="./my-decisions.dmn"
  width="100%"
  height="500px"
/>
```

Or start with a blank canvas:

```vue
<DmnModeler height="500px" />
```

Pass `engine="camunda"` to mount the Camunda properties panel side-by-side with the canvas, so you can edit ids, names, and Camunda-specific execution properties live:

```vue
<DmnModeler dmnFilePath="./my-decisions.dmn" engine="camunda" height="500px" />
```

In fullscreen mode, the panel can be hidden and shown again via the toolbar — handy when you need the full canvas width.

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `dmnFilePath` | `string` | — | Optional path to a `.dmn` file (relative to `public/`). Omit for a blank diagram. |
| `width` | `string` | `'100%'` | Width of the modeler container |
| `height` | `string` | `'500px'` | Height of the modeler container |
| `engine` | `'camunda'` | — | Optional engine. Mounts a `dmn-js-properties-panel` configured for Camunda. Omit for a panel-less modeler. |
