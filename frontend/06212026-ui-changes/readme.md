# Quiet Shelf — Design System

**Quiet Shelf** is a quiet writer's toolkit: it takes the things a writer dreads and quietly returns them finished. The product promise is **"your story, on the shelf — real."** A writer arrives tense — years of unpublished work, no budget, no technical skill — and the interface's job is to **lower their pulse**. Calm is the product, not features.

The suite is one calm home and three gentle offers:
- **Format** — turn a manuscript into a beautiful ebook (the hero; ends with the finished book settling onto a warm shelf).
- **Blurb** — find the words to describe the book (back-cover copy, taglines, store description, keywords).
- **Promote** — turn writing into a shot-by-shot video plan (segments, timings, moods, one-click stock-footage searches).

The user is a **writer**, not a developer. The aesthetic brief is **"A Writing Room at Night"**: quiet, warm, lamplit — a desk lamp, ink on paper, the house asleep. Stillness, warmth, relief. Restrained and literary; never a dashboard, never SaaS.

**Sources:** no codebase, Figma, or brand assets were provided. This system was authored from the product's written design briefs (pasted into this project): palette/type direction, the manuscript-card signature element, the shelf motif, layout & flow for the app states, copy voice and error strings, and technical constraints (static frontend, JSON/multipart endpoints, no storage). Everything here is an original interpretation of those briefs.

---

## CONTENT FUNDAMENTALS

**Voice:** reassuring, human, second person — a steady, kind hand on the shoulder. Never commanding, never technical. Declarative, warm sentences. No apology theater, no exclamation marks, no marketing copy.

- Upload → *"Bring me your story. Word, RTF, or text."*
- Submit → *"Begin"*
- Working → *"Reading your story…"*, *"Setting your words…"*, *"Binding the pages…"*
- Empty paste → *"There's no story here yet. Paste it in, or bring the file."*
- Too short → *"This looks like a fragment. Paste the full piece for a proper visual map."*
- Bad file → *"I can only read Word, RTF, or text files for now. Try one of those?"*
- Failure → a calm plain sentence, never a raw error or stack trace.

**Casing:** sentence case for prose. Buttons, stamps, and metadata render uppercase via CSS (mono + letterspacing) but are written in title case in source ("Find My Words", "Copy for Notion", "Found it").

**Person:** "your story", "I'll find the words" — the tool is a quiet collaborator, never "the system" or "the user".

**Emoji:** never. Icons are lucide, small and sparse. `sparkles` appears at most once per screen, only on the AI action.

**Numbers & metadata** always render in mono: `03 · 0:42–1:05`, `~9s clip`, `1,240 words · ≈8:16 runtime`.

---

## VISUAL FOUNDATIONS

**Color.** Deep warm darkness — charcoal/ink (`--ink-900 #15110d`), never pure or blue-black — with paper-cream text (`--paper-100 #ede4d3`) and a single **ember** accent (`--ember-500 #c5893b`, the desk-lamp glow; primary action, found states, progress, the shelf's pool of light). A quiet **oxblood** (`--oxblood-500 #7e2b23`) is reserved for errors and the index-card rule on manuscript cards — never a second brand accent. Six named base hexes, used with discipline. No gradients (except the one soft amber glow under the finished book), no neon, no purple.

**Backgrounds:** flat ink. No images, no patterns, no textures drawn in. Depth comes from one step of surface lightening (`--surface-card`, `--surface-raised`) plus warm shadows. The book, shelf, spines, and lamplight glow are pure CSS.

**Type.** Three faces:
- `--font-display` **Newsreader** — literary display serif; wordmark, page leads (italic), titles, taglines, book-cover title, working-state lines (italic).
- `--font-body` **Source Serif 4** — body and the writer's own words (the manuscript, back-cover copy). Script passages at 19px / 1.75 leading, max 62ch (`--measure-script`). Their words are treated as precious.
- `--font-mono` **IBM Plex Mono** — every number, duration, segment id, stamp, label, and button. Uppercase + letterspaced (`--ls-meta` 8%, `--ls-stamp` 12%).

**Spacing:** 4px scale (`--space-1`…`--space-16`). Single centered column, `--content-max: 760px`.

**Corners:** tight, paper-like. 2px stamps/chips, 3px buttons/inputs, 5px cards. The only pill is the 4px progress track.

**Borders:** paper-tinted hairlines (`--edge-strong/soft/faint` — cream at 18/10/6% alpha), never gray. Cards: 1px `--edge-soft`.

**Shadows:** warm ink, low and soft (`--shadow-card`, `--shadow-lifted`) plus a 1px inset paper highlight (`--shadow-inset-paper`). No colored glows (the lamplight under the book is the single intentional exception).

**Cards** (the signature): manuscript/index cards — `--surface-card` bg, hairline border, 5px radius, warm shadow, an **oxblood ruled line** under the header (the index-card rule). Found ⇒ content fades to 45%, border warms, and a rotated ember "found" stamp appears.

**The shelf** (the emotional anchor): an understated warm wooden plank with a thin front lip and a soft drop shadow. Finished books rest on it as spines, or — at the Format payoff — as a rendered 3D book that settles down with a soft pool of lamplight beneath. Calm, never skeuomorphic-cartoonish.

**Hover states:** background lightens one step and/or border strengthens; text warms from muted → body. **Press:** 1px translateY + darker fill. No scaling.

**Motion:** slow, soft, organic. `--dur-fast 140ms` hover/press, `--dur-base 260ms` done treatment, `--dur-slow 480ms` for orchestrated moments — cards dealing onto the board (staggered 60ms), the book settling onto the shelf. Easings `--ease-quiet` and `--ease-settle`. Nothing blinks, bounces, or loops demanding attention (the loader lamp is a slow pulse). Global `prefers-reduced-motion` kill-switch in `tokens/base.css`.

**Transparency & blur:** sparingly — the sticky header / summary bars (`rgba` ink + 8px backdrop blur).

**Focus:** 2px ember outline, 2px offset, on `:focus-visible` everywhere.

**Imagery:** the product renders no photography. The shelf and book are CSS; if imagery is ever needed, warm, dim, filmic — never bright stock-corporate.

---

## ICONOGRAPHY

**System:** [lucide](https://lucide.dev) (ISC), 2px stroke, round caps. No icon font, no emoji, no unicode-as-icon.

- Source SVGs in `assets/icons/` (18 icons from `lucide-static@0.453.0`): feather, pen-line, film, clapperboard, search, clock, sparkles, circle-check, check, copy, rotate-ccw, x, circle-alert, external-link, list-checks, book-open, file-text, arrow-right.
- In React, use the **`Icon` component** (`components/display/Icon.jsx`) — the same 18 icons inlined, tinted via `currentColor`. Don't import lucide-react; don't draw new SVGs.
- Sizes 13–18px. Icons accompany text; they are never the message alone (except `x`/close with an aria-label).
- `sparkles` is reserved for the single AI action per screen. `circle-check` is the found/done mark.

**Wordmark:** there is no drawn logo. The brand mark is type-set — Newsreader 500 (see `guidelines/brand-wordmark.html`), with the line *"Your story, made real."*

---

## INDEX

| Path | What |
| --- | --- |
| `styles.css` | Global entry — imports every token + font file below |
| `tokens/colors.css` | Base palette + semantic aliases |
| `tokens/typography.css` | Font stacks, scale, leading, tracking |
| `tokens/spacing.css` | Spacing, radii, shadows, borders, motion, layout |
| `tokens/base.css` | Body defaults, selection, focus ring, reduced-motion |
| `tokens/fonts-*.css` | `@font-face` for Newsreader, Source Serif 4, IBM Plex Mono |
| `assets/icons/` | 18 lucide SVGs |
| `assets/fonts/` | Self-hosted woff2 files |
| `components/display/` | `Icon`, `Stamp`, `SearchChip`, `ProgressBar` |
| `components/actions/` | `Button`, `FoundCheckbox` |
| `components/manuscript/` | `ManuscriptCard` (signature element), `ScriptTextarea` |
| `guidelines/` | Foundation specimen cards (Colors / Type / Spacing / Brand) |
| `ui_kits/quiet-shelf/` | **The full Quiet Shelf app** — home + Format, Blurb, Promote |
| `ui_kits/quiet-shelf-promote/` | The standalone Promote experience: Empty Desk → Working → Shot List |
| `SKILL.md` | Agent-skill entry point |

**Components** (all under `window.<Namespace>` from `_ds_bundle.js`): Button, FoundCheckbox, Icon, ProgressBar, SearchChip, Stamp, ManuscriptCard, ScriptTextarea. Each has a `.d.ts` props contract and a `.prompt.md` usage note beside it.

---

## Rules of thumb

1. One primary (ember) action per view. Everything else is secondary, ghost, or danger.
2. The writer's words are sacred: Source Serif, 19px/1.75, ≤62ch, `text-wrap: pretty`.
3. If it's a number, it's mono. If it's mono, it's probably uppercase and letterspaced.
4. Ember = the lamp (action, progress, found, the shelf's glow). Oxblood = errors and the index-card rule. Never swap them.
5. No new colors, no gradients (bar the one book glow), no emoji, no rounded-corner-pill cards, no second accent.
6. Motion is earned and slow: hover, press, done, the deal-in, the book settling. Nothing else moves. Calm at every size.
