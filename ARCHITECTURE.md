# Architecture

Card Pipeline is a small npm workspace for building premium trading card exports in the browser.

## Dependency Direction

`apps/card-studio` -> `packages/card-engine` -> `packages/card-schema`

The app owns workflow and user interaction. The engine owns rendering. The schema package owns shared project shapes and presets.

## Package Responsibilities

| Area | Owns | Must Avoid |
| --- | --- | --- |
| `packages/card-schema` | Types, default project data, themes, finish profiles, export presets | Browser APIs, React, Three.js |
| `packages/card-engine` | Canvas composition, Three.js materials, viewport, export rendering | App workflow state, file downloads |
| `apps/card-studio/src/domain` | Studio tabs, asset slots, template presets, project normalization | React UI rendering, WebGL rendering |
| `apps/card-studio/src/ui` | Small presentational controls | Project mutation, rendering exports |
| `apps/card-studio/src/lib` | Browser utilities | Domain decisions, React components |
| `apps/card-studio/src/App.tsx` | Screen wiring and user actions | Long-lived domain facts that belong in `domain` |

## Agent-First Rules

1. Make important knowledge discoverable in repo docs.
2. Keep `AGENTS.md` short and link to deeper docs.
3. Add mechanical checks when a rule matters more than once.
4. Prefer boring, inspectable code over hidden behavior.
5. Keep refactors small enough to verify with `npm run check`.

## Current Boundaries

The architecture check enforces the most important import rules:

- Schema cannot import app or engine code.
- Engine cannot import app code.
- Studio domain code cannot import UI or engine code.
- Studio UI code cannot import domain, engine, or schema code.
- Studio lib code cannot import React, engine, or schema code.

When a new layer is needed, update this document and `scripts/check-architecture.mjs` in the same change.
