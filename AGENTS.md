# Card Pipeline Agent Map

**MUST SEE FIRST:** this file is a map, not the full manual. Open the linked docs only when the task needs them.

## Work Order

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) before changing package boundaries.
2. Read [docs/PLANS.md](docs/PLANS.md) before starting multi-step work.
3. Run `npm run check` before handing work back.
4. Keep instructions and docs short. Add detail in focused docs, not here.

## Repo Map

- `packages/card-schema`: shared card types, presets, defaults, and validation-shaped data.
- `packages/card-engine`: canvas/WebGL rendering, exports, materials, textures, and React viewport.
- `apps/card-studio`: browser UI for editing, previewing, batching, and exporting cards.
- `docs`: source of truth for product, architecture, quality, reliability, and plans.
- `scripts`: repository checks that make rules enforceable.

## Current App Layers

- `apps/card-studio/src/domain`: project normalization, studio presets, and app facts.
- `apps/card-studio/src/ui`: reusable presentational controls.
- `apps/card-studio/src/lib`: browser utility functions.
- `apps/card-studio/src/App.tsx`: screen orchestration only.

## Rules

- Keep cross-package direction simple: app -> engine -> schema.
- Put reusable card facts in schema or domain files, not inside large screens.
- Validate imported JSON through `normalizeProject` before it becomes active state.
- Prefer small files with clear names over a single large catch-all file.
- Promote repeated review feedback into docs or `scripts/check-architecture.mjs`.

## Source Of Truth

- Product intent: [docs/PRODUCT_SENSE.md](docs/PRODUCT_SENSE.md)
- Engineering shape: [ARCHITECTURE.md](ARCHITECTURE.md)
- Design rules: [docs/DESIGN.md](docs/DESIGN.md)
- Reliability rules: [docs/RELIABILITY.md](docs/RELIABILITY.md)
- Security rules: [docs/SECURITY.md](docs/SECURITY.md)
- Quality status: [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md)
- Active/completed plans: [docs/exec-plans](docs/exec-plans)
