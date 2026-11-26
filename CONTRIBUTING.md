# Contributing

Thanks for helping with slidev-addon-diagram-js! Bug reports, ideas and pull requests are all welcome. For a larger change, open an [issue](https://github.com/emaarco/slidev-addon-diagram-js/issues) first so we can agree on the approach.

## Set up

You need Node 20 or newer.

```bash
git clone https://github.com/emaarco/slidev-addon-diagram-js.git
cd slidev-addon-diagram-js
npm install
```

The example deck (`example.md`) demonstrates every component and is the manual test deck. The dev server runs behind [portless](https://portless.sh), a pinned devDependency, for a stable `.localhost` URL that also works per git worktree. Install its proxy once per machine (needs sudo once):

```bash
npx portless service install
```

Then start the deck:

```bash
npm run dev        # via portless → https://slidev-addon-diagram-js.localhost
                   # (in a git worktree → https://<worktree>.slidev-addon-diagram-js.localhost)
npm run dev:app    # or run the Slidev server directly, without portless
```

The sample diagrams live in `public/`.

## Checks

The `Build` workflow runs these on every pull request; run them locally before you push:

| Command | What it checks |
|---|---|
| `npm run lint` | oxlint: correctness rules and the class-first rules of `tools/oxlint/` |
| `npm run lint:deps` | dependency-cruiser: module boundaries from `.dependency-cruiser.cjs` |
| `npm run knip` | unused files, exports and dependencies |
| `npm run lint:bpmn` | bpmnlint: the demo models in `public/` against the strict Miragon rules |
| `npm test` | the vitest suites under `tests/` |
| `npm run build` | builds the example deck |

`npm run export` and `npm run screenshot` export the example deck to PDF and PNG, which is the quickest way to check the static viewers.

## Project layout

| Folder | Holds |
|---|---|
| `components/<notation>/` | the public Vue components; Slidev registers every file here as a global, so nothing else may live there |
| `src/<notation>/` | one notation class per role, implementing the interfaces in `src/shared/lib/notation.ts` |
| `src/shared/` | the diagram-js infrastructure every notation uses |
| `tests/` | mirrors `components/` and `src/` |
| `docs/` | one page per notation, linked from the README |

Imports only point down (`components/` → `src/<notation>/` → `src/shared/`), and one notation never imports another. Adding a notation means a `components/<name>/` folder, a `src/<name>/` notation class, its entries in `vite.config.ts` `optimizeDeps.include` and tests; `src/wardley-maps/` is the smallest example. [CLAUDE.md](./CLAUDE.md) describes the architecture in detail.

## Pull requests

- Write the PR title as a [Conventional Commit](https://www.conventionalcommits.org/) (`feat: …`, `fix: …`, `docs: …`); the `PR Title` workflow checks it, and it becomes the commit message on squash merge.
- Add or update tests for behaviour you change, and update the notation's page in `docs/` when its props change.
- Visible changes are easiest to review with a screenshot of the example deck.

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please). Conventional commits on `main` feed a release PR with the version bump and changelog; merging it tags the release, publishes to npm with provenance and deploys the example deck to GitHub Pages.

To try a change in a real deck before it is released, run the `Release` workflow manually on the branch with a `beta_version` such as `2.2.0-beta.0`. It publishes that branch under the `beta` dist-tag without moving `latest`; a deck then pins the exact version (`npm i slidev-addon-diagram-js@2.2.0-beta.0`).
