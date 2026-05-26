# Reliability

## Rules

- Run `npm run check` before handing work back.
- Keep imported project data flowing through `normalizeProject`.
- Clean up WebGL resources when rendering exports.
- Keep rendering code inside `packages/card-engine`.
- Track flaky or missing verification in `docs/QUALITY_SCORE.md`.

## Current Verification

- `npm run build` checks TypeScript and production bundling.
- `npm run check:architecture` checks docs and import boundaries.
