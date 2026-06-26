# Handoff: Quiet Shelf — Frontend (Home + Format, Blurb, Promote)

## Overview
Quiet Shelf is a writer's toolkit that takes the things a writer dreads and quietly
returns them finished. **Product promise: your story, on the shelf — real.** The user is
often a stressed, overwhelmed writer. The UI's single job is to **lower their pulse** —
calm is the product. Phase 1 is one home screen and three tabs (Format, Blurb, Promote).

This package documents an interactive HTML prototype so an engineer can build the real
app in **React + Vite + Tailwind**.

## About the Design Files
The files in `prototype/` are **design references created in HTML** — a working prototype
showing the intended look, copy, motion, and behavior. They are **not production code to
ship**. The task is to **recreate these designs in a real React + Vite codebase** (the
brief's target stack) wired to a live backend, using the codebase's established patterns.

The prototype reuses the **Quiet Shelf design system** (warm-ink "writer's desk at
night" tokens + components) because Quiet Shelf is a sibling product in the same family.
All tokens and components below come from that system; the engineer should port the token
values into a Tailwind config and rebuild the shared components natively.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, motion, and interactions.
Recreate pixel-faithfully. The one place to honor *intent over pixels* is the Format
payoff (the 3D book on the shelf) — match the emotional beat, not the exact CSS transform.

---

## Design Tokens (warm darkness — "lamplit writing room")

### Color
| Token | Hex | Use |
| --- | --- | --- |
| `ink-950` | `#100d0a` | deepest shadow, text-on-amber |
| `ink-900` | `#15110d` | **page background** — warm ink, never pure/blue black |
| `ink-800` | `#1d1812` | cards / surfaces |
| `ink-700` | `#262017` | raised surface, hover fill, book body, shelf plank |
| `ink-600` | `#332b1f` | pressed fill, strong divider |
| `paper-100` | `#ede4d3` | **primary text** — paper cream (never pure white) |
| `paper-200` | `#dccfb6` | bright/emphasis text, sample book text |
| `paper-400` | `#a89b82` | secondary / muted text |
| `paper-600` | `#6e6452` | faint text, placeholders, page-edge lines |
| `ember-400` | `#d9a458` | lamplight hover / accent text |
| `ember-500` | `#c5893b` | **the one accent** — primary action, progress, found, glow. Used sparingly, like a desk lamp |
| `ember-600` | `#9c6a26` | pressed ember |
| `oxblood-400/500/600` | `#a04437 / #7e2b23 / #611f19` | errors only + the index-card rule under card headers. **Not** a second brand accent |

Edges are paper-tinted hairlines, never gray: cream at 18% / 10% / 6% alpha
(`edge-strong/soft/faint`). Washes: `wash-ember rgba(197,137,59,.12)`,
`wash-paper rgba(237,228,211,.05)`.

**Single accent only.** Amber is the sole bright thing on screen. No neon, no blue glow,
no gradients except the one soft amber radial glow under the finished book.

### Typography (3 faces)
- **Newsreader** (literary display serif) — wordmark, page leads (italic), titles, taglines,
  book cover title, the "becoming" loading lines (italic).
- **Source Serif 4** (body & the manuscript) — the writer's own words and back-cover copy.
  Manuscript text: 19px / 1.75 line-height, max ~62ch. *The writer's text is sacred.*
- **IBM Plex Mono** — every number, label, button, stamp, metadata. Uppercase + letterspaced
  (`ls-meta .08em`, `ls-stamp .12em`).

Scale: display `clamp(2.25rem,5vw,3.25rem)`, title `1.625rem`, script `1.1875rem`,
body `1rem`, small `.875rem`, meta `.78125rem`.

### Spacing / radii / shadow / motion
- Spacing: 4px scale (4,8,12,16,20,24,32,40,48,64).
- Radii: 2px stamps/chips, 3px buttons/inputs, 5px cards, 999px progress only.
- Shadows: warm ink, low/soft + 1px inset paper highlight. No colored glows (except book).
- Motion: `dur-fast 140ms` (hover/press), `dur-base 260ms` (done), `dur-slow 480ms` (the one
  orchestrated moment). Easings `ease-quiet cubic-bezier(.25,.1,.25,1)`,
  `ease-settle cubic-bezier(.16,1,.3,1)`. **Respect `prefers-reduced-motion`.** Nothing
  blinks, bounces, or loops demanding attention (the loader lamp is a slow 2.6s pulse only).
- Layout: single centered column, `content-max 760px` (narrow variant 660px).

---

## Voice / Copy (matters as much as visuals)
Reassuring, human, never commanding or technical. A steady, kind hand on the shoulder.
- Upload → "Bring me your story."
- Submit → "Begin"
- Processing → "Reading your story…" / "Setting your words…" / "Binding the pages…"
- Bad file → "I can only read Word, RTF, or text files for now. Try one of those?"
- Empty → calm invitation, never a void. Never a raw error or stack trace.
Exact strings used are listed per screen below; reuse verbatim.

---

## Screens / Views

### HOME
- **Purpose:** set the writer at ease and offer three gentle doorways.
- **Layout:** single 760px column, generous top padding. Hero block, then a 3-up grid of
  doorway cards (`repeat(3,1fr)`, 16px gap; stacks to 1 column < 760px), then the shelf.
- **Hero:** wordmark "Quiet Shelf" (Newsreader 500, `clamp(2.2rem,5vw,3rem)`, paper-100);
  amber italic line "Your story, made real." (ember-400, title size); one muted intro
  sentence (Source Serif, ~46ch): *"You've carried this long enough. Set it down here, and
  let it become something you can hold. Choose where you'd like to begin."*
- **Doorway card:** ink-800 bg, hairline border, 5px radius, warm shadow, 24px padding.
  Amber icon tile (38px, wash-ember bg, 1px amber-25% border) → Newsreader title → small
  muted line → mono "OPEN →". Hover: border warms to amber-40%, lifts `translateY(-3px)`,
  the "OPEN →" turns ember and its gap widens. Three doors:
  - **Format** (icon `book-open`): "Turn your manuscript into a beautiful book."
  - **Blurb** (icon `feather`): "Find the words to describe your book."
  - **Promote** (icon `film`): "Turn your writing into a video plan."
- **Shelf motif (emotional anchor):** centered (max 560px). Mono caption "YOUR SHELF". A
  warm wooden plank (16px tall, ink-700, 1px top highlight, soft drop shadow) + a thin front
  lip (ink-800). Standing on it: 4 prior "finished" book **spines** (30px wide, ink-800,
  hairline, vertical Newsreader title; one tinted ember). The shelf is the visual spine of
  the whole product.

### TAB 1 — FORMAT (the hero; spend the most love here)
State machine: **compose → becoming → done.** One calm step at a time, stacked in a 660px
column. Lead: *"Turn your manuscript into a beautiful book. One calm step at a time."*

1. **Bring your story** — warm dashed drop zone (ink-800, 1.5px dashed edge-strong, 5px
   radius, big padding). Amber `book-open` icon, Newsreader italic "Bring me your story.",
   mono hint "WORD, RTF, OR TEXT". Accept `.doc,.docx,.rtf,.txt`. Hover/drag: border →
   amber-55%, bg → ink-700. Once chosen: collapses to a solid-border "file row" showing
   `file-text` icon + filename + a mono "Change". Wrong type → calm error note (oxblood-400,
   italic, `circle-alert` icon): *"I can only read Word, RTF, or text files for now. Try one
   of those?"*. (Prototype prefills Title/Author from the file as if parsed — real app may
   parse server-side; treat as optional nicety.)
2. **Title & author** — two soft inputs side-by-side (stack < 560px). Inputs are
   Newsreader 1.15rem on ink-800, 3px radius, inset paper highlight; focus border ember-55%.
   Mono labels. Placeholders italic faint: "The name on the cover" / "Your name".
3. **Choose a feeling** — 4 theme preview cards (2-col grid, stacks < 620px). Each card shows
   an **actual typeset sample** on an ink-900 "paper" panel so the writer picks by feel:
   - **Classic Literary** — Newsreader, justified, amber drop-cap. "Old-style serif, a drop cap, justified pages."
   - **Cozy** — Source Serif, 1.85 leading. "Warm, roomy leading. A fireside read."
   - **Modern Clean** — Source Serif, tight 1.45 leading, small, with a mono "CHAPTER ONE" mark. "Tight, quiet, plenty of air."
   - **Children's** — Newsreader 1.3rem, centered, 1.9 leading. "Big, gentle, generously spaced."
   Selected: amber-60% border + amber `circle-check` (top-right, scales in). Sample copy is
   in `prototype/data.js`.
4. **Cover (optional)** — smaller drop zone, upload-only (`image/*`): "Have a cover? Add it."
   / italic "If not, I'll make a simple one." Shows filename row once chosen.
5. **Begin** — single large amber button, disabled until a story file is present. Quiet
   italic hint beside it: "When you're ready. No rush."
6. **The becoming** (loading) — centered, 420px. A slow-pulsing amber lamp dot
   (2.6s, soft amber box-shadow, no blink) above a Newsreader-italic line that rotates every
   ~1.4s through: "Reading your story…" → "Setting your words…" → "Binding the pages…", with
   a mono sub "THIS TAKES A MOMENT. STAY A WHILE." `aria-live="polite"`. (Prototype: ~4.2s
   then → done; real app: drive off the POST /api/format response.)
7. **THE PAYOFF** — **not a bare download.** The finished book **appears on the shelf.** A
   rendered 3D book object (front cover with the title in Newsreader + amber rule + mono
   author, a visible spine on the left, page-edge lines on the right) **settles** down onto a
   warm wooden shelf (`ease-settle`, ~1.1s drop) as a soft amber lamplight glow pools beneath
   it. Above: Newsreader italic "It's a book now." + "Your story, on the shelf — real."
   *Then, quietly,* a large amber **"Download your ebook"** button (icon `book-open`) and a
   mono underline "Format another". Visual first, button second. Download = EPUB blob →
   `<slug>.epub` (prototype writes a placeholder blob; real app downloads the API's EPUB).

### TAB 2 — BLURB
State: **compose → becoming → done.** 660px column.
- **Compose:** lead *"Paste your story, or bring the file. I'll find the words to describe
  it."* A manuscript textarea (ink-800, Source Serif 19px/1.75, italic faint placeholder
  "Paste your story here…"). Below it a mono underline "Bring the file instead" (`file-text`)
  opening a `.doc,.docx,.rtf,.txt` picker. Tone choice as soft pills (mono, ink-700 bg,
  hairline): **Warm / Literary / Punchy / Mysterious**; selected = ember text + amber-50%
  border + wash-ember. Primary amber button "Find my words" (icon `sparkles` — the single AI
  action per screen). Empty error: *"There's no story here yet. Paste it in, or bring the file."*
- **Becoming:** lines "Reading between the lines…" → "Listening for the heart of it…" →
  "Finding your words…", sub "ALMOST THERE." (~3.6s).
- **Done:** lead *"Here are your words. Take the ones that feel like the book."* Four result
  cards (ink-800, hairline, 5px, warm shadow; header row = mono label + oxblood rule under;
  each "deals" in with a soft rise). Each has a quiet mono **"Copy"** affordance (`copy`
  icon) that flips to ember **"Copied"** (`check`) for ~1.6s:
  1. **Back-cover copy** — set like real back-cover copy (Source Serif 19px/1.75, ≤54ch,
     `white-space: pre-line` for the paragraph break).
  2. **Taglines** — 3, Newsreader italic 1.18rem, each with a mono index ("01"). Copy yields a numbered list.
  3. **Store description** — Source Serif body, ≤56ch.
  4. **Suggested keywords** — mono chips (ink-700, hairline). Copy yields comma-joined list.
  Sample content in `prototype/data.js`. Footer: "Try a different tone" → back to compose.

### TAB 3 — PROMOTE
State: **compose → becoming → done.** 760px column.
- **Compose:** lead *"Paste your writing. I'll map it into a calm shot-by-shot video plan."*
  Manuscript textarea. **Live meter** below (mono, faint): `<n> words · ≈ m:ss runtime`
  (runtime = words ÷ 150 wpm). Primary amber "Map my visuals" (`sparkles`). Too short
  (< 40 words) → *"This looks like a fragment. Paste the full piece for a proper visual map."*
- **Becoming:** "Reading your piece…" → "Breaking it into scenes…" → "Mapping the visuals…",
  sub "MAPPING YOUR FOOTAGE." (~3.6s).
- **Done:** lead *"Your visuals, scene by scene. Open a search, find the clip, check it off."*
  A map line: `list-checks` icon + ember mono **"NN of NN mapped"** progress + a "Copy for
  Notion" affordance (markdown of all segments). Then a column of **ManuscriptCard**s
  (the design system's signature index-card element), dealt in staggered 60ms each:
  - mono id `NN · 0:00–0:14`, a mood **Stamp** (paper/ember/oxblood tone), mono `~Ns clip`,
    an oxblood rule, the script excerpt in Source Serif (≤62ch), then 3 **SearchChip**s
    (mono, the first tagged "BEST BET", amber-tinted) that open a Pexels video search in a new
    tab, then a **"Found it"** checkbox (amber check). When found: the card fades content to
    45%, border warms, and a rotated ember "FOUND" stamp appears; the progress count ticks.
  Footer: "Map a different piece". Sample segments in `prototype/data.js`.

---

## Interactions & Behavior
- **Navigation:** sticky top header — wordmark (→ home) + sub "Your story, made real."; mono
  nav tabs Format/Blurb/Promote with icons. Active tab = ember. On `< 600px` the sub and tab
  labels hide (icons remain). Header has an 8px backdrop blur over ink-86%. Scroll resets to
  top on tab change.
- **Each tab owns its own compose→becoming→done machine.** Switching tabs does not persist
  partial work (Phase 1).
- **Copy affordances** use the Clipboard API with a 1.6s "Copied" confirmation.
- **Motion:** entrance = gentle transform-only rise/settle; state changes (theme select,
  found, copy) = short transitions; the book settle is the one orchestrated `ease-settle`
  drop. All gated on `prefers-reduced-motion`.
- **Responsive:** fully fluid; calm at laptop and phone. Grids collapse to 1 column at the
  breakpoints noted per screen.
- **Accessibility:** visible 2px ember focus ring (offset 2px) everywhere; ARIA labels on
  icon-only controls; `role`/`aria-pressed`/`aria-checked` on pills, theme cards, found box;
  `aria-live` on loaders. **Verify WCAG AA:** cream `#ede4d3` on ink `#15110d` and amber-on-ink
  pass for text; for amber **buttons** use `ink-950 #100d0a` text on `ember-500` (as shipped).

## State Management (per tab, React state only — NO storage)
- **Format:** `phase`, `fileName`, `title`, `author`, `theme`, `coverName`, `error`.
- **Blurb:** `phase`, `text`, `tone`, `error`; results from API.
- **Promote:** `phase`, `text`, `error`, `found{}` (by segment index); segments from API.
- App: `tab` ('home'|'format'|'blurb'|'promote'). **No localStorage / sessionStorage /
  cookies.** No HTML `<form>` tags — `onClick`/`onChange` handlers only.

## Backend contract (single base-URL constant at top)
- `GET  /api/health` → liveness.
- `GET  /api/format/themes` → theme list (id, name, note, sample, face) for the feeling cards.
- `POST /api/format` (multipart: story file, title, author, theme, optional cover) →
  **returns an EPUB file** (blob → download as `<slug>.epub`).
- `POST /api/blurb` (JSON: text, tone) → `{ backCover, taglines[], storeDescription, keywords[] }`.
- `POST /api/promote` (JSON: text) → `{ segments: [{ index, startTime, endTime, excerpt, mood,
  moodTone, clipDurationSeconds, terms[] }] }`.
- Every failure surfaces a calm plain sentence, never a raw error/stack trace.

## Icons
Lucide React, thin 2px stroke, sparing, no emoji: `BookOpen, Feather, Film, FileText, Copy,
Check, CircleCheck, Clock, Sparkles, ArrowRight, Search, ExternalLink, RotateCcw, X,
CircleAlert, ListChecks`. (`sparkles` = the single AI action per screen. The brief's "Upload"
is rendered as `book-open`/`file-text` in-context.)

## Assets
No photography or illustration. The book, shelf, spines, and lamplight glow are **pure CSS**
(see `prototype/kit.css`). Fonts are Google Fonts: Newsreader, Source Serif 4, IBM Plex Mono.

## Files (in `prototype/`)
- `index.html` — app shell, font/bundle load order.
- `kit.css` — all page-level layout, the shelf, the 3D book, theme faces, loaders, cards.
- `data.js` — believable sample content (book, themes, blurb result, promote segments).
- `app.jsx` — header + tab routing.
- `home.jsx`, `format.jsx`, `blurb.jsx`, `promote.jsx` — the screens.
- `ui.jsx` — shared custom pieces (Shelf, Spine, FinishedBook, Becoming loader, CopyButton).
- `_ds_reference/` — the Quiet Shelf design tokens + component sources to port
  (Button, Icon, Stamp, SearchChip, ProgressBar, FoundCheckbox, ManuscriptCard, ScriptTextarea).
> The prototype loads the design system from a compiled bundle; the engineer should rebuild
> those components natively in React and port the token CSS into a Tailwind theme.
