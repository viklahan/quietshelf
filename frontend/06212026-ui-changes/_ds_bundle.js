/* @ds-bundle: {"format":3,"namespace":"QuietFightClubDesignSystem_fae847","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"FoundCheckbox","sourcePath":"components/actions/FoundCheckbox.jsx"},{"name":"Icon","sourcePath":"components/display/Icon.jsx"},{"name":"ProgressBar","sourcePath":"components/display/ProgressBar.jsx"},{"name":"SearchChip","sourcePath":"components/display/SearchChip.jsx"},{"name":"Stamp","sourcePath":"components/display/Stamp.jsx"},{"name":"ManuscriptCard","sourcePath":"components/manuscript/ManuscriptCard.jsx"},{"name":"ScriptTextarea","sourcePath":"components/manuscript/ScriptTextarea.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"6263a7b9f23d","components/actions/FoundCheckbox.jsx":"d2d2ea4de528","components/display/Icon.jsx":"27f26c2cbd5d","components/display/ProgressBar.jsx":"2083f7a45609","components/display/SearchChip.jsx":"0bd3bfcf4ad5","components/display/Stamp.jsx":"f05bf6c4fc16","components/manuscript/ManuscriptCard.jsx":"48d594d45e65","components/manuscript/ScriptTextarea.jsx":"e182f4d188b7","design_handoff_quiet_shelf/prototype/app.jsx":"2f78be9fed77","design_handoff_quiet_shelf/prototype/blurb.jsx":"75c2b3d955f9","design_handoff_quiet_shelf/prototype/data.js":"acb0e00458e9","design_handoff_quiet_shelf/prototype/format.jsx":"bf0aef92ef96","design_handoff_quiet_shelf/prototype/home.jsx":"b4fc505a546e","design_handoff_quiet_shelf/prototype/promote.jsx":"732254faa414","design_handoff_quiet_shelf/prototype/ui.jsx":"8cd32a209f24","quit-happens/app.jsx":"1a0b57d75a5d","quit-happens/cards.jsx":"9033d8e7ecbe","quit-happens/components.jsx":"d51028d82aeb","quit-happens/engine.js":"1f015bd4c8df","quit-happens/icons.jsx":"07ffd864d55f","quit-happens/results.jsx":"6983569fc09e","quit-happens/screens.jsx":"7c6724f6cdd2","ui_kits/quiet-shelf-promote/app.jsx":"8f4a9083e880","ui_kits/quiet-shelf-promote/engine.js":"e14a980c5717","ui_kits/quiet-shelf-promote/screens.jsx":"994c895d266a","ui_kits/quiet-shelf-promote/shotlist.jsx":"7de5e9ba6d34","ui_kits/quiet-shelf/app.jsx":"2f78be9fed77","ui_kits/quiet-shelf/blurb.jsx":"75c2b3d955f9","ui_kits/quiet-shelf/data.js":"acb0e00458e9","ui_kits/quiet-shelf/format.jsx":"bf0aef92ef96","ui_kits/quiet-shelf/home.jsx":"b4fc505a546e","ui_kits/quiet-shelf/promote.jsx":"732254faa414","ui_kits/quiet-shelf/ui.jsx":"8cd32a209f24"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.QuietFightClubDesignSystem_fae847 = window.QuietFightClubDesignSystem_fae847 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/display/Icon.jsx
try { (() => {
// Icon — Quiet Shelf's lucide subset, inlined from lucide-static@0.453.0 (ISC).
// Quiet, consistent 2px stroke. Icons are small and never decorative noise.

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
  "arrow-right": "<path d=\"M5 12h14\"></path> <path d=\"m12 5 7 7-7 7\"></path>"
};
function Icon({
  name,
  size = 16,
  strokeWidth = 2,
  color = 'currentColor',
  style,
  className,
  title
}) {
  const inner = ICON_PATHS[name];
  if (!inner) return null;
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": title ? undefined : true,
    role: title ? 'img' : undefined,
    className: className,
    style: {
      flexShrink: 0,
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: (title ? '<title>' + title + '</title>' : '') + inner
    }
  });
}
Icon.names = Object.keys(ICON_PATHS);
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Icon.jsx", error: String((e && e.message) || e) }); }

// components/actions/Button.jsx
try { (() => {
// Button — mono, letterspaced, typewriter-stamp buttons. One primary per view.

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
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconAfter,
  disabled = false,
  onClick,
  ariaLabel,
  style,
  className
}) {
  injectButtonCss();
  const iconSize = size === 'lg' ? 16 : 14;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `qs-btn qs-btn--${variant} qs-btn--${size}${className ? ' ' + className : ''}`,
    disabled: disabled,
    onClick: onClick,
    "aria-label": ariaLabel,
    style: style
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: iconSize
  }) : null, children, iconAfter ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconAfter,
    size: iconSize
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/FoundCheckbox.jsx
try { (() => {
// FoundCheckbox — the satisfying "Found it" check. Quiet box, ember check.

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
function FoundCheckbox({
  checked = false,
  onChange,
  label = 'Found it',
  style,
  className
}) {
  injectFoundCss();
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "checkbox",
    "aria-checked": checked,
    className: `qs-found${className ? ' ' + className : ''}`,
    onClick: () => onChange && onChange(!checked),
    style: style
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-found__box",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 13,
    strokeWidth: 3,
    className: "qs-found__check"
  })), /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { FoundCheckbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/FoundCheckbox.jsx", error: String((e && e.message) || e) }); }

// components/display/ProgressBar.jsx
try { (() => {
// ProgressBar — thin, quiet progress indicator.

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
function ProgressBar({
  value = 0,
  label,
  style,
  className
}) {
  injectProgressCss();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return /*#__PURE__*/React.createElement("div", {
    className: `qs-progress${className ? ' ' + className : ''}`,
    style: style,
    role: "progressbar",
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": Math.round(pct),
    "aria-label": label || 'Progress'
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "qs-progress__label"
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    className: "qs-progress__track"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-progress__fill",
    style: {
      width: pct + '%'
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/display/SearchChip.jsx
try { (() => {
// SearchChip — a clickable search-term tab that opens a stock-footage search.

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
function SearchChip({
  term,
  best = false,
  href,
  onClick,
  style,
  className
}) {
  injectChipCss();
  const url = href || `https://www.pexels.com/search/videos/${encodeURIComponent(term)}/`;
  return /*#__PURE__*/React.createElement("a", {
    className: `qs-chip${best ? ' qs-chip--best' : ''}${className ? ' ' + className : ''}`,
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: onClick,
    style: style,
    "aria-label": `Search stock footage for “${term}”${best ? ' (best bet)' : ''}`
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 13,
    className: "qs-chip__icon"
  }), /*#__PURE__*/React.createElement("span", null, term), best ? /*#__PURE__*/React.createElement("span", {
    className: "qs-chip__best-tag"
  }, "best bet") : null);
}
Object.assign(__ds_scope, { SearchChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/SearchChip.jsx", error: String((e && e.message) || e) }); }

// components/display/Stamp.jsx
try { (() => {
// Stamp — small rubber-stamp badge for moods and statuses.

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
function Stamp({
  children,
  tone = 'neutral',
  style,
  className
}) {
  injectStampCss();
  const toneClass = tone !== 'neutral' ? ` qs-stamp--${tone}` : '';
  return /*#__PURE__*/React.createElement("span", {
    className: `qs-stamp${toneClass}${className ? ' ' + className : ''}`,
    style: style
  }, children);
}
Object.assign(__ds_scope, { Stamp });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Stamp.jsx", error: String((e && e.message) || e) }); }

// components/manuscript/ManuscriptCard.jsx
try { (() => {
// ManuscriptCard — the signature element. One segment of the shot list,
// styled like an index card from a writer's desk. Found ⇒ set aside, faded,
// stamped.

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
function ManuscriptCard({
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
  className
}) {
  injectMcardCss();
  return /*#__PURE__*/React.createElement("article", {
    className: `qs-mcard${found ? ' qs-mcard--done' : ''}${className ? ' ' + className : ''}`,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-mcard__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-mcard__id"
  }, /*#__PURE__*/React.createElement("strong", null, pad2(index)), " \xB7 ", startTime, "\u2013", endTime), /*#__PURE__*/React.createElement("span", {
    className: "qs-mcard__meta"
  }, mood ? /*#__PURE__*/React.createElement(__ds_scope.Stamp, {
    tone: moodTone
  }, mood) : null, clipDurationSeconds ? /*#__PURE__*/React.createElement("span", {
    className: "qs-mcard__clock"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "clock",
    size: 13
  }), "~", clipDurationSeconds, "s clip") : null)), /*#__PURE__*/React.createElement("p", {
    className: "qs-mcard__excerpt"
  }, excerpt), /*#__PURE__*/React.createElement("div", {
    className: "qs-mcard__terms"
  }, terms.map((term, i) => /*#__PURE__*/React.createElement(__ds_scope.SearchChip, {
    key: term + i,
    term: term,
    best: i === 0
  }))), /*#__PURE__*/React.createElement(__ds_scope.FoundCheckbox, {
    checked: found,
    onChange: onFoundChange
  }), /*#__PURE__*/React.createElement("span", {
    className: "qs-mcard__stampbox",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "circle-check",
    size: 14
  }), "found"));
}
Object.assign(__ds_scope, { ManuscriptCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/manuscript/ManuscriptCard.jsx", error: String((e && e.message) || e) }); }

// components/manuscript/ScriptTextarea.jsx
try { (() => {
// ScriptTextarea — a manuscript page to paste a script into.

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
function ScriptTextarea({
  value,
  onChange,
  placeholder = 'Paste your script. Every word of it.',
  minHeight = 280,
  ariaLabel = 'Your script',
  style,
  className
}) {
  injectScriptTaCss();
  return /*#__PURE__*/React.createElement("textarea", {
    className: `qs-scriptta${className ? ' ' + className : ''}`,
    value: value,
    onChange: e => onChange && onChange(e.target.value),
    placeholder: placeholder,
    "aria-label": ariaLabel,
    spellCheck: false,
    style: {
      minHeight,
      ...style
    }
  });
}
Object.assign(__ds_scope, { ScriptTextarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/manuscript/ScriptTextarea.jsx", error: String((e && e.message) || e) }); }

// design_handoff_quiet_shelf/prototype/app.jsx
try { (() => {
/* Quiet Shelf — app root. Quiet header, four routes, no storage. */
const QSDS_app = window.QuietFightClubDesignSystem_fae847;
const {
  Icon: QSIcoApp
} = QSDS_app;
const QS_TABS = [{
  id: 'format',
  label: 'Format',
  icon: 'book-open'
}, {
  id: 'blurb',
  label: 'Blurb',
  icon: 'feather'
}, {
  id: 'promote',
  label: 'Promote',
  icon: 'film'
}];
function App() {
  const [tab, setTab] = React.useState('home');
  React.useEffect(() => {
    window.scrollTo({
      top: 0
    });
  }, [tab]);
  let view = null;
  if (tab === 'home') view = /*#__PURE__*/React.createElement(window.Home, {
    onNavigate: setTab
  });else if (tab === 'format') view = /*#__PURE__*/React.createElement(window.Format, null);else if (tab === 'blurb') view = /*#__PURE__*/React.createElement(window.Blurb, null);else if (tab === 'promote') view = /*#__PURE__*/React.createElement(window.Promote, null);
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-app"
  }, /*#__PURE__*/React.createElement("header", {
    className: "qs-header"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-brand",
    onClick: () => setTab('home'),
    "aria-label": "Quiet Shelf, home"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-brand__name"
  }, "Quiet Shelf"), /*#__PURE__*/React.createElement("span", {
    className: "qs-brand__sub"
  }, "Your story, made real.")), /*#__PURE__*/React.createElement("nav", {
    className: "qs-nav",
    "aria-label": "Sections"
  }, QS_TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    type: "button",
    className: `qs-nav__tab${tab === t.id ? ' qs-nav__tab--active' : ''}`,
    onClick: () => setTab(t.id),
    "aria-current": tab === t.id ? 'page' : undefined
  }, /*#__PURE__*/React.createElement(QSIcoApp, {
    name: t.icon,
    size: 15,
    className: "qs-nav__ico"
  }), /*#__PURE__*/React.createElement("span", null, t.label))))), /*#__PURE__*/React.createElement("main", {
    className: "qs-main",
    key: tab
  }, view));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_quiet_shelf/prototype/app.jsx", error: String((e && e.message) || e) }); }

// design_handoff_quiet_shelf/prototype/blurb.jsx
try { (() => {
/* Quiet Shelf — Blurb. Paste/bring → tone → calm loading → copyable cards. */
const QSDS_blurb = window.QuietFightClubDesignSystem_fae847;
const {
  Button: QSBtnBlurb,
  Icon: QSIcoBlurb,
  ScriptTextarea
} = QSDS_blurb;
const QS_TONES = [{
  id: 'warm',
  label: 'Warm'
}, {
  id: 'literary',
  label: 'Literary'
}, {
  id: 'punchy',
  label: 'Punchy'
}, {
  id: 'mysterious',
  label: 'Mysterious'
}];
function RCard({
  label,
  copyText,
  children
}) {
  const {
    CopyButton
  } = window;
  return /*#__PURE__*/React.createElement("section", {
    className: "qs-rcard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-rcard__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-rcard__label"
  }, label), copyText != null ? /*#__PURE__*/React.createElement(CopyButton, {
    text: copyText
  }) : null), children);
}
function Blurb() {
  const {
    Becoming
  } = window;
  const data = window.QS_DATA.blurb;
  const [phase, setPhase] = React.useState('compose'); // compose | becoming | done
  const [text, setText] = React.useState('');
  const [tone, setTone] = React.useState('warm');
  const [error, setError] = React.useState('');
  const fileRef = React.useRef(null);
  function onPick(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!['doc', 'docx', 'rtf', 'txt'].includes(ext)) {
      setError('I can only read Word, RTF, or text files for now. Try one of those?');
      return;
    }
    setError('');
    setText(`[${f.name}]\nYour manuscript is ready. Press Find my words whenever you like.`);
  }
  function find() {
    if (!text.trim()) {
      setError('There’s no story here yet. Paste it in, or bring the file.');
      return;
    }
    setError('');
    setPhase('becoming');
  }
  if (phase === 'becoming') {
    return /*#__PURE__*/React.createElement("div", {
      className: "qs-page qs-page--narrow"
    }, /*#__PURE__*/React.createElement(Becoming, {
      lines: ['Reading between the lines…', 'Listening for the heart of it…', 'Finding your words…'],
      sub: "Almost there.",
      duration: 3600,
      onDone: () => setPhase('done')
    }));
  }
  if (phase === 'done') {
    const taglineCopy = data.taglines.map((t, i) => `${i + 1}. ${t}`).join('\n');
    return /*#__PURE__*/React.createElement("div", {
      className: "qs-page qs-page--narrow"
    }, /*#__PURE__*/React.createElement("p", {
      className: "qs-lead"
    }, "Here are your words. Take the ones that feel like the book."), /*#__PURE__*/React.createElement("div", {
      className: "qs-results"
    }, /*#__PURE__*/React.createElement(RCard, {
      label: "Back-cover copy",
      copyText: data.backCover
    }, /*#__PURE__*/React.createElement("p", {
      className: "qs-backcover"
    }, data.backCover)), /*#__PURE__*/React.createElement(RCard, {
      label: "Taglines",
      copyText: taglineCopy
    }, /*#__PURE__*/React.createElement("ul", {
      className: "qs-taglines"
    }, data.taglines.map((t, i) => /*#__PURE__*/React.createElement("li", {
      className: "qs-tagline",
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      className: "qs-tagline__n"
    }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("span", null, t))))), /*#__PURE__*/React.createElement(RCard, {
      label: "Store description",
      copyText: data.storeDescription
    }, /*#__PURE__*/React.createElement("p", {
      className: "qs-store"
    }, data.storeDescription)), /*#__PURE__*/React.createElement(RCard, {
      label: "Suggested keywords",
      copyText: data.keywords.join(', ')
    }, /*#__PURE__*/React.createElement("div", {
      className: "qs-keywords"
    }, data.keywords.map(k => /*#__PURE__*/React.createElement("span", {
      className: "qs-kw",
      key: k
    }, k))))), /*#__PURE__*/React.createElement("div", {
      className: "qs-actionrow"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "qs-payoff__again",
      onClick: () => setPhase('compose')
    }, /*#__PURE__*/React.createElement(QSIcoBlurb, {
      name: "rotate-ccw",
      size: 13
    }), "Try a different tone")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-page qs-page--narrow"
  }, /*#__PURE__*/React.createElement("p", {
    className: "qs-lead"
  }, "Paste your story, or bring the file. I\u2019ll find the words to describe it."), /*#__PURE__*/React.createElement("div", {
    className: "qs-step"
  }, /*#__PURE__*/React.createElement(ScriptTextarea, {
    value: text,
    onChange: setText,
    placeholder: "Paste your story here\u2026",
    minHeight: 220,
    ariaLabel: "Your story"
  }), /*#__PURE__*/React.createElement("div", {
    className: "qs-actionrow",
    style: {
      marginTop: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: ".doc,.docx,.rtf,.txt",
    onChange: onPick,
    style: {
      display: 'none'
    },
    "aria-hidden": "true",
    tabIndex: -1
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-payoff__again",
    onClick: () => fileRef.current && fileRef.current.click()
  }, /*#__PURE__*/React.createElement(QSIcoBlurb, {
    name: "file-text",
    size: 13
  }), "Bring the file instead")), error ? /*#__PURE__*/React.createElement("p", {
    className: "qs-note"
  }, /*#__PURE__*/React.createElement(QSIcoBlurb, {
    name: "circle-alert",
    size: 16
  }), error) : null), /*#__PURE__*/React.createElement("div", {
    className: "qs-step"
  }, /*#__PURE__*/React.createElement("p", {
    className: "qs-steplabel"
  }, "How should it sound?"), /*#__PURE__*/React.createElement("div", {
    className: "qs-pills"
  }, QS_TONES.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    type: "button",
    className: `qs-pill${tone === t.id ? ' qs-pill--on' : ''}`,
    onClick: () => setTone(t.id),
    "aria-pressed": tone === t.id
  }, t.label)))), /*#__PURE__*/React.createElement("div", {
    className: "qs-actionrow"
  }, /*#__PURE__*/React.createElement(QSBtnBlurb, {
    size: "lg",
    icon: "sparkles",
    onClick: find
  }, "Find my words")));
}
window.Blurb = Blurb;
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_quiet_shelf/prototype/blurb.jsx", error: String((e && e.message) || e) }); }

// design_handoff_quiet_shelf/prototype/data.js
try { (() => {
/* Quiet Shelf — sample content for the prototype.
   Believable stand-ins for what the real backend returns. No storage. */
window.QS_DATA = {
  // The book the writer is formatting in this demo.
  book: {
    title: 'The Lighthouse Keeper',
    author: 'E. M. Hale',
    fileName: 'the-lighthouse-keeper.docx'
  },
  // Tab 1 — Format. Each theme shows a SAMPLE of its real typesetting,
  // so the writer picks by feel.
  themes: [{
    id: 'classic',
    name: 'Classic Literary',
    note: 'Old-style serif, a drop cap, justified pages.',
    sample: 'It was the hour the lamp was lit, and the sea, for once, held its breath against the rocks below.',
    face: 'classic'
  }, {
    id: 'cozy',
    name: 'Cozy',
    note: 'Warm, roomy leading. A fireside read.',
    sample: 'She kept the kettle on past midnight, the way her mother had, listening for the gull that never came.',
    face: 'cozy'
  }, {
    id: 'modern',
    name: 'Modern Clean',
    note: 'Tight, quiet, plenty of air.',
    sample: 'The map said nothing of the island. He folded it anyway and set it beside the window.',
    face: 'modern'
  }, {
    id: 'children',
    name: "Children's",
    note: 'Big, gentle, generously spaced.',
    sample: 'And the little boat went out, and out, and out — until the harbour was just a freckle of gold.',
    face: 'children'
  }],
  // Tab 2 — Blurb. What "Find my words" returns.
  blurb: {
    backCover: 'For forty years, Aldous Finch has kept the light burning over Carrick Sound — and kept his own grief just as faithfully. Then a girl washes ashore with no memory and a name he hasn’t spoken aloud since the night the sea took everything from him.\n\nAs winter closes the harbour and the lamp begins to fail, the keeper must decide what a man owes to the living, and what he can finally let the tide carry away. A luminous, tender novel about the weight we tend and the grace of setting it down.',
    taglines: ['Some lights are kept. Some are forgiven.', 'Forty winters. One lamp. The grief he never let go dark.', 'The sea gives nothing back — until it does.'],
    storeDescription: 'A quiet, deeply felt debut about an aging lighthouse keeper, a stranger from the sea, and the long work of letting go. Perfect for readers of Claire Keegan and Robert Seethaler.',
    keywords: ['literary fiction', 'lighthouse', 'grief and healing', 'small coastal town', 'second chances', 'quiet literary novel', 'book club fiction']
  },
  // Tab 3 — Promote. Segment-by-segment visual map of the writer's piece.
  promoteSourceWordCount: 1284,
  segments: [{
    index: 1,
    startTime: '0:00',
    endTime: '0:14',
    excerpt: 'Before the lighthouse, before the town, there was only the rock — black, patient, and waiting for a reason to matter.',
    mood: 'Solemn',
    moodTone: 'paper',
    clipDurationSeconds: 9,
    terms: ['lone rock dark sea', 'storm waves crashing cliff', 'grey ocean horizon']
  }, {
    index: 2,
    startTime: '0:14',
    endTime: '0:31',
    excerpt: 'They built the tower stone by stone, and the keeper climbed it every dusk to light a flame against the dark.',
    mood: 'Hopeful',
    moodTone: 'ember',
    clipDurationSeconds: 11,
    terms: ['lighthouse lamp lit dusk', 'hands lighting old lantern', 'spiral staircase tower']
  }, {
    index: 3,
    startTime: '0:31',
    endTime: '0:48',
    excerpt: 'For forty years the light held. Ships passed safe in the night and never knew the man who kept them so.',
    mood: 'Tender',
    moodTone: 'paper',
    clipDurationSeconds: 10,
    terms: ['ship passing lighthouse night', 'beam sweeping over water', 'calm sea moonlight']
  }, {
    index: 4,
    startTime: '0:48',
    endTime: '1:09',
    excerpt: 'Then one winter the sea returned what it had taken — a girl, half-drowned, with no memory and his daughter’s eyes.',
    mood: 'Turning',
    moodTone: 'oxblood',
    clipDurationSeconds: 12,
    terms: ['figure on stormy beach', 'rescue from cold water', 'winter shoreline grey']
  }, {
    index: 5,
    startTime: '1:09',
    endTime: '1:27',
    excerpt: 'And the keeper learned the last thing the light had to teach him: that some things are kept by letting them go.',
    mood: 'Resolved',
    moodTone: 'ember',
    clipDurationSeconds: 11,
    terms: ['sunrise over calm harbour', 'open hands releasing', 'lighthouse dawn warm']
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_quiet_shelf/prototype/data.js", error: String((e && e.message) || e) }); }

// design_handoff_quiet_shelf/prototype/format.jsx
try { (() => {
/* Quiet Shelf — Format. The hero. compose → becoming → the book on the shelf. */
const QSDS_fmt = window.QuietFightClubDesignSystem_fae847;
const {
  Button: QSButton,
  Icon: QSIcon
} = QSDS_fmt;
const QS_ALLOWED = ['doc', 'docx', 'rtf', 'txt'];
function slugify(s) {
  return (s || 'your-book').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'your-book';
}
function ThemeCard({
  theme,
  selected,
  onSelect
}) {
  const faceClass = 'qs-face-' + theme.face;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `qs-theme${selected ? ' qs-theme--on' : ''}`,
    onClick: () => onSelect(theme.id),
    "aria-pressed": selected
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-theme__check",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(QSIcon, {
    name: "circle-check",
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "qs-theme__paper"
  }, /*#__PURE__*/React.createElement("p", {
    className: `qs-theme__sample ${faceClass}`
  }, theme.face === 'modern' ? /*#__PURE__*/React.createElement("span", {
    className: "qs-face-chapter"
  }, "Chapter One") : null, theme.sample)), /*#__PURE__*/React.createElement("span", {
    className: "qs-theme__name"
  }, theme.name), /*#__PURE__*/React.createElement("p", {
    className: "qs-theme__note"
  }, theme.note));
}
function Format() {
  const {
    Shelf,
    FinishedBook,
    Becoming,
    StepLabel
  } = window;
  const data = window.QS_DATA;
  const [phase, setPhase] = React.useState('compose'); // compose | becoming | done
  const [fileName, setFileName] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const [theme, setTheme] = React.useState('classic');
  const [coverName, setCoverName] = React.useState('');
  const [error, setError] = React.useState('');
  const fileRef = React.useRef(null);
  const coverRef = React.useRef(null);
  function acceptStory(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (!QS_ALLOWED.includes(ext)) {
      setError('I can only read Word, RTF, or text files for now. Try one of those?');
      return;
    }
    setError('');
    setFileName(name);
    if (!title) setTitle(data.book.title);
    if (!author) setAuthor(data.book.author);
  }
  function onPickStory(e) {
    const f = e.target.files && e.target.files[0];
    if (f) acceptStory(f.name);
  }
  function onPickCover(e) {
    const f = e.target.files && e.target.files[0];
    if (f) setCoverName(f.name);
  }
  function begin() {
    if (!fileName) {
      setError('Bring me your story first — then we’ll begin.');
      return;
    }
    setError('');
    setPhase('becoming');
  }
  function reset() {
    setPhase('compose');
    setFileName('');
    setTitle('');
    setAuthor('');
    setCoverName('');
    setTheme('classic');
    setError('');
  }
  function download() {
    const name = slugify(title || data.book.title) + '.epub';
    const blob = new Blob([`Quiet Shelf — ${title || data.book.title} by ${author || data.book.author}.\n(Demo file.)`], {
      type: 'application/epub+zip'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (phase === 'becoming') {
    return /*#__PURE__*/React.createElement("div", {
      className: "qs-page qs-page--narrow"
    }, /*#__PURE__*/React.createElement(Becoming, {
      lines: ['Reading your story…', 'Setting your words…', 'Binding the pages…'],
      sub: "This takes a moment. Stay a while.",
      onDone: () => setPhase('done')
    }));
  }
  if (phase === 'done') {
    return /*#__PURE__*/React.createElement("div", {
      className: "qs-page qs-page--narrow qs-payoff"
    }, /*#__PURE__*/React.createElement("p", {
      className: "qs-payoff__title"
    }, "It\u2019s a book now."), /*#__PURE__*/React.createElement("p", {
      className: "qs-payoff__sub"
    }, "Your story, on the shelf \u2014 real."), /*#__PURE__*/React.createElement("div", {
      className: "qs-shelfwrap qs-shelfwrap--lg"
    }, /*#__PURE__*/React.createElement(Shelf, {
      lit: true
    }, /*#__PURE__*/React.createElement(FinishedBook, {
      title: title || data.book.title,
      author: author || data.book.author
    }))), /*#__PURE__*/React.createElement("div", {
      className: "qs-payoff__action"
    }, /*#__PURE__*/React.createElement(QSButton, {
      size: "lg",
      icon: "book-open",
      onClick: download
    }, "Download your ebook"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "qs-payoff__again",
      onClick: reset
    }, /*#__PURE__*/React.createElement(QSIcon, {
      name: "rotate-ccw",
      size: 13
    }), "Format another")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-page qs-page--narrow"
  }, /*#__PURE__*/React.createElement("p", {
    className: "qs-lead"
  }, "Turn your manuscript into a beautiful book. One calm step at a time."), /*#__PURE__*/React.createElement("div", {
    className: "qs-step"
  }, /*#__PURE__*/React.createElement(StepLabel, {
    n: "1"
  }, "Bring your story"), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: ".doc,.docx,.rtf,.txt",
    onChange: onPickStory,
    style: {
      display: 'none'
    },
    "aria-hidden": "true",
    tabIndex: -1
  }), fileName ? /*#__PURE__*/React.createElement("div", {
    className: "qs-file qs-drop--filled"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-file__name"
  }, /*#__PURE__*/React.createElement(QSIcon, {
    name: "file-text",
    size: 18,
    className: "qs-file__ico"
  }), fileName), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-payoff__again",
    onClick: () => fileRef.current && fileRef.current.click()
  }, "Change")) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-drop",
    onClick: () => fileRef.current && fileRef.current.click()
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-drop__ico"
  }, /*#__PURE__*/React.createElement(QSIcon, {
    name: "book-open",
    size: 28
  })), /*#__PURE__*/React.createElement("p", {
    className: "qs-drop__line"
  }, "Bring me your story."), /*#__PURE__*/React.createElement("p", {
    className: "qs-drop__hint"
  }, "Word, RTF, or text")), error ? /*#__PURE__*/React.createElement("p", {
    className: "qs-note"
  }, /*#__PURE__*/React.createElement(QSIcon, {
    name: "circle-alert",
    size: 16
  }), error) : null), /*#__PURE__*/React.createElement("div", {
    className: "qs-step"
  }, /*#__PURE__*/React.createElement(StepLabel, {
    n: "2"
  }, "Title & author"), /*#__PURE__*/React.createElement("div", {
    className: "qs-fields qs-fields--two"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "qs-field__label",
    htmlFor: "qs-title"
  }, "Title"), /*#__PURE__*/React.createElement("input", {
    id: "qs-title",
    className: "qs-input",
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: "The name on the cover"
  })), /*#__PURE__*/React.createElement("div", {
    className: "qs-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "qs-field__label",
    htmlFor: "qs-author"
  }, "Author"), /*#__PURE__*/React.createElement("input", {
    id: "qs-author",
    className: "qs-input",
    value: author,
    onChange: e => setAuthor(e.target.value),
    placeholder: "Your name"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "qs-step"
  }, /*#__PURE__*/React.createElement(StepLabel, {
    n: "3"
  }, "Choose a feeling"), /*#__PURE__*/React.createElement("div", {
    className: "qs-themes"
  }, data.themes.map(t => /*#__PURE__*/React.createElement(ThemeCard, {
    key: t.id,
    theme: t,
    selected: theme === t.id,
    onSelect: setTheme
  })))), /*#__PURE__*/React.createElement("div", {
    className: "qs-step"
  }, /*#__PURE__*/React.createElement(StepLabel, {
    n: "4"
  }, "Cover ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)',
      textTransform: 'none',
      letterSpacing: 0
    }
  }, "\u2014 optional")), /*#__PURE__*/React.createElement("input", {
    ref: coverRef,
    type: "file",
    accept: "image/*",
    onChange: onPickCover,
    style: {
      display: 'none'
    },
    "aria-hidden": "true",
    tabIndex: -1
  }), coverName ? /*#__PURE__*/React.createElement("div", {
    className: "qs-file qs-drop--filled"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-file__name"
  }, /*#__PURE__*/React.createElement(QSIcon, {
    name: "file-text",
    size: 18,
    className: "qs-file__ico"
  }), coverName), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-payoff__again",
    onClick: () => coverRef.current && coverRef.current.click()
  }, "Change")) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-drop",
    style: {
      padding: 'var(--space-8) var(--space-6)'
    },
    onClick: () => coverRef.current && coverRef.current.click()
  }, /*#__PURE__*/React.createElement("p", {
    className: "qs-drop__line",
    style: {
      fontSize: 'var(--fs-script)'
    }
  }, "Have a cover? Add it."), /*#__PURE__*/React.createElement("p", {
    className: "qs-drop__hint",
    style: {
      textTransform: 'none',
      letterSpacing: 0,
      fontFamily: 'var(--font-body)',
      fontStyle: 'italic'
    }
  }, "If not, I\u2019ll make a simple one."))), /*#__PURE__*/React.createElement("div", {
    className: "qs-actionrow"
  }, /*#__PURE__*/React.createElement(QSButton, {
    size: "lg",
    disabled: !fileName,
    onClick: begin
  }, "Begin"), /*#__PURE__*/React.createElement("span", {
    className: "qs-quiethint"
  }, "When you\u2019re ready. No rush.")));
}
window.Format = Format;
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_quiet_shelf/prototype/format.jsx", error: String((e && e.message) || e) }); }

// design_handoff_quiet_shelf/prototype/home.jsx
try { (() => {
/* Quiet Shelf — Home. Name, one warm line, three soft doorways, the shelf. */
const QSDS_home = window.QuietFightClubDesignSystem_fae847;
const {
  Icon: QSIconHome
} = QSDS_home;
function Door({
  icon,
  title,
  line,
  onOpen
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-door",
    onClick: onOpen
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-door__ico"
  }, /*#__PURE__*/React.createElement(QSIconHome, {
    name: icon,
    size: 20
  })), /*#__PURE__*/React.createElement("h2", {
    className: "qs-door__title"
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "qs-door__line"
  }, line), /*#__PURE__*/React.createElement("span", {
    className: "qs-door__go"
  }, "Open", /*#__PURE__*/React.createElement(QSIconHome, {
    name: "arrow-right",
    size: 13
  })));
}
function Home({
  onNavigate
}) {
  const Shelf = window.Shelf;
  const Spine = window.Spine;
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-page qs-home"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-home__hero"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "qs-home__name"
  }, "Quiet Shelf"), /*#__PURE__*/React.createElement("p", {
    className: "qs-home__tag"
  }, "Your story, made real."), /*#__PURE__*/React.createElement("p", {
    className: "qs-home__intro"
  }, "You\u2019ve carried this long enough. Set it down here, and let it become something you can hold. Choose where you\u2019d like to begin.")), /*#__PURE__*/React.createElement("div", {
    className: "qs-doors"
  }, /*#__PURE__*/React.createElement(Door, {
    icon: "book-open",
    title: "Format",
    line: "Turn your manuscript into a beautiful book.",
    onOpen: () => onNavigate('format')
  }), /*#__PURE__*/React.createElement(Door, {
    icon: "feather",
    title: "Blurb",
    line: "Find the words to describe your book.",
    onOpen: () => onNavigate('blurb')
  }), /*#__PURE__*/React.createElement(Door, {
    icon: "film",
    title: "Promote",
    line: "Turn your writing into a video plan.",
    onOpen: () => onNavigate('promote')
  })), /*#__PURE__*/React.createElement("div", {
    className: "qs-shelfwrap"
  }, /*#__PURE__*/React.createElement("p", {
    className: "qs-shelfcap"
  }, "Your shelf"), /*#__PURE__*/React.createElement(Shelf, null, /*#__PURE__*/React.createElement(Spine, {
    title: "Salt & Ember",
    height: 112
  }), /*#__PURE__*/React.createElement(Spine, {
    title: "The Quiet House",
    height: 132
  }), /*#__PURE__*/React.createElement(Spine, {
    title: "Coming home",
    height: 104,
    tone: "ember"
  }), /*#__PURE__*/React.createElement(Spine, {
    title: "Winterlight",
    height: 124
  }))));
}
window.Home = Home;
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_quiet_shelf/prototype/home.jsx", error: String((e && e.message) || e) }); }

// design_handoff_quiet_shelf/prototype/promote.jsx
try { (() => {
/* Quiet Shelf — Promote. Paste → word/runtime → calm map → segment cards. */
const QSDS_promo = window.QuietFightClubDesignSystem_fae847;
const {
  Button: QSBtnPromo,
  Icon: QSIcoPromo,
  ScriptTextarea: QSScriptTA,
  ManuscriptCard
} = QSDS_promo;
function countWords(s) {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}
function runtimeFromWords(w) {
  const secs = Math.round(w / 150 * 60); // ~150 narrated wpm
  const m = Math.floor(secs / 60),
    s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
function Promote() {
  const {
    Becoming,
    CopyButton
  } = window;
  const data = window.QS_DATA;
  const [phase, setPhase] = React.useState('compose'); // compose | becoming | done
  const [text, setText] = React.useState('');
  const [error, setError] = React.useState('');
  const [found, setFound] = React.useState({});
  const words = countWords(text);
  const segs = data.segments;
  function map() {
    if (words < 40) {
      setError('This looks like a fragment. Paste the full piece for a proper visual map.');
      return;
    }
    setError('');
    setPhase('becoming');
  }
  function toggle(i, v) {
    setFound(p => ({
      ...p,
      [i]: v
    }));
  }
  const doneCount = segs.filter(s => found[s.index]).length;
  function notionText() {
    return segs.map(s => `## ${String(s.index).padStart(2, '0')} · ${s.startTime}–${s.endTime} · ${s.mood}\n` + `${s.excerpt}\n` + `Clip ~${s.clipDurationSeconds}s\n` + `Search: ${s.terms.join(' / ')}\n`).join('\n');
  }
  if (phase === 'becoming') {
    return /*#__PURE__*/React.createElement("div", {
      className: "qs-page"
    }, /*#__PURE__*/React.createElement(Becoming, {
      lines: ['Reading your piece…', 'Breaking it into scenes…', 'Mapping the visuals…'],
      sub: "Mapping your footage.",
      duration: 3600,
      onDone: () => setPhase('done')
    }));
  }
  if (phase === 'done') {
    return /*#__PURE__*/React.createElement("div", {
      className: "qs-page"
    }, /*#__PURE__*/React.createElement("p", {
      className: "qs-lead"
    }, "Your visuals, scene by scene. Open a search, find the clip, check it off."), /*#__PURE__*/React.createElement("div", {
      className: "qs-mapline"
    }, /*#__PURE__*/React.createElement(QSIcoPromo, {
      name: "list-checks",
      size: 16
    }), /*#__PURE__*/React.createElement("span", {
      className: "qs-mapline__count"
    }, String(doneCount).padStart(2, '0'), " of ", String(segs.length).padStart(2, '0'), " mapped"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(CopyButton, {
      text: notionText(),
      label: "Copy for Notion"
    })), /*#__PURE__*/React.createElement("div", {
      className: "qs-board"
    }, segs.map((s, idx) => /*#__PURE__*/React.createElement("div", {
      className: "qs-deal",
      key: s.index,
      style: {
        animationDelay: idx * 60 + 'ms'
      }
    }, /*#__PURE__*/React.createElement(ManuscriptCard, {
      index: s.index,
      startTime: s.startTime,
      endTime: s.endTime,
      excerpt: s.excerpt,
      mood: s.mood,
      moodTone: s.moodTone,
      clipDurationSeconds: s.clipDurationSeconds,
      terms: s.terms,
      found: !!found[s.index],
      onFoundChange: v => toggle(s.index, v)
    })))), /*#__PURE__*/React.createElement("div", {
      className: "qs-actionrow qs-actionrow--center",
      style: {
        marginTop: 'var(--space-12)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "qs-payoff__again",
      onClick: () => {
        setPhase('compose');
        setFound({});
      }
    }, /*#__PURE__*/React.createElement(QSIcoPromo, {
      name: "rotate-ccw",
      size: 13
    }), "Map a different piece")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-page"
  }, /*#__PURE__*/React.createElement("p", {
    className: "qs-lead"
  }, "Paste your writing. I\u2019ll map it into a calm shot-by-shot video plan."), /*#__PURE__*/React.createElement(QSScriptTA, {
    value: text,
    onChange: setText,
    placeholder: "Paste your writing here\u2026",
    minHeight: 260,
    ariaLabel: "Your writing"
  }), /*#__PURE__*/React.createElement("div", {
    className: "qs-meter"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, words.toLocaleString()), " words"), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, "\u2248 ", /*#__PURE__*/React.createElement("strong", null, runtimeFromWords(words)), " runtime")), error ? /*#__PURE__*/React.createElement("p", {
    className: "qs-note"
  }, /*#__PURE__*/React.createElement(QSIcoPromo, {
    name: "circle-alert",
    size: 16
  }), error) : null, /*#__PURE__*/React.createElement("div", {
    className: "qs-actionrow"
  }, /*#__PURE__*/React.createElement(QSBtnPromo, {
    size: "lg",
    icon: "sparkles",
    onClick: map
  }, "Map my visuals")));
}
window.Promote = Promote;
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_quiet_shelf/prototype/promote.jsx", error: String((e && e.message) || e) }); }

// design_handoff_quiet_shelf/prototype/ui.jsx
try { (() => {
/* Quiet Shelf — shared custom UI (shelf, finished book, the becoming, copy). */
const QSDS = window.QuietFightClubDesignSystem_fae847;
const {
  Icon
} = QSDS;

/* copy-to-clipboard with a soft, brief "copied" confirmation -------- */
function useCopied(timeout = 1600) {
  const [copied, setCopied] = React.useState(false);
  const tref = React.useRef(null);
  const copy = React.useCallback(text => {
    const done = () => {
      setCopied(true);
      clearTimeout(tref.current);
      tref.current = setTimeout(() => setCopied(false), timeout);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      done();
    }
  }, [timeout]);
  React.useEffect(() => () => clearTimeout(tref.current), []);
  return [copied, copy];
}

/* a quiet "Copy" affordance that turns into "Copied" --------------- */
function CopyButton({
  text,
  label = 'Copy',
  ariaLabel
}) {
  const [copied, copy] = useCopied();
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `qs-copy${copied ? ' qs-copy--done' : ''}`,
    onClick: () => copy(text),
    "aria-label": ariaLabel || (copied ? 'Copied' : label)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: copied ? 'check' : 'copy',
    size: 13,
    strokeWidth: copied ? 3 : 2
  }), copied ? 'Copied' : label);
}

/* The wooden shelf. Children are whatever rests on it (book/spines). */
function Shelf({
  children,
  lit = false,
  className
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `qs-shelf${lit ? ' qs-shelf--lit' : ''}${className ? ' ' + className : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-shelf__glow",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "qs-shelf__books"
  }, children), /*#__PURE__*/React.createElement("div", {
    className: "qs-shelf__plank"
  }), /*#__PURE__*/React.createElement("div", {
    className: "qs-shelf__lip"
  }));
}

/* A book spine standing on the shelf (home: earlier finished works). */
function Spine({
  title,
  height = 118,
  tone
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `qs-spine${tone === 'ember' ? ' qs-spine--ember' : ''}`,
    style: {
      height
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-spine__t"
  }, title));
}

/* The finished book — front cover, spine, page edges. The payoff. */
function FinishedBook({
  title,
  author
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-bookstage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-book",
    role: "img",
    "aria-label": `${title} by ${author}, a finished ebook`
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-book__pages",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "qs-book__spine",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", null, title)), /*#__PURE__*/React.createElement("div", {
    className: "qs-book__face"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-book__rule",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "qs-book__title"
  }, title), /*#__PURE__*/React.createElement("span", {
    className: "qs-book__author"
  }, author))));
}

/* "The becoming" — calm loader cycling through reassuring lines. */
function Becoming({
  lines,
  sub,
  onDone,
  duration = 4200
}) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const per = Math.max(900, Math.floor(duration / lines.length));
    const step = setInterval(() => setI(p => Math.min(p + 1, lines.length - 1)), per);
    const finish = setTimeout(() => onDone && onDone(), duration);
    return () => {
      clearInterval(step);
      clearTimeout(finish);
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-becoming",
    role: "status",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-becoming__lamp",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("p", {
    className: "qs-becoming__line",
    key: i
  }, lines[i]), sub ? /*#__PURE__*/React.createElement("p", {
    className: "qs-becoming__sub"
  }, sub) : null);
}

/* A small numbered step heading. */
function StepLabel({
  n,
  children
}) {
  return /*#__PURE__*/React.createElement("p", {
    className: "qs-steplabel"
  }, n ? /*#__PURE__*/React.createElement("span", {
    className: "qs-steplabel__n"
  }, n) : null, children);
}
Object.assign(window, {
  useCopied,
  CopyButton,
  Shelf,
  Spine,
  FinishedBook,
  Becoming,
  StepLabel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_quiet_shelf/prototype/ui.jsx", error: String((e && e.message) || e) }); }

// quit-happens/app.jsx
try { (() => {
// QUIT HAPPENS — app shell + state machine.
// States: landing → scanning → results (+ toast on tailor, + error/empty).
const QH = window.QH;
const EngA = window.QHEngine;
const API_BASE = 'http://localhost:8000'; // configurable; unused in this mock build

function App() {
  const [phase, setPhase] = React.useState('landing'); // landing | scanning | results
  const [form, setForm] = React.useState({
    file: null,
    role: '',
    location: '',
    comp: '130000',
    remoteOnly: false,
    minScore: 55
  });
  const [progress, setProgress] = React.useState(null);
  const [results, setResults] = React.useState(null);
  const [starred, setStarred] = React.useState({});
  const [dealt, setDealt] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const timers = React.useRef([]);
  const toastTimer = React.useRef(null);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const after = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  };
  function set(patch) {
    setForm(f => ({
      ...f,
      ...patch
    }));
  }
  function startScan() {
    setPhase('scanning');
    runPipeline();
  }
  function runPipeline() {
    const steps = EngA.PIPELINE;
    const fileName = form.file ? form.file.name : 'resume.pdf';
    let counters = {
      found: 0,
      excluded: 0,
      scored: 0
    };
    setProgress({
      stepIdx: 0,
      sub: steps[0].subs[0],
      counters,
      fileName
    });

    // total jobs that will be found/excluded/scored in the demo
    const targetFound = 47,
      targetExcluded = 8,
      targetScored = 39;
    let elapsed = 0;
    const STEP_MS = 1500;
    steps.forEach((step, si) => {
      step.subs.forEach((subText, subi) => {
        const at = elapsed + subi * (STEP_MS / step.subs.length);
        after(() => {
          // advance counters during discover/gate/score
          setProgress(p => {
            const c = {
              ...p.counters
            };
            if (step.key === 'discover') c.found = Math.round(targetFound * ((subi + 1) / step.subs.length));
            if (step.key === 'gate') {
              c.found = targetFound;
              c.excluded = Math.round(targetExcluded * ((subi + 1) / step.subs.length));
            }
            if (step.key === 'score') {
              c.found = targetFound;
              c.excluded = targetExcluded;
              c.scored = Math.round(targetScored * ((subi + 1) / step.subs.length));
            }
            if (step.key === 'report') {
              c.found = targetFound;
              c.excluded = targetExcluded;
              c.scored = targetScored;
            }
            return {
              ...p,
              stepIdx: si,
              sub: subText,
              counters: c,
              fileName
            };
          });
        }, at);
      });
      elapsed += STEP_MS;
    });

    // finish
    after(() => {
      const r = EngA.buildResults(form.minScore);
      setResults(r);
      setStarred({});
      setDealt(true);
      setPhase('results');
      after(() => setDealt(false), 2600);
    }, elapsed + 300);
  }
  function cancelScan() {
    if (window.confirm('Stop this scan? Progress will be lost.')) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setPhase('landing');
    }
  }
  function newScan() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setResults(null);
    setStarred({});
    setProgress(null);
    setPhase('landing');
  }
  function toggleStar(id) {
    setStarred(s => ({
      ...s,
      [id]: !s[id]
    }));
  }
  function tailorResume(job) {
    // Real build: GET `${API_BASE}/api/tailor/${job.job_id}` → DOCX download.
    setToast({
      company: job.company,
      role: job.role
    });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, phase === 'landing' ? /*#__PURE__*/React.createElement(QH.Landing, {
    state: form,
    set: set,
    onScan: startScan
  }) : null, phase === 'scanning' && progress ? /*#__PURE__*/React.createElement(QH.Scanning, {
    progress: progress,
    onCancel: cancelScan,
    role: form.role
  }) : null, phase === 'results' && results ? /*#__PURE__*/React.createElement(QH.Results, {
    results: results,
    starred: starred,
    onStar: toggleStar,
    onTailor: tailorResume,
    onNewScan: newScan,
    dealt: dealt
  }) : null, toast ? /*#__PURE__*/React.createElement(Toast, {
    toast: toast,
    onClose: () => setToast(null)
  }) : null);
}
function Toast({
  toast,
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    className: "qh-rise",
    style: {
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 50,
      maxWidth: 360,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '14px 16px',
      background: 'var(--qh-surface-2)',
      border: '1px solid var(--qh-accent-dim)',
      borderRadius: 'var(--r-md)',
      boxShadow: '0 16px 40px -12px rgba(0,0,0,0.7), 0 0 30px -14px var(--qh-accent)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-check",
    size: 20,
    color: "var(--qh-accent)",
    style: {
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--qh-text)',
      fontWeight: 500
    }
  }, "Resume tailored for ", toast.company), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--qh-muted-2)',
      marginTop: 2
    }
  }, toast.role, " \u2014 downloading now")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--qh-muted)',
      padding: 2,
      marginTop: -2
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 16
  })));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "quit-happens/app.jsx", error: String((e && e.message) || e) }); }

// quit-happens/cards.jsx
try { (() => {
// QUIT HAPPENS — JobCard + ExcludedCard.
const QHc = window.QH;
const EngC = window.QHEngine;
function JobCard({
  job,
  index,
  starred,
  onStar,
  onTailor,
  dealt
}) {
  const [open, setOpen] = React.useState(false);
  const layers = job.layers;
  return /*#__PURE__*/React.createElement("article", {
    className: dealt ? 'qh-rise' : '',
    style: {
      background: 'var(--qh-surface)',
      border: '1px solid var(--qh-border)',
      borderRadius: 'var(--r-md)',
      padding: 18,
      animationDelay: dealt ? Math.min(index, 14) * 55 + 'ms' : undefined
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(QHc.RingBadge, {
    ring: job.ring
  }), /*#__PURE__*/React.createElement("span", {
    className: "qh-display",
    style: {
      fontSize: 17,
      fontWeight: 600
    }
  }, job.company), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qh-muted)'
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: 'var(--qh-text)'
    }
  }, job.role)), /*#__PURE__*/React.createElement("div", {
    className: "qh-mono",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 7,
      fontSize: 11.5,
      color: 'var(--qh-muted)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 12
  }), job.remote ? 'Remote' : 'On-site'), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 12
  }), "Posted ", job.posted), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "via ", job.source), job.layoff_flag ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      color: 'var(--qh-warning)',
      marginLeft: 2
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "triangle-alert",
    size: 12
  }), "layoff watch") : null)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onStar(job.job_id),
    "aria-label": starred ? 'Remove bookmark' : 'Bookmark job',
    "aria-pressed": starred,
    className: "qh-btn qh-btn--ghost qh-btn--sm",
    style: {
      padding: 8,
      color: starred ? 'var(--qh-warning)' : 'var(--qh-muted)',
      borderColor: starred ? 'var(--qh-warning)' : 'var(--qh-border-2)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "star",
    size: 16,
    color: starred ? 'var(--qh-warning)' : 'currentColor',
    style: starred ? {
      fill: 'var(--qh-warning)'
    } : null
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 13,
      color: 'var(--qh-muted-2)'
    }
  }, "Score"), /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: EngC.scoreColor(job.score),
      lineHeight: 1,
      minWidth: 38
    }
  }, job.score), /*#__PURE__*/React.createElement(QHc.ScoreBar, {
    score: job.score,
    height: 12,
    delay: index * 40
  }), /*#__PURE__*/React.createElement(QHc.RecLabel, {
    rec: job.recommendation
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(o => !o),
    "aria-expanded": open,
    "aria-label": "Toggle score breakdown",
    className: "qh-btn qh-btn--ghost qh-btn--sm",
    style: {
      padding: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 16,
    style: {
      transform: open ? 'rotate(180deg)' : 'none',
      transition: 'transform 200ms var(--ease)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(QHc.LayerRow, {
    code: "L1",
    name: "Semantic",
    score: layers.L1.score,
    delay: index * 40 + 80
  }), /*#__PURE__*/React.createElement(QHc.LayerRow, {
    code: "L2",
    name: "Domain",
    score: layers.L2.score,
    note: layers.L2.note,
    delay: index * 40 + 140
  }), /*#__PURE__*/React.createElement(QHc.LayerRow, {
    code: "L3",
    name: "Stability",
    score: layers.L3.score,
    delay: index * 40 + 200
  }), /*#__PURE__*/React.createElement(QHc.LayerRow, {
    code: "L4",
    name: "Comp Fit",
    score: layers.L4.score,
    delay: index * 40 + 260
  })), open ? /*#__PURE__*/React.createElement("div", {
    className: "qh-fade",
    style: {
      marginTop: 16,
      paddingTop: 16,
      borderTop: '1px solid var(--qh-border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 13,
      color: 'var(--qh-accent)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield",
    size: 15
  }), "Gate passed \u2014 no exclusions"), /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 12.5,
      color: 'var(--qh-muted-2)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "dollar-sign",
    size: 14
  }), job.comp), job.layoff_flag ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 13,
      color: 'var(--qh-warning)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "triangle-alert",
    size: 15
  }), "Recent layoffs reported \u2014 factored into L3") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 132,
      overflowY: 'auto',
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--qh-muted-2)',
      paddingRight: 8
    }
  }, job.description)) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qh-btn qh-btn--subtle qh-btn--sm"
  }, "View Job ", /*#__PURE__*/React.createElement(Icon, {
    name: "external-link",
    size: 14
  })), job.recommendation === 'STRONG_FIT' ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qh-btn qh-btn--primary qh-btn--sm",
    onClick: () => onTailor(job)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 14
  }), "Download Tailored Resume") : null));
}
function ExcludedCard({
  job
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      background: 'var(--qh-surface)',
      border: '1px solid var(--qh-border)',
      borderRadius: 'var(--r-sm)',
      opacity: 0.72
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-x",
    size: 16,
    color: "var(--qh-danger)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--qh-muted-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qh-text)',
      fontWeight: 500
    }
  }, job.company), " \xB7 ", job.role), /*#__PURE__*/React.createElement("div", {
    className: "qh-mono",
    style: {
      fontSize: 11,
      color: 'var(--qh-muted)',
      marginTop: 2
    }
  }, job.detail, " \xB7 via ", job.source)), /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--qh-danger)',
      border: '1px solid var(--qh-danger)',
      borderRadius: 4,
      padding: '3px 8px',
      whiteSpace: 'nowrap'
    }
  }, job.reason));
}
Object.assign(window.QH, {
  JobCard,
  ExcludedCard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "quit-happens/cards.jsx", error: String((e && e.message) || e) }); }

// quit-happens/components.jsx
try { (() => {
// QUIT HAPPENS — shared UI components.
const Eng = window.QHEngine;

// ── Logo ──────────────────────────────────────────────────────
function Logo({
  size = 'lg'
}) {
  const fs = size === 'sm' ? 18 : size === 'md' ? 24 : 30;
  return /*#__PURE__*/React.createElement("span", {
    className: "qh-display",
    style: {
      fontWeight: 700,
      fontSize: fs,
      letterSpacing: '-0.02em',
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qh-accent)'
    }
  }, "Q"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qh-text)'
    }
  }, "UIT\xA0HAPPENS"));
}

// ── Ring badge ────────────────────────────────────────────────
function RingBadge({
  ring
}) {
  const r = Eng.RINGS[ring];
  return /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    title: `Ring ${ring} — ${r.name}`,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.04em',
      padding: '3px 7px',
      borderRadius: 4,
      color: r.color,
      border: `1px solid ${r.color}`,
      background: 'transparent'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 99,
      background: r.color
    }
  }), r.label);
}

// ── Recommendation label ──────────────────────────────────────
function RecLabel({
  rec
}) {
  const color = Eng.recColor(rec);
  return /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.06em',
      color
    }
  }, Eng.recLabel(rec));
}

// ── Score bar (fills on mount) ────────────────────────────────
function ScoreBar({
  score,
  height = 10,
  delay = 0,
  showTrack = true,
  colorOverride
}) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setW(score), 40 + delay);
    return () => clearTimeout(t);
  }, [score, delay]);
  const color = colorOverride || Eng.scoreColor(score);
  return /*#__PURE__*/React.createElement("div", {
    role: "progressbar",
    "aria-valuenow": score,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    style: {
      flex: 1,
      height,
      background: showTrack ? 'var(--qh-border)' : 'transparent',
      borderRadius: 99,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: w + '%',
      height: '100%',
      background: color,
      borderRadius: 99,
      transition: 'width 900ms var(--ease)'
    }
  }));
}

// ── Layer breakdown row (L1–L4) ───────────────────────────────
function LayerRow({
  code,
  name,
  score,
  note,
  delay
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '116px 1fr 34px',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 12,
      color: 'var(--qh-muted-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qh-text)'
    }
  }, code), " ", name), /*#__PURE__*/React.createElement(ScoreBar, {
    score: score,
    height: 7,
    delay: delay
  }), /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 12,
      fontWeight: 600,
      textAlign: 'right',
      color: 'var(--qh-text)'
    }
  }, score), note ? /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      gridColumn: '2 / 4',
      fontSize: 10.5,
      color: 'var(--qh-accent)',
      letterSpacing: '0.03em',
      marginTop: -4
    }
  }, "\u21B3 ", note) : null);
}

// ── Pill toggle ───────────────────────────────────────────────
function PillToggle({
  on,
  onChange,
  label,
  id
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": on,
    "aria-label": label,
    id: id,
    onClick: () => onChange(!on),
    style: {
      width: 44,
      height: 24,
      borderRadius: 99,
      border: '1px solid var(--qh-border-2)',
      background: on ? 'var(--qh-accent)' : 'var(--qh-surface-2)',
      position: 'relative',
      transition: 'background 160ms var(--ease)',
      padding: 0,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: on ? 22 : 2,
      width: 18,
      height: 18,
      borderRadius: 99,
      background: on ? '#06281c' : 'var(--qh-muted)',
      transition: 'left 160ms var(--ease), background 160ms var(--ease)'
    }
  }));
}

// ── Filter pill ───────────────────────────────────────────────
function FilterPill({
  active,
  onClick,
  children,
  count,
  color
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      fontWeight: 600,
      padding: '7px 13px',
      borderRadius: 99,
      border: `1px solid ${active ? 'transparent' : 'var(--qh-border-2)'}`,
      background: active ? 'var(--qh-text)' : 'transparent',
      color: active ? '#0D0D0D' : 'var(--qh-muted-2)',
      transition: 'all 140ms var(--ease)'
    }
  }, color && !active ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 99,
      background: color
    }
  }) : null, children, typeof count === 'number' ? /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 11,
      opacity: 0.7
    }
  }, count) : null);
}

// ── Donut chart (ring distribution) ───────────────────────────
function DonutChart({
  segments,
  size = 132,
  thickness = 18
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    role: "img",
    "aria-label": "Ring distribution donut chart"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: radius,
    fill: "none",
    stroke: "var(--qh-border)",
    strokeWidth: thickness
  }), segments.map((s, i) => {
    const len = s.value / total * circ;
    const el = /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: size / 2,
      cy: size / 2,
      r: radius,
      fill: "none",
      stroke: s.color,
      strokeWidth: thickness,
      strokeLinecap: "butt",
      strokeDasharray: `${len} ${circ - len}`,
      strokeDashoffset: -offset,
      transform: `rotate(-90 ${size / 2} ${size / 2})`,
      style: {
        transition: 'stroke-dasharray 800ms var(--ease)'
      }
    });
    offset += len;
    return el;
  }), /*#__PURE__*/React.createElement("text", {
    x: "50%",
    y: "47%",
    textAnchor: "middle",
    className: "qh-mono",
    fill: "var(--qh-text)",
    fontSize: "22",
    fontWeight: "700"
  }, total), /*#__PURE__*/React.createElement("text", {
    x: "50%",
    y: "62%",
    textAnchor: "middle",
    className: "qh-mono",
    fill: "var(--qh-muted)",
    fontSize: "9",
    letterSpacing: "1"
  }, "MATCHES")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, segments.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 3,
      background: s.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qh-muted-2)'
    }
  }, s.label), /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      color: 'var(--qh-text)',
      fontWeight: 600,
      marginLeft: 'auto'
    }
  }, s.value)))));
}

// ── Distribution bar chart (score bands) ──────────────────────
function DistBars({
  bands
}) {
  const max = Math.max(...bands.map(b => b.value), 1);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 12,
      height: 120,
      paddingTop: 8
    }
  }, bands.map((b, i) => {
    const [h, setH] = [b._h, null];
    return /*#__PURE__*/React.createElement(DistBar, {
      key: i,
      band: b,
      max: max,
      index: i
    });
  }));
}
function DistBar({
  band,
  max,
  index
}) {
  const [h, setH] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setH(band.value / max * 100), 80 + index * 90);
    return () => clearTimeout(t);
  }, [band.value, max, index]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      width: '100%',
      display: 'flex',
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: h + '%',
      background: band.color,
      borderRadius: '4px 4px 0 0',
      transition: 'height 760ms var(--ease)',
      minHeight: band.value ? 3 : 0
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--qh-text)'
    }
  }, band.value), /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 9.5,
      color: 'var(--qh-muted)',
      letterSpacing: '0.04em',
      textAlign: 'center'
    }
  }, band.label));
}
window.QH = window.QH || {};
Object.assign(window.QH, {
  Logo,
  RingBadge,
  RecLabel,
  ScoreBar,
  LayerRow,
  PillToggle,
  FilterPill,
  DonutChart,
  DistBars
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "quit-happens/components.jsx", error: String((e && e.message) || e) }); }

// quit-happens/engine.js
try { (() => {
// QUIT HAPPENS — mock career-intelligence engine.
// No backend. Generates a realistic scan + scored job results in-memory.
// Mirrors the API response shapes the real frontend would consume.

(function () {
  // ── Recommendation + color logic ──────────────────────────────
  function recFromScore(score) {
    if (score >= 75) return 'STRONG_FIT';
    if (score >= 60) return 'GOOD_FIT';
    return 'POSSIBLE';
  }
  function recLabel(rec) {
    return {
      STRONG_FIT: 'STRONG FIT',
      GOOD_FIT: 'GOOD FIT',
      POSSIBLE: 'POSSIBLE'
    }[rec];
  }
  // color by score band (green ≥75, amber 55–74, red <55)
  function scoreColor(score) {
    if (score >= 75) return 'var(--qh-accent)';
    if (score >= 55) return 'var(--qh-warning)';
    return 'var(--qh-danger)';
  }
  function recColor(rec) {
    return {
      STRONG_FIT: 'var(--qh-accent)',
      GOOD_FIT: 'var(--qh-blue)',
      POSSIBLE: 'var(--qh-warning)'
    }[rec];
  }
  const RINGS = {
    1: {
      label: 'R1',
      name: 'Domain Perfect',
      color: 'var(--qh-accent)'
    },
    2: {
      label: 'R2',
      name: 'Big Tech',
      color: 'var(--qh-blue)'
    },
    3: {
      label: 'R3',
      name: 'AI Startup',
      color: 'var(--qh-ring3)'
    }
  };

  // ── Seed job pool ─────────────────────────────────────────────
  const SOURCES = ['LinkedIn', 'Glassdoor', 'Indeed', 'Greenhouse'];
  const POOL = [{
    company: 'Netflix',
    role: 'Systems Administrator 4',
    ring: 1,
    remote: true,
    posted: 'Apr 17',
    source: 'LinkedIn',
    comp: '$165K–$210K',
    layoff: false,
    l: [76, 91, 78, 68]
  }, {
    company: 'Stripe',
    role: 'Infrastructure Engineer',
    ring: 2,
    remote: true,
    posted: 'Apr 16',
    source: 'Greenhouse',
    comp: '$180K–$240K',
    layoff: false,
    l: [82, 74, 85, 79]
  }, {
    company: 'Anthropic',
    role: 'Systems & Reliability Eng',
    ring: 3,
    remote: false,
    posted: 'Apr 18',
    source: 'Greenhouse',
    comp: '$190K–$260K',
    layoff: false,
    l: [88, 70, 62, 74]
  }, {
    company: 'Cloudflare',
    role: 'Sr. Linux Systems Admin',
    ring: 1,
    remote: true,
    posted: 'Apr 15',
    source: 'LinkedIn',
    comp: '$150K–$195K',
    layoff: false,
    l: [79, 89, 81, 72]
  }, {
    company: 'Databricks',
    role: 'Platform Operations Eng',
    ring: 2,
    remote: true,
    posted: 'Apr 14',
    source: 'Glassdoor',
    comp: '$175K–$225K',
    layoff: false,
    l: [73, 71, 76, 80]
  }, {
    company: 'Rivian',
    role: 'IT Systems Administrator',
    ring: 1,
    remote: false,
    posted: 'Apr 12',
    source: 'Indeed',
    comp: '$120K–$150K',
    layoff: true,
    l: [70, 84, 54, 64]
  }, {
    company: 'Notion',
    role: 'DevOps / SysAdmin',
    ring: 3,
    remote: true,
    posted: 'Apr 18',
    source: 'LinkedIn',
    comp: '$155K–$200K',
    layoff: false,
    l: [77, 66, 72, 76]
  }, {
    company: 'Palantir',
    role: 'Deployment Systems Eng',
    ring: 2,
    remote: false,
    posted: 'Apr 11',
    source: 'Greenhouse',
    comp: '$170K–$230K',
    layoff: false,
    l: [68, 72, 80, 70]
  }, {
    company: 'Coinbase',
    role: 'Site Reliability Engineer',
    ring: 2,
    remote: true,
    posted: 'Apr 13',
    source: 'Glassdoor',
    comp: '$165K–$215K',
    layoff: true,
    l: [71, 69, 51, 73]
  }, {
    company: 'Figma',
    role: 'Systems Administrator',
    ring: 3,
    remote: true,
    posted: 'Apr 17',
    source: 'LinkedIn',
    comp: '$145K–$185K',
    layoff: false,
    l: [74, 63, 79, 71]
  }, {
    company: 'Snowflake',
    role: 'Cloud Systems Admin',
    ring: 1,
    remote: true,
    posted: 'Apr 10',
    source: 'Indeed',
    comp: '$160K–$205K',
    layoff: false,
    l: [80, 87, 77, 69]
  }, {
    company: 'Discord',
    role: 'Infrastructure Operations',
    ring: 3,
    remote: true,
    posted: 'Apr 16',
    source: 'Greenhouse',
    comp: '$150K–$190K',
    layoff: false,
    l: [69, 61, 70, 67]
  }, {
    company: 'Reddit',
    role: 'Systems Administrator II',
    ring: 2,
    remote: true,
    posted: 'Apr 09',
    source: 'LinkedIn',
    comp: '$140K–$180K',
    layoff: false,
    l: [66, 68, 74, 62]
  }, {
    company: 'Airtable',
    role: 'IT & Systems Lead',
    ring: 3,
    remote: false,
    posted: 'Apr 15',
    source: 'Glassdoor',
    comp: '$135K–$175K',
    layoff: true,
    l: [64, 59, 49, 66]
  }, {
    company: 'Twilio',
    role: 'Platform Systems Admin',
    ring: 1,
    remote: true,
    posted: 'Apr 08',
    source: 'Indeed',
    comp: '$148K–$188K',
    layoff: false,
    l: [72, 85, 73, 65]
  }];
  const EXCLUDED = [{
    company: 'ByteDance',
    role: 'Senior SysAdmin',
    reason: 'Explicit visa exclusion',
    source: 'LinkedIn',
    detail: 'Posting requires citizenship not held; hard gate.'
  }, {
    company: 'Lockheed Martin',
    role: 'Systems Engineer',
    reason: 'Security clearance required',
    source: 'Indeed',
    detail: 'TS/SCI clearance gate — not held.'
  }, {
    company: 'Local Gov IT',
    role: 'Network Admin',
    reason: 'Location mismatch',
    source: 'Glassdoor',
    detail: 'On-site only, outside preferred radius.'
  }, {
    company: 'StartupXYZ',
    role: 'IT Generalist',
    reason: 'Below comp floor',
    source: 'Greenhouse',
    detail: 'Max $95K — under your $130K floor.'
  }, {
    company: 'Oracle',
    role: 'Cloud Operations',
    reason: 'Explicit visa exclusion',
    source: 'LinkedIn',
    detail: 'No sponsorship; gate failed.'
  }, {
    company: 'MegaCorp',
    role: 'Helpdesk Lead',
    reason: 'Role mismatch',
    source: 'Indeed',
    detail: 'Tier-1 support, below target seniority.'
  }, {
    company: 'Quantum Inc',
    role: 'Embedded Systems',
    reason: 'Location mismatch',
    source: 'Glassdoor',
    detail: 'Relocation required to closed metro.'
  }, {
    company: 'FinServe',
    role: 'Mainframe Admin',
    reason: 'Below comp floor',
    source: 'Greenhouse',
    detail: 'Max $110K — under your floor.'
  }];
  const JD = "We're hiring a systems administrator to own the reliability of our production fleet. You'll manage Linux infrastructure at scale, automate provisioning with Terraform and Ansible, and partner with SRE on incident response. The ideal candidate has 5+ years administering large heterogeneous environments, deep networking fundamentals, and a bias toward automating toil out of existence. This role is high-trust and high-autonomy — you set the standard for operational excellence.";
  function weightedScore(l, ring) {
    // L1 semantic .35, L2 domain .30, L3 stability .20, L4 comp .15
    let s = l[0] * 0.35 + l[1] * 0.30 + l[2] * 0.20 + l[3] * 0.15;
    if (ring === 1) s += 4; // Ring 1 boost
    return Math.min(99, Math.round(s));
  }
  function buildResults(minScore) {
    minScore = minScore || 55;
    const jobs = POOL.map((p, i) => {
      const score = weightedScore(p.l, p.ring);
      return {
        job_id: 'qh_' + String(1000 + i),
        company: p.company,
        role: p.role,
        ring: p.ring,
        remote: p.remote,
        posted: p.posted,
        source: p.source,
        comp: p.comp,
        score: score,
        recommendation: recFromScore(score),
        layoff_flag: p.layoff,
        layers: {
          L1: {
            name: 'Semantic',
            score: p.l[0]
          },
          L2: {
            name: 'Domain',
            score: p.l[1],
            note: p.ring === 1 ? 'Ring 1 boost' : null
          },
          L3: {
            name: 'Stability',
            score: p.l[2]
          },
          L4: {
            name: 'Comp Fit',
            score: p.l[3]
          }
        },
        gate_passed: true,
        description: JD
      };
    }).filter(j => j.score >= minScore).sort((a, b) => b.score - a.score);
    const strong = jobs.filter(j => j.recommendation === 'STRONG_FIT').length;
    const good = jobs.filter(j => j.recommendation === 'GOOD_FIT').length;
    const possible = jobs.filter(j => j.recommendation === 'POSSIBLE').length;
    const ringCount = {
      1: 0,
      2: 0,
      3: 0
    };
    jobs.forEach(j => {
      ringCount[j.ring]++;
    });

    // Top 3 companies by score (already sorted)
    const top3 = jobs.slice(0, 3).map(j => ({
      company: j.company,
      score: j.score
    }));
    const layoffCompanies = POOL.filter(p => p.layoff).map(p => p.company);
    return {
      jobs,
      excluded: EXCLUDED,
      stats: {
        total: jobs.length,
        strong,
        good,
        possible,
        excluded_count: EXCLUDED.length,
        ring_distribution: ringCount,
        top_companies: top3,
        layoff_companies: layoffCompanies,
        scan_duration: '4m 32s'
      }
    };
  }

  // ── Pipeline simulation ───────────────────────────────────────
  const PIPELINE = [{
    key: 'parse',
    label: 'Resume parsed',
    subs: ['Extracting text…', 'Detecting role keywords…']
  }, {
    key: 'discover',
    label: 'Discovering jobs',
    subs: ['LinkedIn: 12 found…', 'Glassdoor: searching…', 'Indeed: 19 found…', 'Greenhouse: 8 found…']
  }, {
    key: 'gate',
    label: 'Gate filtering',
    subs: ['Checking visa requirements…', 'Location radius…', 'Comp floor…']
  }, {
    key: 'score',
    label: 'Scoring matches',
    subs: ['L1 semantic…', 'L2 domain rings…', 'L3 stability…', 'L4 comp fit…']
  }, {
    key: 'report',
    label: 'Generating reports',
    subs: ['Compiling matches…', 'Ranking by score…']
  }];
  const RESUME_META = {
    detected_role: 'Systems Administrator',
    experience: 'Senior · ~8 yrs',
    keywords: ['Linux', 'Terraform', 'Ansible', 'AWS', 'Networking', 'Incident Response', 'Python', 'Kubernetes'],
    skills: ['Infrastructure', 'Automation', 'SRE', 'Cloud Ops']
  };
  window.QHEngine = {
    PIPELINE,
    RINGS,
    RESUME_META,
    buildResults,
    recFromScore,
    recLabel,
    scoreColor,
    recColor
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "quit-happens/engine.js", error: String((e && e.message) || e) }); }

// quit-happens/icons.jsx
try { (() => {
// Icon — QUIT HAPPENS lucide subset, inlined from lucide-static@0.453.0 (ISC).
const QH_ICONS = {
  "upload": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /> <polyline points=\"17 8 12 3 7 8\" /> <line x1=\"12\" x2=\"12\" y1=\"3\" y2=\"15\" />",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\" /> <path d=\"m21 21-4.3-4.3\" />",
  "shield": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" />",
  "target": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <circle cx=\"12\" cy=\"12\" r=\"6\" /> <circle cx=\"12\" cy=\"12\" r=\"2\" />",
  "trending-up": "<polyline points=\"22 7 13.5 15.5 8.5 10.5 2 17\" /> <polyline points=\"16 7 22 7 22 13\" />",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m9 12 2 2 4-4\" />",
  "circle-x": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m15 9-6 6\" /> <path d=\"m9 9 6 6\" />",
  "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\" /> <path d=\"M12 9v4\" /> <path d=\"M12 17h.01\" />",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\" />",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\" />",
  "download": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /> <polyline points=\"7 10 12 15 17 10\" /> <line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\" />",
  "chart-column": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\" /> <path d=\"M18 17V9\" /> <path d=\"M13 17V5\" /> <path d=\"M8 17v-3\" />",
  "briefcase": "<path d=\"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\" /> <rect width=\"20\" height=\"14\" x=\"2\" y=\"6\" rx=\"2\" />",
  "zap": "<path d=\"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z\" />",
  "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\" /> <path d=\"M21 3v5h-5\" /> <path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\" /> <path d=\"M8 16H3v5\" />",
  "star": "<polygon points=\"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2\" />",
  "x": "<path d=\"M18 6 6 18\" /> <path d=\"m6 6 12 12\" />",
  "map-pin": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\" /> <circle cx=\"12\" cy=\"10\" r=\"3\" />",
  "calendar": "<path d=\"M8 2v4\" /> <path d=\"M16 2v4\" /> <rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /> <path d=\"M3 10h18\" />",
  "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /> <path d=\"M10 9H8\" /> <path d=\"M16 13H8\" /> <path d=\"M16 17H8\" />",
  "external-link": "<path d=\"M15 3h6v6\" /> <path d=\"M10 14 21 3\" /> <path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\" />",
  "dollar-sign": "<line x1=\"12\" x2=\"12\" y1=\"2\" y2=\"22\" /> <path d=\"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6\" />",
  "sliders-horizontal": "<line x1=\"21\" x2=\"14\" y1=\"4\" y2=\"4\" /> <line x1=\"10\" x2=\"3\" y1=\"4\" y2=\"4\" /> <line x1=\"21\" x2=\"12\" y1=\"12\" y2=\"12\" /> <line x1=\"8\" x2=\"3\" y1=\"12\" y2=\"12\" /> <line x1=\"21\" x2=\"16\" y1=\"20\" y2=\"20\" /> <line x1=\"12\" x2=\"3\" y1=\"20\" y2=\"20\" /> <line x1=\"14\" x2=\"14\" y1=\"2\" y2=\"6\" /> <line x1=\"8\" x2=\"8\" y1=\"10\" y2=\"14\" /> <line x1=\"16\" x2=\"16\" y1=\"18\" y2=\"22\" />",
  "loader-circle": "<path d=\"M21 12a9 9 0 1 1-6.219-8.56\" />"
};
function Icon({
  name,
  size = 18,
  strokeWidth = 2,
  color = 'currentColor',
  className,
  style,
  title
}) {
  const inner = QH_ICONS[name];
  if (!inner) return null;
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: className,
    style: {
      flexShrink: 0,
      ...style
    },
    'aria-hidden': title ? undefined : true,
    role: title ? 'img' : undefined,
    dangerouslySetInnerHTML: {
      __html: (title ? '<title>' + title + '</title>' : '') + inner
    }
  });
}
Icon.names = Object.keys(QH_ICONS);
window.Icon = Icon;
})(); } catch (e) { __ds_ns.__errors.push({ path: "quit-happens/icons.jsx", error: String((e && e.message) || e) }); }

// quit-happens/results.jsx
try { (() => {
// QUIT HAPPENS — Results screen.
const QHr = window.QH;
const EngR = window.QHEngine;
const FILTERS = [{
  key: 'ALL',
  label: 'All'
}, {
  key: 'STRONG_FIT',
  label: 'Strong Fit',
  color: 'var(--qh-accent)'
}, {
  key: 'GOOD_FIT',
  label: 'Good Fit',
  color: 'var(--qh-blue)'
}, {
  key: 'POSSIBLE',
  label: 'Possible',
  color: 'var(--qh-warning)'
}];
const SORTS = [{
  key: 'score',
  label: 'Score'
}, {
  key: 'company',
  label: 'Company'
}, {
  key: 'date',
  label: 'Date Posted'
}, {
  key: 'ring',
  label: 'Ring'
}];
function Results({
  results,
  starred,
  onStar,
  onTailor,
  onNewScan,
  dealt
}) {
  const {
    jobs,
    excluded,
    stats
  } = results;
  const [filter, setFilter] = React.useState('ALL');
  const [sort, setSort] = React.useState('score');
  const [showExcluded, setShowExcluded] = React.useState(false);
  const [chartsOpen, setChartsOpen] = React.useState(true);
  const visible = React.useMemo(() => {
    let list = jobs.filter(j => filter === 'ALL' || j.recommendation === filter);
    const cmp = {
      score: (a, b) => b.score - a.score,
      company: (a, b) => a.company.localeCompare(b.company),
      date: (a, b) => b.posted.localeCompare(a.posted),
      ring: (a, b) => a.ring - b.ring || b.score - a.score
    }[sort];
    return [...list].sort(cmp);
  }, [jobs, filter, sort]);
  const donut = [{
    label: 'Ring 1 · Domain',
    value: stats.ring_distribution[1],
    color: 'var(--qh-accent)'
  }, {
    label: 'Ring 2 · Big Tech',
    value: stats.ring_distribution[2],
    color: 'var(--qh-blue)'
  }, {
    label: 'Ring 3 · AI Startup',
    value: stats.ring_distribution[3],
    color: 'var(--qh-ring3)'
  }];
  const bands = [{
    label: 'STRONG\n≥75',
    value: stats.strong,
    color: 'var(--qh-accent)'
  }, {
    label: 'GOOD\n60–74',
    value: stats.good,
    color: 'var(--qh-blue)'
  }, {
    label: 'POSSIBLE\n<60',
    value: stats.possible,
    color: 'var(--qh-warning)'
  }];
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "Results"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: 'rgba(13,13,13,0.92)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--qh-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(QHr.Logo, {
    size: "sm"
  }), /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 12.5,
      color: 'var(--qh-muted-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qh-text)',
      fontWeight: 600
    }
  }, stats.total, " matches"), ' · ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qh-accent)'
    }
  }, stats.strong, " STRONG FIT"), ' · ', "Scan took ", stats.scan_duration), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(SortMenu, {
    sort: sort,
    setSort: setSort
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qh-btn qh-btn--primary qh-btn--sm",
    onClick: onNewScan
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "refresh-cw",
    size: 14
  }), " New Scan"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 24px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, FILTERS.map(f => {
    const count = f.key === 'ALL' ? jobs.length : jobs.filter(j => j.recommendation === f.key).length;
    return /*#__PURE__*/React.createElement(QHr.FilterPill, {
      key: f.key,
      active: filter === f.key,
      onClick: () => setFilter(f.key),
      count: count,
      color: f.color
    }, f.label);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "qh-results-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: '35% 65%',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("aside", {
    className: "qh-overview",
    style: {
      position: 'sticky',
      top: 116,
      padding: '22px 20px 22px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qh-charts-toggle",
    onClick: () => setChartsOpen(o => !o),
    style: {
      display: 'none',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      background: 'var(--qh-surface)',
      border: '1px solid var(--qh-border)',
      borderRadius: 'var(--r-sm)',
      padding: '12px 14px',
      color: 'var(--qh-text)',
      fontFamily: 'var(--font-display)',
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chart-column",
    size: 16
  }), " Score overview"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 16,
    style: {
      transform: chartsOpen ? 'rotate(180deg)' : 'none',
      transition: 'transform 200ms var(--ease)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "qh-charts-body",
    style: {
      display: chartsOpen ? 'flex' : 'none',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Score distribution",
    icon: "chart-column"
  }, /*#__PURE__*/React.createElement(QHr.DistBars, {
    bands: bands
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "Ring distribution",
    icon: "target"
  }, /*#__PURE__*/React.createElement(QHr.DonutChart, {
    segments: donut
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "Top companies",
    icon: "trending-up"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 11
    }
  }, stats.top_companies.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c.company,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 12,
      color: 'var(--qh-muted)',
      width: 16
    }
  }, i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      flex: 1
    }
  }, c.company), /*#__PURE__*/React.createElement(QHr.ScoreBar, {
    score: c.score,
    height: 6,
    delay: i * 120
  }), /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: EngR.scoreColor(c.score),
      width: 26,
      textAlign: 'right'
    }
  }, c.score))))), /*#__PURE__*/React.createElement(Panel, {
    title: "Stability warnings",
    icon: "triangle-alert",
    tone: "warning"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "triangle-alert",
    size: 16,
    color: "var(--qh-warning)",
    style: {
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--qh-text)'
    }
  }, stats.layoff_companies.length, " companies flagged for recent layoffs"), /*#__PURE__*/React.createElement("div", {
    className: "qh-mono",
    style: {
      fontSize: 12,
      color: 'var(--qh-muted-2)',
      marginTop: 4
    }
  }, stats.layoff_companies.join(' · '))))))), /*#__PURE__*/React.createElement("main", {
    style: {
      padding: '22px 24px 80px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, visible.length === 0 ? /*#__PURE__*/React.createElement(EmptyResults, null) : visible.map((job, i) => /*#__PURE__*/React.createElement(QHr.JobCard, {
    key: job.job_id,
    job: job,
    index: i,
    dealt: dealt,
    starred: !!starred[job.job_id],
    onStar: onStar,
    onTailor: onTailor
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowExcluded(s => !s),
    "aria-expanded": showExcluded,
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '14px 16px',
      background: 'var(--qh-surface)',
      border: '1px solid var(--qh-border)',
      borderRadius: 'var(--r-md)',
      color: 'var(--qh-muted-2)',
      fontSize: 14,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-x",
    size: 16,
    color: "var(--qh-danger)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qh-text)'
    }
  }, excluded.length, " jobs excluded"), /*#__PURE__*/React.createElement("span", null, "\u2014 click to see why"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 16,
    style: {
      marginLeft: 'auto',
      transform: showExcluded ? 'rotate(180deg)' : 'none',
      transition: 'transform 200ms var(--ease)'
    }
  })), showExcluded ? /*#__PURE__*/React.createElement("div", {
    className: "qh-fade",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginTop: 8
    }
  }, excluded.map((ex, i) => /*#__PURE__*/React.createElement(QHr.ExcludedCard, {
    key: i,
    job: ex
  }))) : null))));
}
function Panel({
  title,
  icon,
  children,
  tone
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--qh-surface)',
      border: `1px solid ${tone === 'warning' ? 'rgba(255,184,0,0.25)' : 'var(--qh-border)'}`,
      borderRadius: 'var(--r-md)',
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "qh-mono",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 11,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--qh-muted)',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 14,
    color: tone === 'warning' ? 'var(--qh-warning)' : 'var(--qh-muted)'
  }), " ", title), children);
}
function SortMenu({
  sort,
  setSort
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const cur = SORTS.find(s => s.key === sort);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qh-btn qh-btn--ghost qh-btn--sm",
    onClick: () => setOpen(o => !o),
    "aria-haspopup": "listbox",
    "aria-expanded": open
  }, "Sort: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qh-text)'
    }
  }, cur.label), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 14
  })), open ? /*#__PURE__*/React.createElement("div", {
    role: "listbox",
    style: {
      position: 'absolute',
      top: '110%',
      right: 0,
      minWidth: 160,
      background: 'var(--qh-surface-2)',
      border: '1px solid var(--qh-border-2)',
      borderRadius: 'var(--r-sm)',
      padding: 5,
      zIndex: 30,
      boxShadow: '0 12px 32px -8px rgba(0,0,0,0.6)'
    }
  }, SORTS.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.key,
    type: "button",
    role: "option",
    "aria-selected": sort === s.key,
    onClick: () => {
      setSort(s.key);
      setOpen(false);
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      textAlign: 'left',
      padding: '9px 11px',
      borderRadius: 5,
      border: 'none',
      background: sort === s.key ? 'var(--qh-border)' : 'transparent',
      color: sort === s.key ? 'var(--qh-text)' : 'var(--qh-muted-2)',
      fontSize: 13.5
    }
  }, sort === s.key ? /*#__PURE__*/React.createElement(Icon, {
    name: "circle-check",
    size: 14,
    color: "var(--qh-accent)"
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14
    }
  }), s.label))) : null);
}
function EmptyResults() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '64px 24px',
      color: 'var(--qh-muted-2)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 32,
    color: "var(--qh-muted)"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 14,
      fontSize: 15
    }
  }, "No matches above your score threshold."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: 'var(--qh-muted)'
    }
  }, "Try lowering the minimum score on a new scan."));
}
Object.assign(window.QH, {
  Results
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "quit-happens/results.jsx", error: String((e && e.message) || e) }); }

// quit-happens/screens.jsx
try { (() => {
// QUIT HAPPENS — Landing + Scanning screens.
const QHs = window.QH;
const EngS = window.QHEngine;

// ── Health banner (camofox) ───────────────────────────────────
function HealthBanner() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 16px',
      background: 'rgba(255,184,0,0.08)',
      borderBottom: '1px solid rgba(255,184,0,0.25)',
      fontSize: 13,
      color: 'var(--qh-warning)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "triangle-alert",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, "Browser engine offline \u2014 job discovery is limited."), /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 12,
      color: 'var(--qh-muted-2)'
    }
  }, "Run: docker compose up camofox"));
}

// ── LANDING ───────────────────────────────────────────────────
function Landing({
  state,
  set,
  onScan
}) {
  const fileRef = React.useRef(null);
  const [drag, setDrag] = React.useState(false);
  function pickFile(f) {
    if (!f) return;
    set({
      file: {
        name: f.name,
        size: f.size
      }
    });
  }
  function onDrop(e) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) pickFile(f);else set({
      file: {
        name: 'resume_2026.pdf',
        size: 248320
      }
    }); // demo fallback
  }
  function fmtSize(b) {
    if (b > 1e6) return (b / 1e6).toFixed(1) + ' MB';
    return Math.max(1, Math.round(b / 1024)) + ' KB';
  }
  const canScan = state.file && state.role.trim().length > 0;
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "Landing",
    style: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '64px 24px 80px'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      textAlign: 'center',
      marginBottom: 48
    }
  }, /*#__PURE__*/React.createElement(QHs.Logo, {
    size: "lg"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 12,
      color: 'var(--qh-muted-2)',
      fontSize: 15
    }
  }, "Your career intelligence engine.")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 560,
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: ".pdf,.docx",
    style: {
      display: 'none'
    },
    onChange: e => pickFile(e.target.files && e.target.files[0]),
    "aria-label": "Upload resume"
  }), /*#__PURE__*/React.createElement("div", {
    role: "button",
    tabIndex: 0,
    "aria-label": "Drop your resume here or click to browse",
    onClick: () => fileRef.current && fileRef.current.click(),
    onKeyDown: e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileRef.current.click();
      }
    },
    onDragOver: e => {
      e.preventDefault();
      setDrag(true);
    },
    onDragLeave: () => setDrag(false),
    onDrop: onDrop,
    style: {
      border: `1.5px dashed ${drag ? 'var(--qh-accent)' : state.file ? 'var(--qh-accent-dim)' : 'var(--qh-border-2)'}`,
      borderRadius: 'var(--r-lg)',
      background: drag ? 'rgba(0,255,156,0.05)' : 'var(--qh-surface)',
      padding: '40px 24px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 160ms var(--ease)',
      boxShadow: drag ? '0 0 40px -10px rgba(0,255,156,0.4)' : 'none'
    }
  }, state.file ? /*#__PURE__*/React.createElement("div", {
    className: "qh-fade",
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-check",
    size: 36,
    color: "var(--qh-accent)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-text",
    size: 16,
    color: "var(--qh-muted-2)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: 'var(--qh-text)',
      fontWeight: 500
    }
  }, state.file.name), /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 12,
      color: 'var(--qh-muted)'
    }
  }, fmtSize(state.file.size))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--qh-muted)'
    }
  }, "Click to replace")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload",
    size: 34,
    color: drag ? 'var(--qh-accent)' : 'var(--qh-muted-2)'
  }), /*#__PURE__*/React.createElement("span", {
    className: "qh-display",
    style: {
      fontSize: 19,
      fontWeight: 600,
      color: 'var(--qh-text)'
    }
  }, "Drop your resume here"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: 'var(--qh-muted)'
    }
  }, "PDF, DOCX \u2014 your story, your words"))), state.file ? /*#__PURE__*/React.createElement("div", {
    className: "qh-fade",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: 20,
      background: 'var(--qh-surface)',
      border: '1px solid var(--qh-border)',
      borderRadius: 'var(--r-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: 'var(--qh-muted-2)',
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.06em',
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sliders-horizontal",
    size: 14
  }), " Quick config"), /*#__PURE__*/React.createElement(Field, {
    label: "Target role"
  }, /*#__PURE__*/React.createElement(TextInput, {
    value: state.role,
    onChange: v => set({
      role: v
    }),
    placeholder: "e.g. Systems Administrator"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Location preference"
  }, /*#__PURE__*/React.createElement(TextInput, {
    value: state.location,
    onChange: v => set({
      location: v
    }),
    placeholder: "e.g. Remote, Fresno CA"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Compensation floor"
  }, /*#__PURE__*/React.createElement(TextInput, {
    value: state.comp,
    onChange: v => set({
      comp: v.replace(/[^0-9]/g, '')
    }),
    placeholder: "130000",
    prefix: "$",
    mono: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "remote-toggle",
    style: {
      fontSize: 14,
      color: 'var(--qh-text)'
    }
  }, "Remote only"), /*#__PURE__*/React.createElement(QHs.PillToggle, {
    id: "remote-toggle",
    on: state.remoteOnly,
    onChange: v => set({
      remoteOnly: v
    }),
    label: "Remote only"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Only show matches above this score"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 35,
    max: 85,
    value: state.minScore,
    onChange: e => set({
      minScore: Number(e.target.value)
    }),
    "aria-label": "Minimum match score",
    style: {
      flex: 1,
      accentColor: 'var(--qh-accent)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: 'var(--qh-accent)',
      minWidth: 30,
      textAlign: 'right'
    }
  }, state.minScore)))) : null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qh-btn qh-btn--primary",
    disabled: !canScan,
    onClick: onScan,
    style: {
      width: '100%',
      padding: '15px',
      fontSize: 16,
      borderRadius: 'var(--r-md)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "zap",
    size: 18
  }), " Find My Matches"), !canScan ? /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      fontSize: 12.5,
      color: 'var(--qh-muted)',
      margin: 0
    }
  }, state.file ? 'Enter a target role to continue' : 'Upload a resume to begin') : null));
}
function Field({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--qh-muted-2)'
    }
  }, label), children);
}
function TextInput({
  value,
  onChange,
  placeholder,
  prefix,
  mono
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      background: 'var(--qh-bg)',
      border: '1px solid var(--qh-border-2)',
      borderRadius: 'var(--r-sm)',
      overflow: 'hidden'
    }
  }, prefix ? /*#__PURE__*/React.createElement("span", {
    className: "qh-mono",
    style: {
      padding: '0 0 0 12px',
      color: 'var(--qh-muted)',
      fontSize: 14
    }
  }, prefix) : null, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    className: mono ? 'qh-mono' : '',
    style: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--qh-text)',
      fontSize: 14,
      padding: '11px 12px'
    }
  }));
}

// ── SCANNING ──────────────────────────────────────────────────
function Scanning({
  progress,
  onCancel,
  role
}) {
  const {
    stepIdx,
    sub,
    counters
  } = progress;
  const meta = EngS.RESUME_META;
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "Scanning",
    style: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderBottom: '1px solid var(--qh-border)'
    }
  }, /*#__PURE__*/React.createElement(QHs.Logo, {
    size: "sm"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qh-btn qh-btn--ghost qh-btn--sm",
    onClick: onCancel
  }, "Stop scan")), /*#__PURE__*/React.createElement("div", {
    className: "qh-scan-split",
    style: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: '40% 60%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: '1px solid var(--qh-border)',
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "qh-mono",
    style: {
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--qh-muted)',
      marginBottom: 10
    }
  }, "Resume"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-text",
    size: 18,
    color: "var(--qh-accent)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500
    }
  }, progress.fileName))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "qh-mono",
    style: {
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--qh-muted)',
      marginBottom: 8
    }
  }, "Detected role"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: 'var(--qh-text)'
    }
  }, meta.detected_role), /*#__PURE__*/React.createElement("div", {
    className: "qh-mono",
    style: {
      fontSize: 12.5,
      color: 'var(--qh-muted-2)',
      marginTop: 3
    }
  }, meta.experience)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "qh-mono",
    style: {
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--qh-muted)',
      marginBottom: 10
    }
  }, "Role keywords"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7
    }
  }, meta.keywords.map(k => /*#__PURE__*/React.createElement("span", {
    key: k,
    style: {
      fontSize: 12.5,
      padding: '4px 9px',
      borderRadius: 5,
      color: 'var(--qh-accent)',
      background: 'rgba(0,255,156,0.08)',
      border: '1px solid rgba(0,255,156,0.25)'
    }
  }, k)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "qh-mono",
    style: {
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--qh-muted)',
      marginBottom: 10
    }
  }, "Key skills"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7
    }
  }, meta.skills.map(k => /*#__PURE__*/React.createElement("span", {
    key: k,
    style: {
      fontSize: 12.5,
      padding: '4px 9px',
      borderRadius: 5,
      color: 'var(--qh-muted-2)',
      background: 'var(--qh-surface-2)',
      border: '1px solid var(--qh-border-2)'
    }
  }, k))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 28,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "qh-mono",
    style: {
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--qh-muted)',
      marginBottom: 22
    }
  }, "Pipeline"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0
    }
  }, EngS.PIPELINE.map((step, i) => {
    const status = i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending';
    return /*#__PURE__*/React.createElement(PipelineStep, {
      key: step.key,
      step: step,
      status: status,
      sub: i === stepIdx ? sub : null,
      last: i === EngS.PIPELINE.length - 1
    });
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      gap: 0,
      border: '1px solid var(--qh-border)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatCell, {
    value: counters.found,
    label: "jobs found",
    color: "var(--qh-text)"
  }), /*#__PURE__*/React.createElement(StatCell, {
    value: counters.excluded,
    label: "excluded (gates)",
    color: "var(--qh-danger)"
  }), /*#__PURE__*/React.createElement(StatCell, {
    value: counters.scored,
    label: "being scored",
    color: "var(--qh-accent)",
    last: true
  })))));
}
function PipelineStep({
  step,
  status,
  sub,
  last
}) {
  const color = status === 'done' ? 'var(--qh-accent)' : status === 'active' ? 'var(--qh-accent)' : 'var(--qh-muted)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: status === 'active' ? 'qh-pulse' : '',
    style: {
      width: 28,
      height: 28,
      borderRadius: 99,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1.5px solid ${status === 'pending' ? 'var(--qh-border-2)' : color}`,
      background: status === 'done' ? 'var(--qh-accent)' : 'transparent',
      flexShrink: 0
    }
  }, status === 'done' ? /*#__PURE__*/React.createElement(Icon, {
    name: "circle-check",
    size: 16,
    color: "#06281c"
  }) : status === 'active' ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 99,
      background: 'var(--qh-accent)'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 99,
      background: 'var(--qh-muted)'
    }
  })), !last ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1.5,
      flex: 1,
      minHeight: 30,
      background: status === 'done' ? 'var(--qh-accent-dim)' : 'var(--qh-border)'
    }
  }) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: last ? 0 : 22,
      paddingTop: 3
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "qh-display",
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      color: status === 'pending' ? 'var(--qh-muted)' : 'var(--qh-text)'
    }
  }, step.label), sub ? /*#__PURE__*/React.createElement("div", {
    className: "qh-mono qh-fade",
    style: {
      fontSize: 12,
      color: 'var(--qh-accent)',
      marginTop: 4
    }
  }, sub) : null));
}
function StatCell({
  value,
  label,
  color,
  last
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '14px 16px',
      borderRight: last ? 'none' : '1px solid var(--qh-border)',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "qh-mono",
    style: {
      fontSize: 24,
      fontWeight: 700,
      color
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--qh-muted)',
      marginTop: 2
    }
  }, label));
}
Object.assign(window.QH, {
  Landing,
  Scanning,
  HealthBanner
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "quit-happens/screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/quiet-shelf-promote/app.jsx
try { (() => {
// App — owns the state machine: empty → working → results (or error).
// All state in memory. No storage, no accounts, no nav.

function App() {
  const [phase, setPhase] = React.useState('empty'); // empty | working | results | error
  const [script, setScript] = React.useState('');
  const [fieldError, setFieldError] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [found, setFound] = React.useState({});
  const [copied, setCopied] = React.useState(false);
  const [confirmingNew, setConfirmingNew] = React.useState(false);
  const [dealt, setDealt] = React.useState(false);
  const timers = React.useRef([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  function startMapping() {
    const words = window.ShelfEngine.countWords(script);
    if (words === 0) {
      setFieldError("There's no script here yet. Paste it in and we'll get to work.");
      return;
    }
    if (words < 100) {
      setFieldError('This looks like a fragment. Paste the full script for a proper shot list.');
      return;
    }
    setFieldError(null);
    setPhase('working');
    later(() => {
      // Demo hook: a script containing [fail] exercises the engine-error state.
      if (/\[fail\]/i.test(script)) {
        setPhase('error');
        return;
      }
      const r = window.ShelfEngine.map(script);
      setResult(r);
      setFound({});
      setDealt(true);
      setPhase('results');
      later(() => setDealt(false), 2400);
    }, 3400);
  }
  function copyForNotion() {
    const md = window.buildMarkdown(result, found);
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = md;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(md).catch(fallback);
    } else {
      fallback();
    }
    setCopied(true);
    later(() => setCopied(false), 2000);
  }
  function resetAll() {
    setScript('');
    setResult(null);
    setFound({});
    setConfirmingNew(false);
    setFieldError(null);
    setPhase('empty');
  }
  if (phase === 'working') return /*#__PURE__*/React.createElement(Working, null);
  if (phase === 'error') {
    return /*#__PURE__*/React.createElement(EngineError, {
      onRetry: startMapping,
      onBack: () => setPhase('empty')
    });
  }
  if (phase === 'results' && result) {
    const foundCount = result.segments.filter(s => found[s.id]).length;
    return /*#__PURE__*/React.createElement("div", {
      className: "qs-results",
      "data-screen-label": "Shot List"
    }, /*#__PURE__*/React.createElement(SummaryBar, {
      result: result,
      foundCount: foundCount,
      onCopy: copyForNotion,
      copied: copied,
      onNewScript: () => setConfirmingNew(true),
      confirmingNew: confirmingNew,
      onConfirmNew: resetAll,
      onCancelNew: () => setConfirmingNew(false)
    }), /*#__PURE__*/React.createElement(ShotList, {
      result: result,
      found: found,
      onFoundChange: (id, v) => setFound(f => ({
        ...f,
        [id]: v
      })),
      onMapRest: () => {},
      dealt: dealt
    }));
  }
  return /*#__PURE__*/React.createElement(EmptyDesk, {
    script: script,
    onScriptChange: v => {
      setScript(v);
      if (fieldError) setFieldError(null);
    },
    onMap: startMapping,
    onSample: () => {
      setScript(window.ShelfEngine.SAMPLE_SCRIPT);
      setFieldError(null);
    },
    error: fieldError
  });
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-shelf-promote/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/quiet-shelf-promote/engine.js
try { (() => {
// ShelfEngine — fake mapping engine for the UI kit. Deterministic, in-memory.
// Mirrors the real backend's response shape from POST /api/map.
(function () {
  var WPM = 150;
  var STOP = new Set('a an and are as at be been but by for from had has have he her his i if in into is it its me my of on or our out so than that the their them then there they this to up was we were what when which who will with you your yet not no nor do does did done just only very own same too can could would should about over under again once more most other some such'.split(' '));
  var MOOD_LEXICON = [[/rain|leaving|window|gone|doubt|empty|alone/i, 'wistful'], [/fight|boxer|rounds|blank|cold|bark|deadline/i, 'tense'], [/sunrise|begin|method|accumulat|worth|true|strong/i, 'resolute'], [/quiet|silence|lamp|snow|hum|night|slow/i, 'quiet'], [/city|street|train|harbor|kitchen|shop/i, 'reflective']];
  var MOOD_CYCLE = ['reflective', 'quiet', 'resolute', 'wistful', 'tense'];
  var MOOD_TERMS = {
    wistful: 'rain on train window',
    tense: 'boxer wrapping hands gym',
    resolute: 'typewriter desk lamp night',
    quiet: 'snow falling streetlight',
    reflective: 'empty city street night'
  };
  function countWords(text) {
    var m = (text || '').trim().match(/\S+/g);
    return m ? m.length : 0;
  }
  function fmtTime(totalSeconds) {
    var s = Math.max(0, Math.round(totalSeconds));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }
  function keywords(text, n) {
    var freq = {};
    (text.toLowerCase().match(/[a-z']{4,}/g) || []).forEach(function (w) {
      w = w.replace(/'s$/, '');
      if (STOP.has(w)) return;
      freq[w] = (freq[w] || 0) + 1;
    });
    return Object.keys(freq).sort(function (a, b) {
      return freq[b] - freq[a] || b.length - a.length;
    }).slice(0, n);
  }
  function moodFor(text, i) {
    for (var k = 0; k < MOOD_LEXICON.length; k++) {
      if (MOOD_LEXICON[k][0].test(text)) return MOOD_LEXICON[k][1];
    }
    return MOOD_CYCLE[i % MOOD_CYCLE.length];
  }
  function map(script) {
    var sentences = script.replace(/\s+/g, ' ').trim().match(/[^.!?…]+[.!?…]+["']?|[^.!?…]+$/g) || [];
    // Group sentences into ~40-word segments.
    var groups = [];
    var cur = '';
    sentences.forEach(function (s) {
      cur = cur ? cur + ' ' + s.trim() : s.trim();
      if (countWords(cur) >= 38) {
        groups.push(cur);
        cur = '';
      }
    });
    if (cur) {
      if (groups.length && countWords(cur) < 14) groups[groups.length - 1] += ' ' + cur;else groups.push(cur);
    }
    var MAX = 24;
    var partial = groups.length > MAX;
    if (partial) groups = groups.slice(0, MAX);
    var t = 0;
    var segments = groups.map(function (g, i) {
      var words = countWords(g);
      var dur = words / WPM * 60;
      var start = t;
      t += dur;
      var kw = keywords(g, 4);
      var mood = moodFor(g, i);
      var terms = [];
      if (kw.length >= 2) terms.push(kw[0] + ' ' + kw[1]);else if (kw.length === 1) terms.push(kw[0]);
      if (kw.length >= 4) terms.push(kw[2] + ' ' + kw[3]);else if (kw.length >= 3) terms.push(kw[2] + ' close up');
      terms.push(MOOD_TERMS[mood]);
      terms = terms.filter(function (x, j) {
        return x && terms.indexOf(x) === j;
      }).slice(0, 3);
      return {
        id: i + 1,
        script_text: g,
        start_time: fmtTime(start),
        end_time: fmtTime(t),
        search_terms: terms,
        clip_duration_seconds: Math.min(15, Math.max(4, Math.round(dur * 0.4))),
        mood: mood
      };
    });
    var top = keywords(script, 2);
    var title = top.length >= 2 ? 'The ' + top[0].charAt(0).toUpperCase() + top[0].slice(1) + ' and the ' + top[1].charAt(0).toUpperCase() + top[1].slice(1) : 'Untitled Essay';
    return {
      video_title_suggestion: title,
      estimated_runtime_seconds: Math.round(t),
      segments: segments,
      partial: partial
    };
  }
  var SAMPLE_SCRIPT = ['Every city has an hour when it belongs to nobody. The shops are shuttered, the trains run empty, and the streetlights hum their one long note over wet asphalt. This is the hour the essay begins.', 'I used to think discipline meant noise — alarms, deadlines, a coach barking counts in a cold gym. But the strongest people I ever filmed were quiet. A boxer wrapping his hands in silence. A baker flouring the bench before the ovens wake. Their fight happened long before anyone watched.', 'Writing is the same kind of fight. You sit at a small desk under a small lamp and you go the full twelve rounds with a blank page. Nobody cheers. The page does not care. You show up anyway, night after night, and the work accumulates like snowfall on a windowsill.', 'Stock footage gets a bad reputation, and some of it is earned. But choose carefully and the borrowed image becomes confession. Rain on a train window is every leaving you never explained. A kitchen light at three in the morning is every doubt you ever fed.', 'So this is the method. Write the truest sentence you can. Find the picture that admits it. Cut until only the fight remains — the quiet one, the one worth filming.'].join('\n\n');
  window.ShelfEngine = {
    WPM: WPM,
    countWords: countWords,
    fmtTime: fmtTime,
    map: map,
    SAMPLE_SCRIPT: SAMPLE_SCRIPT
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-shelf-promote/engine.js", error: String((e && e.message) || e) }); }

// ui_kits/quiet-shelf-promote/screens.jsx
try { (() => {
// Screens: EmptyDesk (landing), Working (loading), EngineError.
const {
  Button,
  ScriptTextarea,
  Icon,
  ProgressBar
} = window.QuietFightClubDesignSystem_fae847;
const E = window.ShelfEngine;
function Wordmark() {
  return /*#__PURE__*/React.createElement("header", {
    className: "qs-page__header"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "qs-wordmark"
  }, "Quiet Shelf"), /*#__PURE__*/React.createElement("p", {
    className: "qs-tagline"
  }, "Turn your writing into a video plan."));
}
function EmptyDesk({
  script,
  onScriptChange,
  onMap,
  onSample,
  error
}) {
  const words = E.countWords(script);
  const runtime = E.fmtTime(words / E.WPM * 60);
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-page",
    "data-screen-label": "Empty Desk"
  }, /*#__PURE__*/React.createElement(Wordmark, null), /*#__PURE__*/React.createElement(ScriptTextarea, {
    value: script,
    onChange: onScriptChange,
    minHeight: 300
  }), /*#__PURE__*/React.createElement("div", {
    className: "qs-deskmeta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-deskmeta__counts"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-text",
    size: 13
  }), words.toLocaleString(), " ", words === 1 ? 'word' : 'words', " \xB7 \u2248", runtime, " narration"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-textlink",
    onClick: onSample
  }, "Try a sample script")), error ? /*#__PURE__*/React.createElement("p", {
    className: "qs-fieldnote",
    role: "alert"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-alert",
    size: 14
  }), error) : null, /*#__PURE__*/React.createElement("div", {
    className: "qs-deskaction"
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    icon: "sparkles",
    onClick: onMap
  }, "Map My Visuals")));
}
const WORKING_LINES = ['Reading your script…', 'Breaking it into scenes…', 'Finding your footage…'];
function Working() {
  const [lineIdx, setLineIdx] = React.useState(0);
  const [progress, setProgress] = React.useState(0.06);
  React.useEffect(() => {
    const lineTimer = setInterval(() => {
      setLineIdx(i => Math.min(i + 1, WORKING_LINES.length - 1));
    }, 1300);
    const progTimer = setInterval(() => {
      setProgress(p => Math.min(0.92, p + (0.92 - p) * 0.18));
    }, 220);
    return () => {
      clearInterval(lineTimer);
      clearInterval(progTimer);
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-page qs-page--center",
    "data-screen-label": "Working"
  }, /*#__PURE__*/React.createElement(Wordmark, null), /*#__PURE__*/React.createElement("div", {
    className: "qs-working",
    role: "status"
  }, /*#__PURE__*/React.createElement("p", {
    className: "qs-working__line",
    key: lineIdx
  }, WORKING_LINES[lineIdx]), /*#__PURE__*/React.createElement("div", {
    className: "qs-working__bar"
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: progress
  }))));
}
function EngineError({
  onRetry,
  onBack
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-page qs-page--center",
    "data-screen-label": "Engine Error"
  }, /*#__PURE__*/React.createElement(Wordmark, null), /*#__PURE__*/React.createElement("div", {
    className: "qs-enginerror",
    role: "alert"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-alert",
    size: 20,
    color: "var(--danger-text)"
  }), /*#__PURE__*/React.createElement("p", {
    className: "qs-enginerror__msg"
  }, "The mapping engine didn't answer. Wait a moment and try again."), /*#__PURE__*/React.createElement("div", {
    className: "qs-enginerror__actions"
  }, /*#__PURE__*/React.createElement(Button, {
    icon: "rotate-ccw",
    onClick: onRetry
  }, "Retry"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: onBack
  }, "Back to the script"))));
}
Object.assign(window, {
  Wordmark,
  EmptyDesk,
  Working,
  EngineError,
  WORKING_LINES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-shelf-promote/screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/quiet-shelf-promote/shotlist.jsx
try { (() => {
// Shot list: sticky SummaryBar + the manuscript-card board.
const {
  Button,
  ManuscriptCard,
  ProgressBar
} = window.QuietFightClubDesignSystem_fae847;
const Eng = window.ShelfEngine;
const MOOD_TONES = {
  tense: 'oxblood',
  wistful: 'neutral',
  quiet: 'neutral',
  resolute: 'ember',
  reflective: 'neutral',
  hopeful: 'ember'
};
function SummaryBar({
  result,
  foundCount,
  onCopy,
  copied,
  onNewScript,
  confirmingNew,
  onConfirmNew,
  onCancelNew
}) {
  const total = result.segments.length;
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-summary",
    "data-comment-anchor": "summary-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-summary__inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-summary__facts"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-summary__title"
  }, result.video_title_suggestion), /*#__PURE__*/React.createElement("span", {
    className: "qs-summary__meta"
  }, total, " segments \xB7 \u2248", Eng.fmtTime(result.estimated_runtime_seconds), " runtime")), /*#__PURE__*/React.createElement("div", {
    className: "qs-summary__progress"
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: total ? foundCount / total : 0,
    label: `${foundCount} of ${total} segments clipped`
  })), /*#__PURE__*/React.createElement("div", {
    className: "qs-summary__actions"
  }, confirmingNew ? /*#__PURE__*/React.createElement("span", {
    className: "qs-summary__confirm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-summary__confirmtext"
  }, "Clear this map?"), /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "sm",
    onClick: onConfirmNew
  }, "Clear it"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: onCancelNew
  }, "Keep it")) : /*#__PURE__*/React.createElement("span", {
    className: "qs-summary__btns"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: copied ? 'check' : 'copy',
    onClick: onCopy
  }, copied ? 'Copied' : 'Copy for Notion'), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    icon: "rotate-ccw",
    onClick: onNewScript
  }, "Start a new script")))));
}
function ShotList({
  result,
  found,
  onFoundChange,
  onMapRest,
  dealt
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-board",
    "data-screen-label": "Shot List"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-board__cards"
  }, result.segments.map((seg, i) => /*#__PURE__*/React.createElement(ManuscriptCard, {
    key: seg.id,
    index: seg.id,
    startTime: seg.start_time,
    endTime: seg.end_time,
    excerpt: seg.script_text,
    mood: seg.mood,
    moodTone: MOOD_TONES[seg.mood] || 'neutral',
    clipDurationSeconds: seg.clip_duration_seconds,
    terms: seg.search_terms,
    found: !!found[seg.id],
    onFoundChange: v => onFoundChange(seg.id, v),
    className: dealt ? 'qs-deal' : '',
    style: dealt ? {
      animationDelay: Math.min(i, 12) * 60 + 'ms'
    } : null
  }))), result.partial ? /*#__PURE__*/React.createElement("div", {
    className: "qs-board__partial"
  }, /*#__PURE__*/React.createElement("p", null, "The map came back unfinished \u2014 this is everything that arrived."), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "arrow-right",
    onClick: onMapRest
  }, "Map the rest")) : null);
}
function buildMarkdown(result, found) {
  const lines = ['# ' + result.video_title_suggestion, '', `Total: ${result.segments.length} segments · ≈${Eng.fmtTime(result.estimated_runtime_seconds)} runtime`, '', '| # | Time | Script | Mood | Clip | Search terms | Found |', '| --- | --- | --- | --- | --- | --- | --- |'];
  result.segments.forEach(s => {
    lines.push(`| ${String(s.id).padStart(2, '0')} | ${s.start_time}–${s.end_time} | ${s.script_text.replace(/\|/g, '\\|')} | ${s.mood} | ~${s.clip_duration_seconds}s | ${s.search_terms.join(' · ')} | ${found[s.id] ? '✓' : ''} |`);
  });
  return lines.join('\n');
}
Object.assign(window, {
  SummaryBar,
  ShotList,
  buildMarkdown,
  MOOD_TONES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-shelf-promote/shotlist.jsx", error: String((e && e.message) || e) }); }

// ui_kits/quiet-shelf/app.jsx
try { (() => {
/* Quiet Shelf — app root. Quiet header, four routes, no storage. */
const QSDS_app = window.QuietFightClubDesignSystem_fae847;
const {
  Icon: QSIcoApp
} = QSDS_app;
const QS_TABS = [{
  id: 'format',
  label: 'Format',
  icon: 'book-open'
}, {
  id: 'blurb',
  label: 'Blurb',
  icon: 'feather'
}, {
  id: 'promote',
  label: 'Promote',
  icon: 'film'
}];
function App() {
  const [tab, setTab] = React.useState('home');
  React.useEffect(() => {
    window.scrollTo({
      top: 0
    });
  }, [tab]);
  let view = null;
  if (tab === 'home') view = /*#__PURE__*/React.createElement(window.Home, {
    onNavigate: setTab
  });else if (tab === 'format') view = /*#__PURE__*/React.createElement(window.Format, null);else if (tab === 'blurb') view = /*#__PURE__*/React.createElement(window.Blurb, null);else if (tab === 'promote') view = /*#__PURE__*/React.createElement(window.Promote, null);
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-app"
  }, /*#__PURE__*/React.createElement("header", {
    className: "qs-header"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-brand",
    onClick: () => setTab('home'),
    "aria-label": "Quiet Shelf, home"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-brand__name"
  }, "Quiet Shelf"), /*#__PURE__*/React.createElement("span", {
    className: "qs-brand__sub"
  }, "Your story, made real.")), /*#__PURE__*/React.createElement("nav", {
    className: "qs-nav",
    "aria-label": "Sections"
  }, QS_TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    type: "button",
    className: `qs-nav__tab${tab === t.id ? ' qs-nav__tab--active' : ''}`,
    onClick: () => setTab(t.id),
    "aria-current": tab === t.id ? 'page' : undefined
  }, /*#__PURE__*/React.createElement(QSIcoApp, {
    name: t.icon,
    size: 15,
    className: "qs-nav__ico"
  }), /*#__PURE__*/React.createElement("span", null, t.label))))), /*#__PURE__*/React.createElement("main", {
    className: "qs-main",
    key: tab
  }, view));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-shelf/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/quiet-shelf/blurb.jsx
try { (() => {
/* Quiet Shelf — Blurb. Paste/bring → tone → calm loading → copyable cards. */
const QSDS_blurb = window.QuietFightClubDesignSystem_fae847;
const {
  Button: QSBtnBlurb,
  Icon: QSIcoBlurb,
  ScriptTextarea
} = QSDS_blurb;
const QS_TONES = [{
  id: 'warm',
  label: 'Warm'
}, {
  id: 'literary',
  label: 'Literary'
}, {
  id: 'punchy',
  label: 'Punchy'
}, {
  id: 'mysterious',
  label: 'Mysterious'
}];
function RCard({
  label,
  copyText,
  children
}) {
  const {
    CopyButton
  } = window;
  return /*#__PURE__*/React.createElement("section", {
    className: "qs-rcard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-rcard__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-rcard__label"
  }, label), copyText != null ? /*#__PURE__*/React.createElement(CopyButton, {
    text: copyText
  }) : null), children);
}
function Blurb() {
  const {
    Becoming
  } = window;
  const data = window.QS_DATA.blurb;
  const [phase, setPhase] = React.useState('compose'); // compose | becoming | done
  const [text, setText] = React.useState('');
  const [tone, setTone] = React.useState('warm');
  const [error, setError] = React.useState('');
  const fileRef = React.useRef(null);
  function onPick(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!['doc', 'docx', 'rtf', 'txt'].includes(ext)) {
      setError('I can only read Word, RTF, or text files for now. Try one of those?');
      return;
    }
    setError('');
    setText(`[${f.name}]\nYour manuscript is ready. Press Find my words whenever you like.`);
  }
  function find() {
    if (!text.trim()) {
      setError('There’s no story here yet. Paste it in, or bring the file.');
      return;
    }
    setError('');
    setPhase('becoming');
  }
  if (phase === 'becoming') {
    return /*#__PURE__*/React.createElement("div", {
      className: "qs-page qs-page--narrow"
    }, /*#__PURE__*/React.createElement(Becoming, {
      lines: ['Reading between the lines…', 'Listening for the heart of it…', 'Finding your words…'],
      sub: "Almost there.",
      duration: 3600,
      onDone: () => setPhase('done')
    }));
  }
  if (phase === 'done') {
    const taglineCopy = data.taglines.map((t, i) => `${i + 1}. ${t}`).join('\n');
    return /*#__PURE__*/React.createElement("div", {
      className: "qs-page qs-page--narrow"
    }, /*#__PURE__*/React.createElement("p", {
      className: "qs-lead"
    }, "Here are your words. Take the ones that feel like the book."), /*#__PURE__*/React.createElement("div", {
      className: "qs-results"
    }, /*#__PURE__*/React.createElement(RCard, {
      label: "Back-cover copy",
      copyText: data.backCover
    }, /*#__PURE__*/React.createElement("p", {
      className: "qs-backcover"
    }, data.backCover)), /*#__PURE__*/React.createElement(RCard, {
      label: "Taglines",
      copyText: taglineCopy
    }, /*#__PURE__*/React.createElement("ul", {
      className: "qs-taglines"
    }, data.taglines.map((t, i) => /*#__PURE__*/React.createElement("li", {
      className: "qs-tagline",
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      className: "qs-tagline__n"
    }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("span", null, t))))), /*#__PURE__*/React.createElement(RCard, {
      label: "Store description",
      copyText: data.storeDescription
    }, /*#__PURE__*/React.createElement("p", {
      className: "qs-store"
    }, data.storeDescription)), /*#__PURE__*/React.createElement(RCard, {
      label: "Suggested keywords",
      copyText: data.keywords.join(', ')
    }, /*#__PURE__*/React.createElement("div", {
      className: "qs-keywords"
    }, data.keywords.map(k => /*#__PURE__*/React.createElement("span", {
      className: "qs-kw",
      key: k
    }, k))))), /*#__PURE__*/React.createElement("div", {
      className: "qs-actionrow"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "qs-payoff__again",
      onClick: () => setPhase('compose')
    }, /*#__PURE__*/React.createElement(QSIcoBlurb, {
      name: "rotate-ccw",
      size: 13
    }), "Try a different tone")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-page qs-page--narrow"
  }, /*#__PURE__*/React.createElement("p", {
    className: "qs-lead"
  }, "Paste your story, or bring the file. I\u2019ll find the words to describe it."), /*#__PURE__*/React.createElement("div", {
    className: "qs-step"
  }, /*#__PURE__*/React.createElement(ScriptTextarea, {
    value: text,
    onChange: setText,
    placeholder: "Paste your story here\u2026",
    minHeight: 220,
    ariaLabel: "Your story"
  }), /*#__PURE__*/React.createElement("div", {
    className: "qs-actionrow",
    style: {
      marginTop: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: ".doc,.docx,.rtf,.txt",
    onChange: onPick,
    style: {
      display: 'none'
    },
    "aria-hidden": "true",
    tabIndex: -1
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-payoff__again",
    onClick: () => fileRef.current && fileRef.current.click()
  }, /*#__PURE__*/React.createElement(QSIcoBlurb, {
    name: "file-text",
    size: 13
  }), "Bring the file instead")), error ? /*#__PURE__*/React.createElement("p", {
    className: "qs-note"
  }, /*#__PURE__*/React.createElement(QSIcoBlurb, {
    name: "circle-alert",
    size: 16
  }), error) : null), /*#__PURE__*/React.createElement("div", {
    className: "qs-step"
  }, /*#__PURE__*/React.createElement("p", {
    className: "qs-steplabel"
  }, "How should it sound?"), /*#__PURE__*/React.createElement("div", {
    className: "qs-pills"
  }, QS_TONES.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    type: "button",
    className: `qs-pill${tone === t.id ? ' qs-pill--on' : ''}`,
    onClick: () => setTone(t.id),
    "aria-pressed": tone === t.id
  }, t.label)))), /*#__PURE__*/React.createElement("div", {
    className: "qs-actionrow"
  }, /*#__PURE__*/React.createElement(QSBtnBlurb, {
    size: "lg",
    icon: "sparkles",
    onClick: find
  }, "Find my words")));
}
window.Blurb = Blurb;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-shelf/blurb.jsx", error: String((e && e.message) || e) }); }

// ui_kits/quiet-shelf/data.js
try { (() => {
/* Quiet Shelf — sample content for the prototype.
   Believable stand-ins for what the real backend returns. No storage. */
window.QS_DATA = {
  // The book the writer is formatting in this demo.
  book: {
    title: 'The Lighthouse Keeper',
    author: 'E. M. Hale',
    fileName: 'the-lighthouse-keeper.docx'
  },
  // Tab 1 — Format. Each theme shows a SAMPLE of its real typesetting,
  // so the writer picks by feel.
  themes: [{
    id: 'classic',
    name: 'Classic Literary',
    note: 'Old-style serif, a drop cap, justified pages.',
    sample: 'It was the hour the lamp was lit, and the sea, for once, held its breath against the rocks below.',
    face: 'classic'
  }, {
    id: 'cozy',
    name: 'Cozy',
    note: 'Warm, roomy leading. A fireside read.',
    sample: 'She kept the kettle on past midnight, the way her mother had, listening for the gull that never came.',
    face: 'cozy'
  }, {
    id: 'modern',
    name: 'Modern Clean',
    note: 'Tight, quiet, plenty of air.',
    sample: 'The map said nothing of the island. He folded it anyway and set it beside the window.',
    face: 'modern'
  }, {
    id: 'children',
    name: "Children's",
    note: 'Big, gentle, generously spaced.',
    sample: 'And the little boat went out, and out, and out — until the harbour was just a freckle of gold.',
    face: 'children'
  }],
  // Tab 2 — Blurb. What "Find my words" returns.
  blurb: {
    backCover: 'For forty years, Aldous Finch has kept the light burning over Carrick Sound — and kept his own grief just as faithfully. Then a girl washes ashore with no memory and a name he hasn’t spoken aloud since the night the sea took everything from him.\n\nAs winter closes the harbour and the lamp begins to fail, the keeper must decide what a man owes to the living, and what he can finally let the tide carry away. A luminous, tender novel about the weight we tend and the grace of setting it down.',
    taglines: ['Some lights are kept. Some are forgiven.', 'Forty winters. One lamp. The grief he never let go dark.', 'The sea gives nothing back — until it does.'],
    storeDescription: 'A quiet, deeply felt debut about an aging lighthouse keeper, a stranger from the sea, and the long work of letting go. Perfect for readers of Claire Keegan and Robert Seethaler.',
    keywords: ['literary fiction', 'lighthouse', 'grief and healing', 'small coastal town', 'second chances', 'quiet literary novel', 'book club fiction']
  },
  // Tab 3 — Promote. Segment-by-segment visual map of the writer's piece.
  promoteSourceWordCount: 1284,
  segments: [{
    index: 1,
    startTime: '0:00',
    endTime: '0:14',
    excerpt: 'Before the lighthouse, before the town, there was only the rock — black, patient, and waiting for a reason to matter.',
    mood: 'Solemn',
    moodTone: 'paper',
    clipDurationSeconds: 9,
    terms: ['lone rock dark sea', 'storm waves crashing cliff', 'grey ocean horizon']
  }, {
    index: 2,
    startTime: '0:14',
    endTime: '0:31',
    excerpt: 'They built the tower stone by stone, and the keeper climbed it every dusk to light a flame against the dark.',
    mood: 'Hopeful',
    moodTone: 'ember',
    clipDurationSeconds: 11,
    terms: ['lighthouse lamp lit dusk', 'hands lighting old lantern', 'spiral staircase tower']
  }, {
    index: 3,
    startTime: '0:31',
    endTime: '0:48',
    excerpt: 'For forty years the light held. Ships passed safe in the night and never knew the man who kept them so.',
    mood: 'Tender',
    moodTone: 'paper',
    clipDurationSeconds: 10,
    terms: ['ship passing lighthouse night', 'beam sweeping over water', 'calm sea moonlight']
  }, {
    index: 4,
    startTime: '0:48',
    endTime: '1:09',
    excerpt: 'Then one winter the sea returned what it had taken — a girl, half-drowned, with no memory and his daughter’s eyes.',
    mood: 'Turning',
    moodTone: 'oxblood',
    clipDurationSeconds: 12,
    terms: ['figure on stormy beach', 'rescue from cold water', 'winter shoreline grey']
  }, {
    index: 5,
    startTime: '1:09',
    endTime: '1:27',
    excerpt: 'And the keeper learned the last thing the light had to teach him: that some things are kept by letting them go.',
    mood: 'Resolved',
    moodTone: 'ember',
    clipDurationSeconds: 11,
    terms: ['sunrise over calm harbour', 'open hands releasing', 'lighthouse dawn warm']
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-shelf/data.js", error: String((e && e.message) || e) }); }

// ui_kits/quiet-shelf/format.jsx
try { (() => {
/* Quiet Shelf — Format. The hero. compose → becoming → the book on the shelf. */
const QSDS_fmt = window.QuietFightClubDesignSystem_fae847;
const {
  Button: QSButton,
  Icon: QSIcon
} = QSDS_fmt;
const QS_ALLOWED = ['doc', 'docx', 'rtf', 'txt'];
function slugify(s) {
  return (s || 'your-book').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'your-book';
}
function ThemeCard({
  theme,
  selected,
  onSelect
}) {
  const faceClass = 'qs-face-' + theme.face;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `qs-theme${selected ? ' qs-theme--on' : ''}`,
    onClick: () => onSelect(theme.id),
    "aria-pressed": selected
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-theme__check",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(QSIcon, {
    name: "circle-check",
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "qs-theme__paper"
  }, /*#__PURE__*/React.createElement("p", {
    className: `qs-theme__sample ${faceClass}`
  }, theme.face === 'modern' ? /*#__PURE__*/React.createElement("span", {
    className: "qs-face-chapter"
  }, "Chapter One") : null, theme.sample)), /*#__PURE__*/React.createElement("span", {
    className: "qs-theme__name"
  }, theme.name), /*#__PURE__*/React.createElement("p", {
    className: "qs-theme__note"
  }, theme.note));
}
function Format() {
  const {
    Shelf,
    FinishedBook,
    Becoming,
    StepLabel
  } = window;
  const data = window.QS_DATA;
  const [phase, setPhase] = React.useState('compose'); // compose | becoming | done
  const [fileName, setFileName] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const [theme, setTheme] = React.useState('classic');
  const [coverName, setCoverName] = React.useState('');
  const [error, setError] = React.useState('');
  const fileRef = React.useRef(null);
  const coverRef = React.useRef(null);
  function acceptStory(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (!QS_ALLOWED.includes(ext)) {
      setError('I can only read Word, RTF, or text files for now. Try one of those?');
      return;
    }
    setError('');
    setFileName(name);
    if (!title) setTitle(data.book.title);
    if (!author) setAuthor(data.book.author);
  }
  function onPickStory(e) {
    const f = e.target.files && e.target.files[0];
    if (f) acceptStory(f.name);
  }
  function onPickCover(e) {
    const f = e.target.files && e.target.files[0];
    if (f) setCoverName(f.name);
  }
  function begin() {
    if (!fileName) {
      setError('Bring me your story first — then we’ll begin.');
      return;
    }
    setError('');
    setPhase('becoming');
  }
  function reset() {
    setPhase('compose');
    setFileName('');
    setTitle('');
    setAuthor('');
    setCoverName('');
    setTheme('classic');
    setError('');
  }
  function download() {
    const name = slugify(title || data.book.title) + '.epub';
    const blob = new Blob([`Quiet Shelf — ${title || data.book.title} by ${author || data.book.author}.\n(Demo file.)`], {
      type: 'application/epub+zip'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (phase === 'becoming') {
    return /*#__PURE__*/React.createElement("div", {
      className: "qs-page qs-page--narrow"
    }, /*#__PURE__*/React.createElement(Becoming, {
      lines: ['Reading your story…', 'Setting your words…', 'Binding the pages…'],
      sub: "This takes a moment. Stay a while.",
      onDone: () => setPhase('done')
    }));
  }
  if (phase === 'done') {
    return /*#__PURE__*/React.createElement("div", {
      className: "qs-page qs-page--narrow qs-payoff"
    }, /*#__PURE__*/React.createElement("p", {
      className: "qs-payoff__title"
    }, "It\u2019s a book now."), /*#__PURE__*/React.createElement("p", {
      className: "qs-payoff__sub"
    }, "Your story, on the shelf \u2014 real."), /*#__PURE__*/React.createElement("div", {
      className: "qs-shelfwrap qs-shelfwrap--lg"
    }, /*#__PURE__*/React.createElement(Shelf, {
      lit: true
    }, /*#__PURE__*/React.createElement(FinishedBook, {
      title: title || data.book.title,
      author: author || data.book.author
    }))), /*#__PURE__*/React.createElement("div", {
      className: "qs-payoff__action"
    }, /*#__PURE__*/React.createElement(QSButton, {
      size: "lg",
      icon: "book-open",
      onClick: download
    }, "Download your ebook"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "qs-payoff__again",
      onClick: reset
    }, /*#__PURE__*/React.createElement(QSIcon, {
      name: "rotate-ccw",
      size: 13
    }), "Format another")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-page qs-page--narrow"
  }, /*#__PURE__*/React.createElement("p", {
    className: "qs-lead"
  }, "Turn your manuscript into a beautiful book. One calm step at a time."), /*#__PURE__*/React.createElement("div", {
    className: "qs-step"
  }, /*#__PURE__*/React.createElement(StepLabel, {
    n: "1"
  }, "Bring your story"), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: ".doc,.docx,.rtf,.txt",
    onChange: onPickStory,
    style: {
      display: 'none'
    },
    "aria-hidden": "true",
    tabIndex: -1
  }), fileName ? /*#__PURE__*/React.createElement("div", {
    className: "qs-file qs-drop--filled"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-file__name"
  }, /*#__PURE__*/React.createElement(QSIcon, {
    name: "file-text",
    size: 18,
    className: "qs-file__ico"
  }), fileName), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-payoff__again",
    onClick: () => fileRef.current && fileRef.current.click()
  }, "Change")) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-drop",
    onClick: () => fileRef.current && fileRef.current.click()
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-drop__ico"
  }, /*#__PURE__*/React.createElement(QSIcon, {
    name: "book-open",
    size: 28
  })), /*#__PURE__*/React.createElement("p", {
    className: "qs-drop__line"
  }, "Bring me your story."), /*#__PURE__*/React.createElement("p", {
    className: "qs-drop__hint"
  }, "Word, RTF, or text")), error ? /*#__PURE__*/React.createElement("p", {
    className: "qs-note"
  }, /*#__PURE__*/React.createElement(QSIcon, {
    name: "circle-alert",
    size: 16
  }), error) : null), /*#__PURE__*/React.createElement("div", {
    className: "qs-step"
  }, /*#__PURE__*/React.createElement(StepLabel, {
    n: "2"
  }, "Title & author"), /*#__PURE__*/React.createElement("div", {
    className: "qs-fields qs-fields--two"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "qs-field__label",
    htmlFor: "qs-title"
  }, "Title"), /*#__PURE__*/React.createElement("input", {
    id: "qs-title",
    className: "qs-input",
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: "The name on the cover"
  })), /*#__PURE__*/React.createElement("div", {
    className: "qs-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "qs-field__label",
    htmlFor: "qs-author"
  }, "Author"), /*#__PURE__*/React.createElement("input", {
    id: "qs-author",
    className: "qs-input",
    value: author,
    onChange: e => setAuthor(e.target.value),
    placeholder: "Your name"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "qs-step"
  }, /*#__PURE__*/React.createElement(StepLabel, {
    n: "3"
  }, "Choose a feeling"), /*#__PURE__*/React.createElement("div", {
    className: "qs-themes"
  }, data.themes.map(t => /*#__PURE__*/React.createElement(ThemeCard, {
    key: t.id,
    theme: t,
    selected: theme === t.id,
    onSelect: setTheme
  })))), /*#__PURE__*/React.createElement("div", {
    className: "qs-step"
  }, /*#__PURE__*/React.createElement(StepLabel, {
    n: "4"
  }, "Cover ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)',
      textTransform: 'none',
      letterSpacing: 0
    }
  }, "\u2014 optional")), /*#__PURE__*/React.createElement("input", {
    ref: coverRef,
    type: "file",
    accept: "image/*",
    onChange: onPickCover,
    style: {
      display: 'none'
    },
    "aria-hidden": "true",
    tabIndex: -1
  }), coverName ? /*#__PURE__*/React.createElement("div", {
    className: "qs-file qs-drop--filled"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-file__name"
  }, /*#__PURE__*/React.createElement(QSIcon, {
    name: "file-text",
    size: 18,
    className: "qs-file__ico"
  }), coverName), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-payoff__again",
    onClick: () => coverRef.current && coverRef.current.click()
  }, "Change")) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-drop",
    style: {
      padding: 'var(--space-8) var(--space-6)'
    },
    onClick: () => coverRef.current && coverRef.current.click()
  }, /*#__PURE__*/React.createElement("p", {
    className: "qs-drop__line",
    style: {
      fontSize: 'var(--fs-script)'
    }
  }, "Have a cover? Add it."), /*#__PURE__*/React.createElement("p", {
    className: "qs-drop__hint",
    style: {
      textTransform: 'none',
      letterSpacing: 0,
      fontFamily: 'var(--font-body)',
      fontStyle: 'italic'
    }
  }, "If not, I\u2019ll make a simple one."))), /*#__PURE__*/React.createElement("div", {
    className: "qs-actionrow"
  }, /*#__PURE__*/React.createElement(QSButton, {
    size: "lg",
    disabled: !fileName,
    onClick: begin
  }, "Begin"), /*#__PURE__*/React.createElement("span", {
    className: "qs-quiethint"
  }, "When you\u2019re ready. No rush.")));
}
window.Format = Format;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-shelf/format.jsx", error: String((e && e.message) || e) }); }

// ui_kits/quiet-shelf/home.jsx
try { (() => {
/* Quiet Shelf — Home. Name, one warm line, three soft doorways, the shelf. */
const QSDS_home = window.QuietFightClubDesignSystem_fae847;
const {
  Icon: QSIconHome
} = QSDS_home;
function Door({
  icon,
  title,
  line,
  onOpen
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qs-door",
    onClick: onOpen
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-door__ico"
  }, /*#__PURE__*/React.createElement(QSIconHome, {
    name: icon,
    size: 20
  })), /*#__PURE__*/React.createElement("h2", {
    className: "qs-door__title"
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "qs-door__line"
  }, line), /*#__PURE__*/React.createElement("span", {
    className: "qs-door__go"
  }, "Open", /*#__PURE__*/React.createElement(QSIconHome, {
    name: "arrow-right",
    size: 13
  })));
}
function Home({
  onNavigate
}) {
  const Shelf = window.Shelf;
  const Spine = window.Spine;
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-page qs-home"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-home__hero"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "qs-home__name"
  }, "Quiet Shelf"), /*#__PURE__*/React.createElement("p", {
    className: "qs-home__tag"
  }, "Your story, made real."), /*#__PURE__*/React.createElement("p", {
    className: "qs-home__intro"
  }, "You\u2019ve carried this long enough. Set it down here, and let it become something you can hold. Choose where you\u2019d like to begin.")), /*#__PURE__*/React.createElement("div", {
    className: "qs-doors"
  }, /*#__PURE__*/React.createElement(Door, {
    icon: "book-open",
    title: "Format",
    line: "Turn your manuscript into a beautiful book.",
    onOpen: () => onNavigate('format')
  }), /*#__PURE__*/React.createElement(Door, {
    icon: "feather",
    title: "Blurb",
    line: "Find the words to describe your book.",
    onOpen: () => onNavigate('blurb')
  }), /*#__PURE__*/React.createElement(Door, {
    icon: "film",
    title: "Promote",
    line: "Turn your writing into a video plan.",
    onOpen: () => onNavigate('promote')
  })), /*#__PURE__*/React.createElement("div", {
    className: "qs-shelfwrap"
  }, /*#__PURE__*/React.createElement("p", {
    className: "qs-shelfcap"
  }, "Your shelf"), /*#__PURE__*/React.createElement(Shelf, null, /*#__PURE__*/React.createElement(Spine, {
    title: "Salt & Ember",
    height: 112
  }), /*#__PURE__*/React.createElement(Spine, {
    title: "The Quiet House",
    height: 132
  }), /*#__PURE__*/React.createElement(Spine, {
    title: "Coming home",
    height: 104,
    tone: "ember"
  }), /*#__PURE__*/React.createElement(Spine, {
    title: "Winterlight",
    height: 124
  }))));
}
window.Home = Home;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-shelf/home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/quiet-shelf/promote.jsx
try { (() => {
/* Quiet Shelf — Promote. Paste → word/runtime → calm map → segment cards. */
const QSDS_promo = window.QuietFightClubDesignSystem_fae847;
const {
  Button: QSBtnPromo,
  Icon: QSIcoPromo,
  ScriptTextarea: QSScriptTA,
  ManuscriptCard
} = QSDS_promo;
function countWords(s) {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}
function runtimeFromWords(w) {
  const secs = Math.round(w / 150 * 60); // ~150 narrated wpm
  const m = Math.floor(secs / 60),
    s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
function Promote() {
  const {
    Becoming,
    CopyButton
  } = window;
  const data = window.QS_DATA;
  const [phase, setPhase] = React.useState('compose'); // compose | becoming | done
  const [text, setText] = React.useState('');
  const [error, setError] = React.useState('');
  const [found, setFound] = React.useState({});
  const words = countWords(text);
  const segs = data.segments;
  function map() {
    if (words < 40) {
      setError('This looks like a fragment. Paste the full piece for a proper visual map.');
      return;
    }
    setError('');
    setPhase('becoming');
  }
  function toggle(i, v) {
    setFound(p => ({
      ...p,
      [i]: v
    }));
  }
  const doneCount = segs.filter(s => found[s.index]).length;
  function notionText() {
    return segs.map(s => `## ${String(s.index).padStart(2, '0')} · ${s.startTime}–${s.endTime} · ${s.mood}\n` + `${s.excerpt}\n` + `Clip ~${s.clipDurationSeconds}s\n` + `Search: ${s.terms.join(' / ')}\n`).join('\n');
  }
  if (phase === 'becoming') {
    return /*#__PURE__*/React.createElement("div", {
      className: "qs-page"
    }, /*#__PURE__*/React.createElement(Becoming, {
      lines: ['Reading your piece…', 'Breaking it into scenes…', 'Mapping the visuals…'],
      sub: "Mapping your footage.",
      duration: 3600,
      onDone: () => setPhase('done')
    }));
  }
  if (phase === 'done') {
    return /*#__PURE__*/React.createElement("div", {
      className: "qs-page"
    }, /*#__PURE__*/React.createElement("p", {
      className: "qs-lead"
    }, "Your visuals, scene by scene. Open a search, find the clip, check it off."), /*#__PURE__*/React.createElement("div", {
      className: "qs-mapline"
    }, /*#__PURE__*/React.createElement(QSIcoPromo, {
      name: "list-checks",
      size: 16
    }), /*#__PURE__*/React.createElement("span", {
      className: "qs-mapline__count"
    }, String(doneCount).padStart(2, '0'), " of ", String(segs.length).padStart(2, '0'), " mapped"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(CopyButton, {
      text: notionText(),
      label: "Copy for Notion"
    })), /*#__PURE__*/React.createElement("div", {
      className: "qs-board"
    }, segs.map((s, idx) => /*#__PURE__*/React.createElement("div", {
      className: "qs-deal",
      key: s.index,
      style: {
        animationDelay: idx * 60 + 'ms'
      }
    }, /*#__PURE__*/React.createElement(ManuscriptCard, {
      index: s.index,
      startTime: s.startTime,
      endTime: s.endTime,
      excerpt: s.excerpt,
      mood: s.mood,
      moodTone: s.moodTone,
      clipDurationSeconds: s.clipDurationSeconds,
      terms: s.terms,
      found: !!found[s.index],
      onFoundChange: v => toggle(s.index, v)
    })))), /*#__PURE__*/React.createElement("div", {
      className: "qs-actionrow qs-actionrow--center",
      style: {
        marginTop: 'var(--space-12)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "qs-payoff__again",
      onClick: () => {
        setPhase('compose');
        setFound({});
      }
    }, /*#__PURE__*/React.createElement(QSIcoPromo, {
      name: "rotate-ccw",
      size: 13
    }), "Map a different piece")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-page"
  }, /*#__PURE__*/React.createElement("p", {
    className: "qs-lead"
  }, "Paste your writing. I\u2019ll map it into a calm shot-by-shot video plan."), /*#__PURE__*/React.createElement(QSScriptTA, {
    value: text,
    onChange: setText,
    placeholder: "Paste your writing here\u2026",
    minHeight: 260,
    ariaLabel: "Your writing"
  }), /*#__PURE__*/React.createElement("div", {
    className: "qs-meter"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, words.toLocaleString()), " words"), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, "\u2248 ", /*#__PURE__*/React.createElement("strong", null, runtimeFromWords(words)), " runtime")), error ? /*#__PURE__*/React.createElement("p", {
    className: "qs-note"
  }, /*#__PURE__*/React.createElement(QSIcoPromo, {
    name: "circle-alert",
    size: 16
  }), error) : null, /*#__PURE__*/React.createElement("div", {
    className: "qs-actionrow"
  }, /*#__PURE__*/React.createElement(QSBtnPromo, {
    size: "lg",
    icon: "sparkles",
    onClick: map
  }, "Map my visuals")));
}
window.Promote = Promote;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-shelf/promote.jsx", error: String((e && e.message) || e) }); }

// ui_kits/quiet-shelf/ui.jsx
try { (() => {
/* Quiet Shelf — shared custom UI (shelf, finished book, the becoming, copy). */
const QSDS = window.QuietFightClubDesignSystem_fae847;
const {
  Icon
} = QSDS;

/* copy-to-clipboard with a soft, brief "copied" confirmation -------- */
function useCopied(timeout = 1600) {
  const [copied, setCopied] = React.useState(false);
  const tref = React.useRef(null);
  const copy = React.useCallback(text => {
    const done = () => {
      setCopied(true);
      clearTimeout(tref.current);
      tref.current = setTimeout(() => setCopied(false), timeout);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      done();
    }
  }, [timeout]);
  React.useEffect(() => () => clearTimeout(tref.current), []);
  return [copied, copy];
}

/* a quiet "Copy" affordance that turns into "Copied" --------------- */
function CopyButton({
  text,
  label = 'Copy',
  ariaLabel
}) {
  const [copied, copy] = useCopied();
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `qs-copy${copied ? ' qs-copy--done' : ''}`,
    onClick: () => copy(text),
    "aria-label": ariaLabel || (copied ? 'Copied' : label)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: copied ? 'check' : 'copy',
    size: 13,
    strokeWidth: copied ? 3 : 2
  }), copied ? 'Copied' : label);
}

/* The wooden shelf. Children are whatever rests on it (book/spines). */
function Shelf({
  children,
  lit = false,
  className
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `qs-shelf${lit ? ' qs-shelf--lit' : ''}${className ? ' ' + className : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-shelf__glow",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "qs-shelf__books"
  }, children), /*#__PURE__*/React.createElement("div", {
    className: "qs-shelf__plank"
  }), /*#__PURE__*/React.createElement("div", {
    className: "qs-shelf__lip"
  }));
}

/* A book spine standing on the shelf (home: earlier finished works). */
function Spine({
  title,
  height = 118,
  tone
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `qs-spine${tone === 'ember' ? ' qs-spine--ember' : ''}`,
    style: {
      height
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-spine__t"
  }, title));
}

/* The finished book — front cover, spine, page edges. The payoff. */
function FinishedBook({
  title,
  author
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-bookstage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-book",
    role: "img",
    "aria-label": `${title} by ${author}, a finished ebook`
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-book__pages",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "qs-book__spine",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", null, title)), /*#__PURE__*/React.createElement("div", {
    className: "qs-book__face"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-book__rule",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "qs-book__title"
  }, title), /*#__PURE__*/React.createElement("span", {
    className: "qs-book__author"
  }, author))));
}

/* "The becoming" — calm loader cycling through reassuring lines. */
function Becoming({
  lines,
  sub,
  onDone,
  duration = 4200
}) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const per = Math.max(900, Math.floor(duration / lines.length));
    const step = setInterval(() => setI(p => Math.min(p + 1, lines.length - 1)), per);
    const finish = setTimeout(() => onDone && onDone(), duration);
    return () => {
      clearInterval(step);
      clearTimeout(finish);
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "qs-becoming",
    role: "status",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qs-becoming__lamp",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("p", {
    className: "qs-becoming__line",
    key: i
  }, lines[i]), sub ? /*#__PURE__*/React.createElement("p", {
    className: "qs-becoming__sub"
  }, sub) : null);
}

/* A small numbered step heading. */
function StepLabel({
  n,
  children
}) {
  return /*#__PURE__*/React.createElement("p", {
    className: "qs-steplabel"
  }, n ? /*#__PURE__*/React.createElement("span", {
    className: "qs-steplabel__n"
  }, n) : null, children);
}
Object.assign(window, {
  useCopied,
  CopyButton,
  Shelf,
  Spine,
  FinishedBook,
  Becoming,
  StepLabel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-shelf/ui.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.FoundCheckbox = __ds_scope.FoundCheckbox;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.SearchChip = __ds_scope.SearchChip;

__ds_ns.Stamp = __ds_scope.Stamp;

__ds_ns.ManuscriptCard = __ds_scope.ManuscriptCard;

__ds_ns.ScriptTextarea = __ds_scope.ScriptTextarea;

})();
