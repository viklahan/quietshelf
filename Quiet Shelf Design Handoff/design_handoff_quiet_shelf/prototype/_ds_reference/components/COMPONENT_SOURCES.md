# Quiet Shelf — component sources (reference)

These are the design-system component implementations the prototype reuses.
Rebuild them natively in your React codebase (port the inline CSS into your styling
system). They are reference only — not meant to compile in this package.

Token values live in `_ds_reference/tokens/`. See the main README for the full spec.


---

## Button  
<sub>`components/actions/Button.jsx`</sub>

Button is Quiet Shelf's typewriter-stamp button: mono, uppercase, letterspaced. One primary (ember) per view — everything else is secondary, ghost, or danger.

```jsx
<Button size="lg" icon="sparkles">Map My Visuals</Button>
<Button variant="secondary" icon="copy">Copy for Notion</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="danger" icon="rotate-ccw">Start a new script</Button>
```

Variants: primary, secondary, ghost, danger. Sizes: sm, md, lg (lg only for the single main CTA). `icon` / `iconAfter` take Icon names.

```jsx
// Button — mono, letterspaced, typewriter-stamp buttons. One primary per view.
import React from 'react';
import { Icon } from '../display/Icon.jsx';

const BUTTON_CSS = `
.qs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: var(--fs-meta);
  font-weight: 500;
  letter-spacing: var(--ls-meta);
  text-transform: uppercase;
  line-height: 1;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--dur-fast) var(--ease-quiet),
              border-color var(--dur-fast) var(--ease-quiet),
              color var(--dur-fast) var(--ease-quiet),
              transform var(--dur-fast) var(--ease-quiet);
}
.qs-btn:active:not(:disabled) { transform: translateY(1px); }
.qs-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.qs-btn--md { padding: 11px 18px; }
.qs-btn--sm { padding: 8px 12px; }
.qs-btn--lg { padding: 15px 26px; font-size: var(--fs-small); }

.qs-btn--primary {
  background: var(--accent);
  color: var(--on-accent);
}
.qs-btn--primary:hover:not(:disabled) { background: var(--accent-hover); }
.qs-btn--primary:active:not(:disabled) { background: var(--accent-press); }

.qs-btn--secondary {
  background: transparent;
  border-color: var(--edge-strong);
  color: var(--text-body);
}
.qs-btn--secondary:hover:not(:disabled) { background: var(--wash-paper); }

.qs-btn--ghost {
  background: transparent;
  color: var(--text-muted);
}
.qs-btn--ghost:hover:not(:disabled) { background: var(--wash-paper); color: var(--text-body); }

.qs-btn--danger {
  background: transparent;
  border-color: rgba(160, 68, 55, 0.5);
  color: var(--danger-text);
}
.qs-btn--danger:hover:not(:disabled) { background: var(--wash-oxblood); }
`;

function injectButtonCss() {
  if (typeof document === 'undefined' || document.getElementById('qs-btn-css')) return;
  const el = document.createElement('style');
  el.id = 'qs-btn-css';
  el.textContent = BUTTON_CSS;
  document.head.appendChild(el);
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconAfter,
  disabled = false,
  onClick,
  ariaLabel,
  style,
  className,
}) {
  injectButtonCss();
  const iconSize = size === 'lg' ? 16 : 14;
  return (
    <button
      type="button"
      className={`qs-btn qs-btn--${variant} qs-btn--${size}${className ? ' ' + className : ''}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      style={style}
    >
      {icon ? <Icon name={icon} size={iconSize} /> : null}
      {children}
      {iconAfter ? <Icon name={iconAfter} size={iconSize} /> : null}
    </button>
  );
}
```


---

## FoundCheckbox  
<sub>`components/actions/FoundCheckbox.jsx`</sub>

FoundCheckbox is the "Found it" control on manuscript cards — quiet box, ember check that scales in.

```jsx
<FoundCheckbox checked={found} onChange={setFound} />
<FoundCheckbox checked label="Clipped" />
```

Controlled component; renders as a `role="checkbox"` button with visible focus. Pair with the card's done treatment when checked.

```jsx
// FoundCheckbox — the satisfying "Found it" check. Quiet box, ember check.
import React from 'react';
import { Icon } from '../display/Icon.jsx';

const FOUND_CSS = `
.qs-found {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  padding: 4px 6px;
  margin: -4px -6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: var(--fs-meta);
  letter-spacing: var(--ls-meta);
  text-transform: uppercase;
  color: var(--text-muted);
  transition: color var(--dur-fast) var(--ease-quiet);
}
.qs-found:hover { color: var(--text-body); }
.qs-found__box {
  width: 18px;
  height: 18px;
  border: 1px solid var(--edge-strong);
  border-radius: var(--radius-xs);
  background: var(--surface-raised);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--dur-fast) var(--ease-quiet),
              background var(--dur-fast) var(--ease-quiet);
}
.qs-found:hover .qs-found__box { border-color: var(--text-faint); }
.qs-found__check {
  color: var(--ink-950);
  transform: scale(0);
  transition: transform var(--dur-base) var(--ease-settle);
}
.qs-found[aria-checked="true"] { color: var(--ember-400); }
.qs-found[aria-checked="true"] .qs-found__box {
  background: var(--accent);
  border-color: var(--accent);
}
.qs-found[aria-checked="true"] .qs-found__check { transform: scale(1); }
`;

function injectFoundCss() {
  if (typeof document === 'undefined' || document.getElementById('qs-found-css')) return;
  const el = document.createElement('style');
  el.id = 'qs-found-css';
  el.textContent = FOUND_CSS;
  document.head.appendChild(el);
}

export function FoundCheckbox({ checked = false, onChange, label = 'Found it', style, className }) {
  injectFoundCss();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className={`qs-found${className ? ' ' + className : ''}`}
      onClick={() => onChange && onChange(!checked)}
      style={style}
    >
      <span className="qs-found__box" aria-hidden="true">
        <Icon name="check" size={13} strokeWidth={3} className="qs-found__check" />
      </span>
      <span>{label}</span>
    </button>
  );
}
```


---

## Icon  
<sub>`components/display/Icon.jsx`</sub>

Icon renders one of Quiet Shelf's 18 inlined lucide icons (2px stroke) — use it instead of importing lucide.

```jsx
<Icon name="search" size={14} />
<Icon name="circle-check" size={18} color="var(--ember-500)" title="Found" />
```

Names: feather, pen-line, film, clapperboard, search, clock, sparkles, circle-check, check, copy, rotate-ccw, x, circle-alert, external-link, list-checks, book-open, file-text, arrow-right. Keep icons small (13–18px) and quiet; never decorative noise. `sparkles` at most once per screen, for the AI action.

```jsx
// Icon — Quiet Shelf's lucide subset, inlined from lucide-static@0.453.0 (ISC).
// Quiet, consistent 2px stroke. Icons are small and never decorative noise.
import React from 'react';

const ICON_PATHS = {
  "feather": "<path d=\"M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z\"></path> <path d=\"M16 8 2 22\"></path> <path d=\"M17.5 15H9\"></path>",
  "pen-line": "<path d=\"M12 20h9\"></path> <path d=\"M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z\"></path>",
  "film": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"></rect> <path d=\"M7 3v18\"></path> <path d=\"M3 7.5h4\"></path> <path d=\"M3 12h18\"></path> <path d=\"M3 16.5h4\"></path> <path d=\"M17 3v18\"></path> <path d=\"M17 7.5h4\"></path> <path d=\"M17 16.5h4\"></path>",
  "clapperboard": "<path d=\"M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z\"></path> <path d=\"m6.2 5.3 3.1 3.9\"></path> <path d=\"m12.4 3.4 3.1 4\"></path> <path d=\"M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z\"></path>",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\"></circle> <path d=\"m21 21-4.3-4.3\"></path>",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <polyline points=\"12 6 12 12 16 14\"></polyline>",
  "sparkles": "<path d=\"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z\"></path> <path d=\"M20 3v4\"></path> <path d=\"M22 5h-4\"></path> <path d=\"M4 17v2\"></path> <path d=\"M5 18H3\"></path>",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <path d=\"m9 12 2 2 4-4\"></path>",
  "check": "<path d=\"M20 6 9 17l-5-5\"></path>",
  "copy": "<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\"></rect> <path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\"></path>",
  "rotate-ccw": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"></path> <path d=\"M3 3v5h5\"></path>",
  "x": "<path d=\"M18 6 6 18\"></path> <path d=\"m6 6 12 12\"></path>",
  "circle-alert": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\"></line> <line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\"></line>",
  "external-link": "<path d=\"M15 3h6v6\"></path> <path d=\"M10 14 21 3\"></path> <path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"></path>",
  "list-checks": "<path d=\"m3 17 2 2 4-4\"></path> <path d=\"m3 7 2 2 4-4\"></path> <path d=\"M13 6h8\"></path> <path d=\"M13 12h8\"></path> <path d=\"M13 18h8\"></path>",
  "book-open": "<path d=\"M12 7v14\"></path> <path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\"></path>",
  "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\"></path> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\"></path> <path d=\"M10 9H8\"></path> <path d=\"M16 13H8\"></path> <path d=\"M16 17H8\"></path>",
  "arrow-right": "<path d=\"M5 12h14\"></path> <path d=\"m12 5 7 7-7 7\"></path>",
};

export function Icon({ name, size = 16, strokeWidth = 2, color = 'currentColor', style, className, title }) {
  const inner = ICON_PATHS[name];
  if (!inner) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      className={className}
      style={{ flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: (title ? '<title>' + title + '</title>' : '') + inner }}
    />
  );
}

Icon.names = Object.keys(ICON_PATHS);
```


---

## ProgressBar  
<sub>`components/display/ProgressBar.jsx`</sub>

ProgressBar is the thin (4px) quiet progress indicator used in the sticky summary bar.

```jsx
<ProgressBar value={7 / 14} label="7 of 14 segments clipped" />
```

`value` is 0–1. The label renders in mono uppercase above the track; omit it when the context already explains the number.

```jsx
// ProgressBar — thin, quiet progress indicator.
import React from 'react';

const PROGRESS_CSS = `
.qs-progress {
  display: block;
  width: 100%;
}
.qs-progress__track {
  height: 4px;
  width: 100%;
  background: var(--surface-pressed);
  border-radius: var(--radius-pill);
  overflow: hidden;
}
.qs-progress__fill {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-pill);
  transition: width var(--dur-slow) var(--ease-settle);
}
.qs-progress__label {
  font-family: var(--font-mono);
  font-size: var(--fs-meta);
  letter-spacing: var(--ls-meta);
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: var(--space-2);
  display: block;
}
`;

function injectProgressCss() {
  if (typeof document === 'undefined' || document.getElementById('qs-progress-css')) return;
  const el = document.createElement('style');
  el.id = 'qs-progress-css';
  el.textContent = PROGRESS_CSS;
  document.head.appendChild(el);
}

export function ProgressBar({ value = 0, label, style, className }) {
  injectProgressCss();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`qs-progress${className ? ' ' + className : ''}`}
      style={style}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label || 'Progress'}
    >
      {label ? <span className="qs-progress__label">{label}</span> : null}
      <div className="qs-progress__track">
        <div className="qs-progress__fill" style={{ width: pct + '%' }}></div>
      </div>
    </div>
  );
}
```


---

## SearchChip  
<sub>`components/display/SearchChip.jsx`</sub>

SearchChip is a clickable search-term tab that opens a Pexels video search (or custom href) in a new tab — used in rows of three on manuscript cards.

```jsx
<SearchChip term="rain on window night" best />
<SearchChip term="city street lamplight" />
```

`best` gives the chip the ember best-bet treatment with a "best bet" tag. Lay chips out with flex + gap, first chip marked best.

```jsx
// SearchChip — a clickable search-term tab that opens a stock-footage search.
import React from 'react';
import { Icon } from './Icon.jsx';

const CHIP_CSS = `
.qs-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-mono);
  font-size: var(--fs-small);
  line-height: 1;
  color: var(--text-body);
  text-decoration: none;
  padding: 8px 12px;
  background: var(--surface-raised);
  border: 1px solid var(--edge-soft);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-quiet),
              border-color var(--dur-fast) var(--ease-quiet),
              color var(--dur-fast) var(--ease-quiet);
}
.qs-chip:hover {
  background: var(--surface-pressed);
  border-color: var(--edge-strong);
}
.qs-chip:active { transform: translateY(1px); }
.qs-chip .qs-chip__icon { color: var(--text-faint); transition: color var(--dur-fast) var(--ease-quiet); }
.qs-chip:hover .qs-chip__icon { color: var(--text-muted); }
.qs-chip--best {
  border-color: rgba(197, 137, 59, 0.45);
  background: var(--wash-ember);
}
.qs-chip--best:hover {
  border-color: var(--ember-500);
  background: rgba(197, 137, 59, 0.2);
}
.qs-chip--best .qs-chip__icon { color: var(--ember-500); }
.qs-chip__best-tag {
  font-size: 0.625rem;
  letter-spacing: var(--ls-stamp);
  text-transform: uppercase;
  color: var(--ember-400);
  border-left: 1px solid rgba(197, 137, 59, 0.35);
  padding-left: 7px;
}
`;

function injectChipCss() {
  if (typeof document === 'undefined' || document.getElementById('qs-chip-css')) return;
  const el = document.createElement('style');
  el.id = 'qs-chip-css';
  el.textContent = CHIP_CSS;
  document.head.appendChild(el);
}

export function SearchChip({ term, best = false, href, onClick, style, className }) {
  injectChipCss();
  const url = href || `https://www.pexels.com/search/videos/${encodeURIComponent(term)}/`;
  return (
    <a
      className={`qs-chip${best ? ' qs-chip--best' : ''}${className ? ' ' + className : ''}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      style={style}
      aria-label={`Search stock footage for “${term}”${best ? ' (best bet)' : ''}`}
    >
      <Icon name="search" size={13} className="qs-chip__icon" />
      <span>{term}</span>
      {best ? <span className="qs-chip__best-tag">best bet</span> : null}
    </a>
  );
}
```


---

## Stamp  
<sub>`components/display/Stamp.jsx`</sub>

Stamp is the small rubber-stamp badge used for mood tags on manuscript cards and quiet statuses.

```jsx
<Stamp>hopeful</Stamp>
<Stamp tone="ember">found</Stamp>
<Stamp tone="oxblood">tense</Stamp>
```

Tones: `neutral` (default, muted outline), `ember`, `oxblood`, `paper`. Text renders uppercase mono with wide tracking — keep it to one or two words.

```jsx
// Stamp — small rubber-stamp badge for moods and statuses.
import React from 'react';

const STAMP_CSS = `
.qs-stamp {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: var(--fs-meta);
  font-weight: 500;
  letter-spacing: var(--ls-stamp);
  text-transform: uppercase;
  line-height: 1;
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--edge-strong);
  color: var(--text-muted);
  background: transparent;
  white-space: nowrap;
}
.qs-stamp--ember {
  color: var(--ember-400);
  border-color: rgba(197, 137, 59, 0.45);
  background: var(--wash-ember);
}
.qs-stamp--oxblood {
  color: var(--oxblood-400);
  border-color: rgba(160, 68, 55, 0.5);
  background: var(--wash-oxblood);
}
.qs-stamp--paper {
  color: var(--text-body);
  border-color: var(--edge-strong);
  background: var(--wash-paper);
}
`;

function injectStampCss() {
  if (typeof document === 'undefined' || document.getElementById('qs-stamp-css')) return;
  const el = document.createElement('style');
  el.id = 'qs-stamp-css';
  el.textContent = STAMP_CSS;
  document.head.appendChild(el);
}

export function Stamp({ children, tone = 'neutral', style, className }) {
  injectStampCss();
  const toneClass = tone !== 'neutral' ? ` qs-stamp--${tone}` : '';
  return (
    <span className={`qs-stamp${toneClass}${className ? ' ' + className : ''}`} style={style}>
      {children}
    </span>
  );
}
```


---

## ManuscriptCard  
<sub>`components/manuscript/ManuscriptCard.jsx`</sub>

ManuscriptCard is the signature element — one shot-list segment as an index card: mono segment id + timing, oxblood index-card rule, the script excerpt typeset generously, mood stamp, clock duration, three ranked SearchChips, and a FoundCheckbox. When `found`, the card fades and gets a rotated ember "found" stamp.

```jsx
<ManuscriptCard
  index={3}
  startTime="0:42"
  endTime="1:05"
  excerpt="The city empties out after midnight, and that's when the real work begins."
  mood="tense"
  clipDurationSeconds={9}
  terms={['empty city street night', 'desk lamp writing', 'rain on window']}
  found={found}
  onFoundChange={setFound}
/>
```

Stack cards in a single column with `gap: var(--space-4)`. The kit's deal-in animation is applied by the parent via `style={{ animationDelay }}`.

```jsx
// ManuscriptCard — the signature element. One segment of the shot list,
// styled like an index card from a writer's desk. Found ⇒ set aside, faded,
// stamped.
import React from 'react';
import { Icon } from '../display/Icon.jsx';
import { Stamp } from '../display/Stamp.jsx';
import { SearchChip } from '../display/SearchChip.jsx';
import { FoundCheckbox } from '../actions/FoundCheckbox.jsx';

const MCARD_CSS = `
.qs-mcard {
  position: relative;
  background: var(--surface-card);
  border: var(--border-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card), var(--shadow-inset-paper);
  padding: var(--space-6);
  transition: border-color var(--dur-base) var(--ease-quiet),
              box-shadow var(--dur-base) var(--ease-quiet);
}
.qs-mcard__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid rgba(126, 43, 35, 0.4); /* index-card rule */
}
.qs-mcard__id {
  font-family: var(--font-mono);
  font-size: var(--fs-meta);
  letter-spacing: var(--ls-meta);
  color: var(--text-muted);
}
.qs-mcard__id strong {
  color: var(--text-body);
  font-weight: 600;
}
.qs-mcard__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.qs-mcard__clock {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: var(--fs-meta);
  letter-spacing: 0.04em;
  color: var(--text-faint);
  white-space: nowrap;
}
.qs-mcard__excerpt {
  font-family: var(--font-body);
  font-size: var(--fs-script);
  line-height: var(--lh-script);
  color: var(--text-body);
  max-width: var(--measure-script);
  margin: 0 0 var(--space-5) 0;
  transition: opacity var(--dur-base) var(--ease-quiet);
  text-wrap: pretty;
}
.qs-mcard__terms {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  transition: opacity var(--dur-base) var(--ease-quiet);
}
.qs-mcard__stampbox {
  position: absolute;
  top: var(--space-4);
  right: var(--space-5);
  transform: rotate(-5deg) scale(0.7);
  opacity: 0;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: var(--fs-meta);
  font-weight: 600;
  letter-spacing: var(--ls-stamp);
  text-transform: uppercase;
  color: var(--ember-400);
  border: 1.5px solid rgba(217, 164, 88, 0.65);
  border-radius: var(--radius-xs);
  padding: 5px 9px;
  transition: opacity var(--dur-base) var(--ease-settle),
              transform var(--dur-base) var(--ease-settle);
}
.qs-mcard--done { border-color: rgba(197, 137, 59, 0.28); }
.qs-mcard--done .qs-mcard__excerpt,
.qs-mcard--done .qs-mcard__terms,
.qs-mcard--done .qs-mcard__head { opacity: 0.45; }
.qs-mcard--done .qs-mcard__stampbox {
  opacity: 1;
  transform: rotate(-5deg) scale(1);
}
@media (max-width: 560px) {
  .qs-mcard { padding: var(--space-4); }
}
`;

function injectMcardCss() {
  if (typeof document === 'undefined' || document.getElementById('qs-mcard-css')) return;
  const el = document.createElement('style');
  el.id = 'qs-mcard-css';
  el.textContent = MCARD_CSS;
  document.head.appendChild(el);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function ManuscriptCard({
  index,
  startTime,
  endTime,
  excerpt,
  mood,
  moodTone = 'neutral',
  clipDurationSeconds,
  terms = [],
  found = false,
  onFoundChange,
  style,
  className,
}) {
  injectMcardCss();
  return (
    <article
      className={`qs-mcard${found ? ' qs-mcard--done' : ''}${className ? ' ' + className : ''}`}
      style={style}
    >
      <div className="qs-mcard__head">
        <span className="qs-mcard__id">
          <strong>{pad2(index)}</strong> · {startTime}–{endTime}
        </span>
        <span className="qs-mcard__meta">
          {mood ? <Stamp tone={moodTone}>{mood}</Stamp> : null}
          {clipDurationSeconds ? (
            <span className="qs-mcard__clock">
              <Icon name="clock" size={13} />
              ~{clipDurationSeconds}s clip
            </span>
          ) : null}
        </span>
      </div>

      <p className="qs-mcard__excerpt">{excerpt}</p>

      <div className="qs-mcard__terms">
        {terms.map((term, i) => (
          <SearchChip key={term + i} term={term} best={i === 0} />
        ))}
      </div>

      <FoundCheckbox checked={found} onChange={onFoundChange} />

      <span className="qs-mcard__stampbox" aria-hidden="true">
        <Icon name="circle-check" size={14} />
        found
      </span>
    </article>
  );
}
```


---

## ScriptTextarea  
<sub>`components/manuscript/ScriptTextarea.jsx`</sub>

ScriptTextarea is the manuscript page the writer pastes into — script-sized serif type, generous leading, italic placeholder in the product's voice.

```jsx
<ScriptTextarea value={script} onChange={setScript} />
```

Pair with a live word count + estimated runtime line below it (mono, muted). Keep it the only input on the page.

```jsx
// ScriptTextarea — a manuscript page to paste a script into.
import React from 'react';

const SCRIPTTA_CSS = `
.qs-scriptta {
  display: block;
  width: 100%;
  background: var(--surface-card);
  color: var(--text-body);
  border: var(--border-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card), var(--shadow-inset-paper);
  padding: var(--space-6);
  font-family: var(--font-body);
  font-size: var(--fs-script);
  line-height: var(--lh-script);
  resize: vertical;
  transition: border-color var(--dur-fast) var(--ease-quiet);
}
.qs-scriptta::placeholder {
  color: var(--text-faint);
  font-style: italic;
}
.qs-scriptta:hover { border-color: var(--edge-strong); }
.qs-scriptta:focus {
  outline: none;
  border-color: rgba(197, 137, 59, 0.55);
}
@media (max-width: 560px) {
  .qs-scriptta { padding: var(--space-4); }
}
`;

function injectScriptTaCss() {
  if (typeof document === 'undefined' || document.getElementById('qs-scriptta-css')) return;
  const el = document.createElement('style');
  el.id = 'qs-scriptta-css';
  el.textContent = SCRIPTTA_CSS;
  document.head.appendChild(el);
}

export function ScriptTextarea({
  value,
  onChange,
  placeholder = 'Paste your script. Every word of it.',
  minHeight = 280,
  ariaLabel = 'Your script',
  style,
  className,
}) {
  injectScriptTaCss();
  return (
    <textarea
      className={`qs-scriptta${className ? ' ' + className : ''}`}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      spellCheck={false}
      style={{ minHeight, ...style }}
    ></textarea>
  );
}
```
