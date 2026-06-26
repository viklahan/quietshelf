# Quiet Fight Club — Design System

**Quiet Fight Club** is a free, open-source visual mapping tool for video essayists who use stock footage. The user pastes a 1,000–1,500-word video-essay script and receives a complete visual map — segments with timings, ranked stock-footage search terms, suggested clip durations, and moods — then hunts clips via one-click Pexels searches and checks segments off as found. One page, one job.

The user is a **writer**, not a developer. The product's aesthetic brief is **"A Writer's Desk at Night"**: quiet, literary, focused — a desk lamp, ink on paper, the calm before a fight. Restrained intensity; a boxer's notebook. Discipline, not noise.

**Sources:** no codebase, Figma, or brand assets were provided. This system was authored from the product's written design brief (pasted into this project): palette/type direction, the manuscript-card signature element, layout & flow for the three app states, copy voice and error strings, and technical constraints (static frontend, `POST /api/map`, no storage). Everything here is an original interpretation of that brief.

---

## CONTENT FUNDAMENTALS

**Voice:** direct, literary, second person. The interface speaks like a writer who respects the reader's time. Declarative sentences. No apology theater, no exclamation marks, no marketing copy.

- Placeholder: *"Paste your script. Every word of it."*
- Empty paste: *"There's no script here yet. Paste it in and we'll get to work."*
- Too short: *"This looks like a fragment. Paste the full script for a proper shot list."*
- Failure: *"The mapping engine didn't answer. Wait a moment and try again."*
- Working: *"Reading your script…"*, *"Breaking it into scenes…"*, *"Finding your footage…"*

**Casing:** sentence case for prose. Buttons, stamps, and metadata render uppercase via CSS (mono + letterspacing) but are written in title case in source ("Map My Visuals", "Copy for Notion", "Found it").

**Person:** "your script", "we'll get to work" — the tool is a quiet collaborator, never "the system" or "the user".

**Emoji:** never. Icons are lucide, small and sparse. `sparkles` appears at most once per screen, only on the AI action.

**Numbers & metadata** always render in mono: `03 · 0:42–1:05`, `~9s clip`, `1,240 words · ≈8:16 runtime`.

---

## VISUAL FOUNDATIONS

**Color.** Deep warm darkness — charcoal/ink (`--ink-900 #15110d`), never pure black — with paper-cream text (`--paper-100 #ede4d3`) and exactly two accents: **ember** (`--ember-500 #c5893b`, the lamplight; primary action, found states, progress) and **oxblood** (`--oxblood-500 #7e2b23`, the fight; destructive actions, errors, and the index-card rule on manuscript cards). Six named base hexes, used with discipline. No gradients, no neon, no purple.

**Backgrounds:** flat ink. No images, no patterns, no textures drawn in. Depth comes from one step of surface lightening (`--surface-card`, `--surface-raised`) plus warm shadows.

**Type.** Three faces:
- `--font-display` **Newsreader** — literary display serif; page title (uppercase, tracked +4%), taglines and working-state lines in italic.
- `--font-body` **Source Serif 4** — body and the script text itself; script passages at 19px / 1.75 leading, max 62ch (`--measure-script`). Manuscript, not UI copy.
- `--font-mono` **IBM Plex Mono** — every number, duration, segment id, stamp, and button label; uppercase + letterspaced (`--ls-meta` 8%, `--ls-stamp` 12%).

**Spacing:** 4px scale (`--space-1`…`--space-16`). Single centered column, `--content-max: 760px`.

**Corners:** tight, paper-like. 2px stamps/chips, 3px buttons/inputs, 5px cards. The only pill is the 4px progress track.

**Borders:** paper-tinted hairlines (`--edge-strong/soft/faint` — cream at 18/10/6% alpha), never gray. Cards: 1px `--edge-soft`.

**Shadows:** warm ink, low and soft (`--shadow-card`, `--shadow-lifted`) plus a 1px inset paper highlight (`--shadow-inset-paper`). No colored glows.

**Cards** (the signature): manuscript/index cards — `--surface-card` bg, hairline border, 5px radius, warm shadow, an **oxblood ruled line** under the header (the index-card rule). Found ⇒ content fades to 45%, border warms, and a rotated ember "found" stamp appears.

**Hover states:** background lightens one step (`--wash-paper` or next surface) and/or border strengthens; text warms from muted → body. **Press:** 1px translateY + darker fill. No scaling.

**Motion:** restrained. `--dur-fast 140ms` hover/press, `--dur-base 260ms` done treatment, `--dur-slow 480ms` for the one orchestrated moment — cards dealing onto the board, staggered 60ms. Easings `--ease-quiet` and `--ease-settle`. Global `prefers-reduced-motion` kill-switch in `tokens/base.css`. Nothing loops.

**Transparency & blur:** one place only — the sticky summary bar (`rgba` ink at 92% + 8px backdrop blur).

**Focus:** 2px ember outline, 2px offset, on `:focus-visible` everywhere.

**Imagery:** the product brokers stock footage but renders none. No photography in the UI; if ever needed, warm, dim, filmic — never bright stock-corporate.

---

## ICONOGRAPHY

**System:** [lucide](https://lucide.dev) (ISC), 2px stroke, round caps. No icon font, no emoji, no unicode-as-icon.

- Source SVGs copied into `assets/icons/` (18 icons from `lucide-static@0.453.0`): feather, pen-line, film, clapperboard, search, clock, sparkles, circle-check, check, copy, rotate-ccw, x, circle-alert, external-link, list-checks, book-open, file-text, arrow-right.
- In React, use the **`Icon` component** (`components/display/Icon.jsx`) — the same 18 icons inlined, tinted via `currentColor`. Don't import lucide-react; don't draw new SVGs.
- Sizes 13–18px. Icons accompany text; they are never the message alone (except `x`/close with an aria-label).
- `sparkles` is reserved for the single AI action per screen. `circle-check` is the found/done mark.

**Wordmark:** there is no drawn logo. The brand mark is type-set — Newsreader 500, uppercase, +4% tracking (see `guidelines/brand-wordmark.html`).

---

## INDEX

| Path | What |
| --- | --- |
| `styles.css` | Global entry — imports every token + font file below |
| `tokens/colors.css` | Base palette + semantic aliases |
| `tokens/typography.css` | Font stacks, scale, leading, tracking |
| `tokens/spacing.css` | Spacing, radii, shadows, borders, motion, layout |
| `tokens/base.css` | Body defaults, selection, focus ring, reduced-motion |
| `tokens/fonts-*.css` | `@font-face` for Newsreader, Source Serif 4, IBM Plex Mono (binaries in `assets/fonts/`) |
| `assets/icons/` | 18 lucide SVGs |
| `assets/fonts/` | Self-hosted woff2 files |
| `components/display/` | `Icon`, `Stamp`, `SearchChip`, `ProgressBar` |
| `components/actions/` | `Button`, `FoundCheckbox` |
| `components/manuscript/` | `ManuscriptCard` (signature element), `ScriptTextarea` |
| `guidelines/` | Foundation specimen cards (Colors / Type / Spacing / Brand) |
| `ui_kits/quiet-fight-club/` | The full interactive app: Empty Desk → Working → Shot List |
| `SKILL.md` | Agent-skill entry point |

**Components** (all under `window.<Namespace>` from `_ds_bundle.js`): Button, FoundCheckbox, Icon, ProgressBar, SearchChip, Stamp, ManuscriptCard, ScriptTextarea. Each has a `.d.ts` props contract and a `.prompt.md` usage note beside it.

---

## Rules of thumb

1. One primary (ember) action per view. Everything else is secondary, ghost, or danger.
2. Script text is sacred: Source Serif, 19px/1.75, ≤62ch, `text-wrap: pretty`.
3. If it's a number, it's mono. If it's mono, it's probably uppercase and letterspaced.
4. Ember = the lamp (action, progress, found). Oxblood = the fight (destructive, errors, the card rule). Never swap them.
5. No new colors, no gradients, no emoji, no rounded-corner-pill cards, no third accent.
6. Motion is earned: hover, press, done, and the one deal-in. Nothing else moves.
