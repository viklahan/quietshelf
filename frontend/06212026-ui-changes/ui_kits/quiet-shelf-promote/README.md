# Quiet Shelf — UI kit

The full single-page app, interactive: **Empty Desk → Working → Shot List**, plus the engine-error state.

## Files
- `index.html` — entry; loads tokens, the component bundle, and the screens. All layout CSS for the page lives here.
- `engine.js` — fake mapping engine (`window.ShelfEngine`). Mirrors the real backend's `POST /api/map` response shape, including `video_title_suggestion`, `estimated_runtime_seconds`, and `segments[]`. Also exports `SAMPLE_SCRIPT`.
- `screens.jsx` — `Wordmark`, `EmptyDesk`, `Working`, `EngineError`.
- `shotlist.jsx` — `SummaryBar`, `ShotList`, `buildMarkdown` (the Copy-for-Notion table).
- `app.jsx` — the state machine + mount.

## Demoing states
- **Empty Desk**: initial load. "Try a sample script" fills the textarea.
- **Validation**: click *Map My Visuals* with nothing pasted, or with <100 words.
- **Working**: any valid mapping run (~3.5s, rotating lines).
- **Shot List**: after mapping. Cards deal in staggered; check *Found it* to see the done treatment and the progress bar move; *Copy for Notion* writes a markdown table to the clipboard; *Start a new script* asks for confirmation inline.
- **Engine error**: include the text `[fail]` anywhere in the script.
- **Partial map**: scripts long enough to produce >24 segments are truncated and show *Map the rest*.

All state is in memory — refresh resets, by design (matches the product brief: no storage, no accounts).
