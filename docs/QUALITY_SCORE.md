# Quality Score

| Area | Grade | Notes |
| --- | --- | --- |
| Repo map | B | `AGENTS.md`, architecture docs, and checks now exist. |
| App structure | B- | First split moved domain facts and small UI controls out of `App.tsx`. |
| Type safety | B | Strict TypeScript is enabled and build passes. |
| Test coverage | D | No automated tests yet. |
| Runtime legibility | C | Build works, but there is no browser smoke script or observability yet. |

## Next Quality Moves

1. Add project JSON boundary validation.
2. Add a browser smoke test for load, upload-free preview, and export button availability.
3. Split `App.tsx` into tab sections once behavior tests exist.
4. Address Vite chunk-size warning with intentional code splitting.
