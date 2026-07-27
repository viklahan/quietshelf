# Quiet Shelf — UI Refresh (07-2026)

Drop-in patches for the five improvements. Every file here is your production
`static/` file with the change applied — diff against your copies, then replace.

## Files

| File | What changed |
| --- | --- |
| `static/refresh.css` | **NEW.** All new CSS (themed book faces + cover looks, back-cover render, tone cards, takes/comps/kept-blurb styles, watermarks, story-map drawer). No existing rules touched. |
| `static/index.html` | One line: links `refresh.css` after `kit.css`. |
| `static/api.js` | `formatBook` sends `cover_style` + `cover_accent` when no cover image is uploaded (backend may ignore until implemented). |
| `static/ui.jsx` | `FinishedBook` gains `face`, `coverStyle`, `accent` props — themed cover typography per theme, four cover looks (quiet/frame/wash/band), themed spine (title only) + cream page edges. `coverUrl` still wins. |
| `static/format.jsx` | Payoff renders the chosen look; step 4 gains "The look" (4 mini covers) + "The accent" (4 swatches) pickers when no cover is uploaded; watermark on the empty drop zone. |
| `static/blurb.jsx` | Back-cover render (rules, cream column, barcode + ISBN); **Take 01/02/03** switcher when the API returns `back_cover_variants`; **length** control (Short/Medium/Full); **query paragraph** and editable **comp titles** cards when the API provides them; **Keep this blurb** → kept-blurbs shelf (localStorage, Open/Remove on compose). Tone cards with example lines. Feather watermark. |
| `static/promote.jsx` | Film watermark on the empty textarea. |
| `static/storymap.jsx` | Character profile/edit in a 340px right-edge drawer (board stays interactive; Escape closes; focus enters on open). Search watermark. |

Backend work needed for the new Blurb outputs and cover looks: see `BACKEND_HANDOFF.md`.

## Notes

- **Author line on the back cover:** Blurb collects no author name, so the
  rendered back cover omits it. If you ever add an author field, drop
  `<span class="qs-bcr__author">Name</span>` after the second rule.
- The fake ISBN (`978-1-83904-627-1`) is decorative and constant.
- Watermarks show only while the area is empty; `opacity: 0.04`, pointer-events none.
- Reduced motion: the drawer slide is disabled via the media query in `refresh.css`;
  everything else already inherits your global kill-switch.
- Nothing else in these files was modified.
