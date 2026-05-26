# First Refactor

## Goal

Set up the project for agent-first development based on OpenAI's harness engineering article.

## Steps

- Create local and GitHub branch `first-refactor`.
- Add repo-local source-of-truth docs.
- Refactor `App.tsx` so domain facts and reusable UI controls live in clear files.
- Add an architecture check that future agents can run.
- Verify with `npm run check`.

## Decisions

- Keep this first refactor conservative because the app has no behavior tests yet.
- Use docs plus a Node script as the first mechanical guardrail.
- Defer deeper screen splitting until UI smoke tests exist.

## Verification

- `npm run build`
- `npm run check`
