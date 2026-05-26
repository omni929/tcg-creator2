# Direct Layout, Premium Templates, And Exports

## Goal

Make the studio easier to use for direct 2D layout edits, premium template starts, generated foil masks, one-click post-ready exports, and Chrome/Firefox-friendly performance.

## Steps

- Add editable 2D layout zones for title, art, flavor, and badge.
- Add more built-in premium templates.
- Add generated foil mask patterns that can be applied without uploading a file.
- Add post-ready export presets and a one-click render button.
- Tune rendering and browser APIs for Chrome and Firefox.

## Verification

- Run `npm run check`.
- Open the app locally and inspect it with Chrome DevTools.

## Decisions

- Keep shared project shape in schema.
- Keep app workflow controls in Card Studio.
- Keep canvas/export rendering in the engine.
