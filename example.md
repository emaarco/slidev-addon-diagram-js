---
theme: '@miragon/slidev-toolkit'
colorSchema: light
highlighter: shiki
transition: slide-up
layout: cover
eyebrow: Slidev Addon
---

# Diagrams in **Slidev**

Drop your model files straight into the deck. No screenshots, no manual exports.

---
layout: hero
eyebrow: Why this addon
accent: blue
---

# Model once, embed the **real** diagram.

Static SVG, live simulation, or an editable modeler; rendered from the file your modeler saves.

---
layout: content
title: One addon, five notations
eyebrow: Overview
accent: blue
---

Every notation is rendered from its source file. Pick the component that fits the moment.

| Notation | Static | Simulation | Modeler |
|---|---|---|---|
| BPMN | `Bpmn` | `BpmnTokenSimulation` | `BpmnModeler` |
| DMN | `DmnDrd`, `DmnTable` | `DmnSimulate` | `DmnModeler` |
| Team Topologies | `TeamTopologies` | | `TeamTopologiesModeler` |
| Wardley Maps | `WardleyMap` | | `WardleyMapModeler` |
| Event Storming | `EventStorming` | | `EventStormingModeler` |

---
layout: content
title: Follows the deck's dark mode
eyebrow: Overview
accent: blue
---

<script setup>
function toggleDeckDarkMode() {
  document.documentElement.classList.toggle('dark')
}
</script>

Without a `theme`, every diagram is dark while `<html>` has the `dark` class (Slidev's dark mode) and redraws when it switches. <button class="dark-mode-toggle" @click="toggleDeckDarkMode">Toggle dark mode</button>

<div class="dark-mode-demo">
  <Bpmn bpmnFilePath="/newsletter.bpmn" height="260px" />
  <TeamTopologies teamTopologiesFilePath="/online-shop.tt" height="260px" />
</div>

<style>
.dark-mode-toggle {
  padding: 2px 10px;
  border: 1px solid currentColor;
  border-radius: 6px;
  font-size: 0.8em;
}

.dark-mode-demo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
  padding: 8px;
  border-radius: 12px;
}

html.dark .dark-mode-demo {
  background: #1e1e1e;
}
</style>

---
layout: section
eyebrow: Processes
accent: blue
---

# BPMN

A static diagram, an animated token flow, or a live modeler for your processes.

---
layout: bpmn
title: Static BPMN diagrams
eyebrow: Bpmn
accent: blue
diagram: /newsletter.bpmn
mode: static
height: 300px
---

Rendered as a clean, static SVG. Best for PDF exports and print.

---
layout: content
title: The Bpmn component
eyebrow: Bpmn
accent: blue
---

Renders a `.bpmn` file as a static, inline SVG. Ideal for print and PDF export.

| Prop | Type | Description |
|---|---|---|
| `bpmnFilePath` | string | Path to the file (required) |
| `width` | string | Canvas width (default 100%) |
| `height` | string | Canvas height (default auto) |

`<Bpmn bpmnFilePath="/newsletter.bpmn" height="300px" theme="dark" />`

---
layout: bpmn
title: Interactive token simulation
eyebrow: Bpmn-Token-Simulation
accent: blue
diagram: /newsletter.bpmn
mode: token
height: 325px
---

Animated token flow makes the process instantly clear to your audience.

---
layout: content
title: The BpmnTokenSimulation component
eyebrow: Bpmn-Token-Simulation
accent: blue
---

Plays an animated token through the process, with a built-in fullscreen view.

| Prop | Type | Description |
|---|---|---|
| `bpmnFilePath` | string | Path to the file (required) |
| `fullscreen` | boolean | Show the expand button (default true) |
| `maxScale` | number | Cap the auto-zoom factor |
| `height` | string | Canvas height (default auto) |

`<BpmnTokenSimulation bpmnFilePath="/newsletter.bpmn" height="325px" />`

---
layout: content
title: Data simulation (Zeebe)
eyebrow: Bpmn-Token-Simulation
accent: blue
---

With `engine="zeebe"`, FEEL conditions and io mappings decide the path.

<BpmnTokenSimulation bpmnFilePath="/bike-order.bpmn" engine="zeebe" scenariosFilePath="/bike-order.scenarios.json" height="320px" />

---
layout: content
title: Data simulation (Camunda 7)
eyebrow: Bpmn-Token-Simulation
accent: blue
---

With `engine="camunda7"`, the scenario mocks the score and JUEL picks the flow.

<BpmnTokenSimulation bpmnFilePath="/loan-approval.bpmn" engine="camunda7" scenariosFilePath="/loan-approval.scenarios.json" height="320px" />

---
layout: content
title: Dark theme
eyebrow: Bpmn
accent: blue
---

With `theme="dark"`, strokes and labels turn light on transparent fills, for dark slides.

<div style="background: #1e1e1e; border-radius: 12px; padding: 8px">
  <Bpmn bpmnFilePath="/newsletter.bpmn" height="300px" theme="dark" />
</div>

---
layout: bpmn
title: Live BPMN modeler
eyebrow: Bpmn-Modeler
accent: blue
diagram: /newsletter.bpmn
mode: modeler
engine: zeebe
height: 325px
---

Edit the diagram live in a workshop, with an engine-specific properties panel.

---
layout: content
title: The BpmnModeler component
eyebrow: Bpmn-Modeler
accent: blue
---

A full modeler canvas for workshops. Set an `engine` for its properties panel.

| Prop | Type | Description |
|---|---|---|
| `bpmnFilePath` | string | Path to the file (omit for blank canvas) |
| `engine` | zeebe / camunda7 | Adds the matching properties panel |
| `tokenSimulation` | boolean | Token flow inside the modeler |
| `transactionBoundaries` | boolean | Overlay Camunda 7 boundaries |

`<BpmnModeler bpmnFilePath="/newsletter.bpmn" engine="zeebe" height="325px" />`

---
layout: content
title: Dark theme
eyebrow: Bpmn-Modeler
accent: blue
---

With `theme="dark"`, the fullscreen modeler behind Edit turns dark too: canvas, palette, menus and properties panel.

<div style="background: #1e1e1e; border-radius: 12px; padding: 8px">
  <BpmnModeler bpmnFilePath="/newsletter.bpmn" engine="zeebe" tokenSimulation height="300px" theme="dark" />
</div>

---
layout: section
eyebrow: Decisions
accent: blue
---

# DMN

A requirement diagram, a decision table, a live simulation, or a modeler for your decisions.

---
layout: dmn
title: Static requirement diagrams
eyebrow: Dmn-Drd
accent: blue
diagram: /example.dmn
mode: drd
height: 300px
fontSize: 11px
---

The Decision Requirements Diagram as a clean static SVG. Ideal for print and PDF.

---
layout: content
title: The DmnDrd component
eyebrow: Dmn-Drd
accent: blue
---

Renders the DRD of a `.dmn` file as a static, inline SVG. Ideal for print and PDF export.

| Prop | Type | Description |
|---|---|---|
| `dmnFilePath` | string | Path to the file (required) |
| `width` | string | Canvas width (default 100%) |
| `height` | string | Canvas height (default auto) |
| `fontSize` | string | Diagram font size (default 12px) |

`<DmnDrd dmnFilePath="/example.dmn" height="300px" />`

---
layout: content
title: Dark theme
eyebrow: Dmn-Drd
accent: blue
---

With `theme="dark"`, strokes and labels of the DRD turn light, for dark slides.

<div style="background: #1e1e1e; border-radius: 12px; padding: 8px">
  <DmnDrd dmnFilePath="/example.dmn" height="300px" theme="dark" />
</div>

---
layout: dmn
title: Static decision tables
eyebrow: Dmn-Table
accent: blue
diagram: /example.dmn
mode: table
height: 275px
fontSize: 10px
---

The decision table itself, every rule laid out row by row.

---
layout: content
title: The DmnTable component
eyebrow: Dmn-Table
accent: blue
---

Renders a decision table directly as HTML, so the rules stay crisp and readable.

| Prop | Type | Description |
|---|---|---|
| `dmnFilePath` | string | Path to the file (required) |
| `decisionId` | string | Which decision to show (default first found) |
| `showAnnotations` | boolean | Show the annotations column (default false) |
| `showDrdButton` | boolean | Add a View DRD button (default false) |
| `fontSize` | string | Table font size (default 12px) |
| `height` | string | Canvas height (default auto) |

`<DmnTable dmnFilePath="/example.dmn" height="340px" />`

---
layout: dmn
title: Live decision simulation
eyebrow: Dmn-Simulate
accent: green
diagram: /example.dmn
mode: simulate
height: 225px
fontSize: 9px
---

Pick the inputs, run the decision, watch the matching rule light up.

---
layout: content
title: The DmnSimulate component
eyebrow: Dmn-Simulate
accent: green
---

Simulate a decision. Feed inputs in, evaluate them with FEEL, and highlight the firing rule.

| Prop | Type | Description |
|---|---|---|
| `dmnFilePath` | string | Path to the file (required) |
| `decisionId` | string | Which decision to evaluate (default first found) |
| `showDrdButton` | boolean | Add a View DRD button (default false) |
| `showAnnotations` | boolean | Show the annotations column (default false) |
| `fullscreenFontSize` | string | Table font size in fullscreen (default 12px) |
| `fontSize` | string | Table font size (default 12px) |

`<DmnSimulate dmnFilePath="/example.dmn" height="300px" />`

---
layout: content
title: Dark theme
eyebrow: Dmn-Table
accent: blue
---

With `theme="dark"`, decision tables turn light on dark, for dark slides.

<div style="background: #1e1e1e; border-radius: 12px; padding: 8px">
  <DmnTable dmnFilePath="/example.dmn" height="300px" theme="dark" />
</div>

---
layout: content
title: Dark theme
eyebrow: Dmn-Simulate
accent: green
---

`<DmnSimulate>` takes the same `theme="dark"`: form, highlighted rules and result follow along.

<div style="background: #1e1e1e; border-radius: 12px; padding: 8px">
  <DmnSimulate dmnFilePath="/example.dmn" height="150px" fontSize="10px" theme="dark" />
</div>

---
layout: dmn
title: Live DMN modeler
eyebrow: Dmn-Modeler
accent: blue
diagram: /example.dmn
mode: modeler
engine: camunda
height: 320px
---

Edit the decision live in a workshop, with an optional Camunda properties panel.

---
layout: content
title: The DmnModeler component
eyebrow: Dmn-Modeler
accent: blue
---

A full modeler canvas for workshops. Omit the file for a blank canvas, or set an `engine` for its properties panel.

| Prop | Type | Description |
|---|---|---|
| `dmnFilePath` | string | Path to the file (omit for a blank canvas) |
| `engine` | camunda | Adds the Camunda properties panel |
| `width` | string | Canvas width (default 100%) |
| `height` | string | Canvas height (default 500px) |

`<DmnModeler dmnFilePath="/example.dmn" engine="camunda" height="320px" />`

---
layout: content
title: Dark theme
eyebrow: Dmn-Modeler
accent: blue
---

With `theme="dark"`, the DRD preview turns light on dark, and the fullscreen modeler follows: requirement diagram, decision tables and properties panel.

<div style="background: #1e1e1e; border-radius: 12px; padding: 8px">
  <DmnModeler dmnFilePath="/example.dmn" engine="camunda" height="300px" theme="dark" />
</div>

---
layout: section
eyebrow: Teams
accent: blue
---

# Team Topologies

A static diagram or a live modeler for your teams and how they interact.

---
layout: mermaid
title: Static Team Topologies diagrams
eyebrow: Team-Topologies
accent: blue
---

<TeamTopologies teamTopologiesFilePath="/online-shop.tt" height="300px" />

::caption::

Rendered as a clean, static SVG. Best for PDF exports and print.

---
layout: content
title: The TeamTopologies component
eyebrow: Team-Topologies
accent: blue
---

Renders a Team Topologies document as a static, inline SVG. Ideal for print and PDF export.

| Prop | Type | Description |
|---|---|---|
| `teamTopologiesFilePath` | string | Path to the file (required) |
| `width` | string | Canvas width (default 100%) |
| `height` | string | Canvas height (default auto) |
| `theme` | light / dark | Light lines and text for dark slides |

`<TeamTopologies teamTopologiesFilePath="/online-shop.tt" height="300px" />`

---
layout: content
title: Dark theme
eyebrow: Team-Topologies
accent: blue
---

With `theme="dark"`, text, lines and grid turn light on a dark canvas. Notation colours stay as they are.

<div style="background: #1e1e1e; border-radius: 12px; padding: 8px">
  <TeamTopologies teamTopologiesFilePath="/online-shop.tt" height="300px" theme="dark" />
</div>

---
layout: mermaid
title: Live Team Topologies modeler
eyebrow: Team-Topologies-Modeler
accent: blue
---

<TeamTopologiesModeler teamTopologiesFilePath="/online-shop.tt" height="300px" />

::caption::

Edit the diagram live in a workshop. The preview picks up your changes when you close the modeler.

---
layout: content
title: The TeamTopologiesModeler component
eyebrow: Team-Topologies-Modeler
accent: blue
---

A preview in the slide and a full modeler behind the Edit button. Edits show up in the preview once you close it.

| Prop | Type | Description |
|---|---|---|
| `teamTopologiesFilePath` | string | Path to the file (omit for a blank canvas) |
| `width` | string | Canvas width (default 100%) |
| `height` | string | Canvas height (default 500px) |
| `theme` | light / dark | Dark preview and fullscreen modeler |

`<TeamTopologiesModeler teamTopologiesFilePath="/online-shop.tt" height="300px" />`

---
layout: content
title: Dark theme
eyebrow: Team-Topologies-Modeler
accent: blue
---

With `theme="dark"`, the fullscreen modeler behind Edit turns dark too: canvas, palette and context pad.

<div style="background: #1e1e1e; border-radius: 12px; padding: 8px">
  <TeamTopologiesModeler teamTopologiesFilePath="/online-shop.tt" height="300px" theme="dark" />
</div>

---
layout: section
eyebrow: Strategy
accent: blue
---

# Wardley Maps

A static map or a live modeler for your value chain and how it evolves.

---
layout: mermaid
title: Static Wardley Maps
eyebrow: Wardley-Map
accent: blue
---

<WardleyMap wardleyMapFilePath="/tea-shop.owm" height="300px" />

::caption::

Rendered as a clean, static SVG. Best for PDF exports and print.

---
layout: content
title: The WardleyMap component
eyebrow: Wardley-Map
accent: blue
---

Renders a Wardley Map written in OWM text as a static, inline SVG. Ideal for print and PDF export.

| Prop | Type | Description |
|---|---|---|
| `wardleyMapFilePath` | string | Path to the file (required) |
| `width` | string | Canvas width (default 100%) |
| `height` | string | Canvas height (default auto) |
| `theme` | light / dark | Light lines and text for dark slides |

`<WardleyMap wardleyMapFilePath="/tea-shop.owm" height="300px" />`

---
layout: content
title: Dark theme
eyebrow: Wardley-Map
accent: blue
---

With `theme="dark"`, text, lines and grid turn light on a dark canvas. Notation colours stay as they are.

<div style="background: #1e1e1e; border-radius: 12px; padding: 8px">
  <WardleyMap wardleyMapFilePath="/tea-shop.owm" height="300px" theme="dark" />
</div>

---
layout: mermaid
title: Live Wardley Map modeler
eyebrow: Wardley-Map-Modeler
accent: blue
---

<WardleyMapModeler wardleyMapFilePath="/tea-shop.owm" height="300px" />

::caption::

Edit the diagram live in a workshop. The preview picks up your changes when you close the modeler.

---
layout: content
title: The WardleyMapModeler component
eyebrow: Wardley-Map-Modeler
accent: blue
---

A preview in the slide and a full modeler behind the Edit button. Edits show up in the preview once you close it.

| Prop | Type | Description |
|---|---|---|
| `wardleyMapFilePath` | string | Path to the file (omit for a blank canvas) |
| `width` | string | Canvas width (default 100%) |
| `height` | string | Canvas height (default 500px) |
| `theme` | light / dark | Dark preview and fullscreen modeler |

`<WardleyMapModeler wardleyMapFilePath="/tea-shop.owm" height="300px" />`

---
layout: content
title: Dark theme
eyebrow: Wardley-Map-Modeler
accent: blue
---

With `theme="dark"`, the fullscreen modeler behind Edit turns dark too: canvas, palette and context pad.

<div style="background: #1e1e1e; border-radius: 12px; padding: 8px">
  <WardleyMapModeler wardleyMapFilePath="/tea-shop.owm" height="300px" theme="dark" />
</div>

---
layout: section
eyebrow: Domains
accent: blue
---

# Event Storming

A static board or a live modeler for the events, commands and policies of your domain.

---
layout: mermaid
title: Static Event Storming boards
eyebrow: Event-Storming
accent: blue
---

<EventStorming eventStormingFilePath="/order-checkout.storm" height="300px" />

::caption::

Rendered as a clean, static SVG. Best for PDF exports and print.

---
layout: content
title: The EventStorming component
eyebrow: Event-Storming
accent: blue
---

Renders an Event Storming board as a static, inline SVG. Ideal for print and PDF export.

| Prop | Type | Description |
|---|---|---|
| `eventStormingFilePath` | string | Path to the file (required) |
| `width` | string | Canvas width (default 100%) |
| `height` | string | Canvas height (default auto) |
| `theme` | light / dark | Light lines and text for dark slides |
| `typeCaptions` | boolean | Sticky type under each text (default true) |

`<EventStorming eventStormingFilePath="/order-checkout.storm" height="300px" />`

---
layout: mermaid
title: Without type captions
eyebrow: Event-Storming
accent: blue
---

<EventStorming eventStormingFilePath="/order-checkout.storm" height="300px" :typeCaptions="false" />

::caption::

With `:typeCaptions="false"` the stickies show only their text. The colour already tells the type.

---
layout: content
title: Dark theme
eyebrow: Event-Storming
accent: blue
---

With `theme="dark"`, text, lines and grid turn light on a dark canvas. Notation colours stay as they are.

<div style="background: #1e1e1e; border-radius: 12px; padding: 8px">
  <EventStorming eventStormingFilePath="/order-checkout.storm" height="300px" theme="dark" />
</div>

---
layout: mermaid
title: Live Event Storming modeler
eyebrow: Event-Storming-Modeler
accent: blue
---

<EventStormingModeler eventStormingFilePath="/order-checkout.storm" height="300px" />

::caption::

Edit the diagram live in a workshop. The preview picks up your changes when you close the modeler.

---
layout: content
title: The EventStormingModeler component
eyebrow: Event-Storming-Modeler
accent: blue
---

A preview in the slide and a full modeler behind the Edit button. Edits show up in the preview once you close it.

| Prop | Type | Description |
|---|---|---|
| `eventStormingFilePath` | string | Path to the file (omit for a blank canvas) |
| `width` | string | Canvas width (default 100%) |
| `height` | string | Canvas height (default 500px) |
| `theme` | light / dark | Dark preview and fullscreen modeler |

`<EventStormingModeler eventStormingFilePath="/order-checkout.storm" height="300px" />`

---
layout: content
title: Dark theme
eyebrow: Event-Storming-Modeler
accent: blue
---

With `theme="dark"`, the fullscreen modeler behind Edit turns dark too: canvas, palette and context pad.

<div style="background: #1e1e1e; border-radius: 12px; padding: 8px">
  <EventStormingModeler eventStormingFilePath="/order-checkout.storm" height="300px" theme="dark" />
</div>

---
layout: section
eyebrow: Appendix
accent: green
---

# DMN hit policies

How does a table decide which rule wins when several match? DmnSimulate implements the full DMN set.

---
layout: dmn
title: UNIQUE
eyebrow: Hit Policy
accent: green
diagram: /hit-policies/unique.dmn
mode: simulate
height: 225px
fontSize: 10px
---

At most one rule may match. The ranges never overlap, so a Spend of 3000 picks exactly one tier.

---
layout: dmn
title: FIRST
eyebrow: Hit Policy
accent: green
diagram: /hit-policies/first.dmn
mode: simulate
height: 225px
fontSize: 10px
---

Rules overlap and the first match wins. An OrderTotal of 600 matches all three, but only 20 percent fires.

---
layout: dmn
title: PRIORITY
eyebrow: Hit Policy
accent: green
diagram: /hit-policies/priority.dmn
mode: simulate
height: 225px
fontSize: 10px
---

The highest-priority output wins. A Score of 550 matches all three, yet Decline wins, not the first row.

---
layout: dmn
title: ANY
eyebrow: Hit Policy
accent: green
diagram: /hit-policies/any.dmn
mode: simulate
height: 225px
fontSize: 10px
---

Several rules may match, as long as they agree. An Age of 25 matches both, and both say Granted.

---
layout: dmn
title: COLLECT
eyebrow: Hit Policy
accent: green
diagram: /hit-policies/collect.dmn
mode: simulate
height: 225px
fontSize: 10px
---

Gather all matching outputs as a list. A Cart of 250 collects every applicable promotion.

---
layout: dmn
title: COLLECT with SUM
eyebrow: Hit Policy
accent: green
diagram: /hit-policies/collect-sum.dmn
mode: simulate
height: 225px
fontSize: 10px
---

An aggregation collapses the matches into one number. A Cart of 250 sums the loyalty points to 35.

---
layout: dmn
title: RULE ORDER
eyebrow: Hit Policy
accent: green
diagram: /hit-policies/rule-order.dmn
mode: simulate
height: 225px
fontSize: 10px
---

Like COLLECT, but the list keeps the table order. A Temp of 40 returns Heat, then Extreme Heat.

---
layout: dmn
title: OUTPUT ORDER
eyebrow: Hit Policy
accent: green
diagram: /hit-policies/output-order.dmn
mode: simulate
height: 225px
fontSize: 10px
---

All matches, sorted by output priority. A Temp of 40 flips to Extreme Heat, then Heat.

---
layout: person
name: Marco Schäck
photo: /marco.png
eyebrow: The developer behind it
accent: blue
side: left
---

Open-source engineer building solutions around BPMN, DMN and process automation in general, as **emaarco**. Find me on [<carbon-logo-linkedin/>LinkedIn](https://linkedin.com/in/schaeckm), [<carbon-logo-medium />Medium](https://medium.com/@emaarco) and [<carbon-logo-github />GitHub](https://github.com/emaarco).
