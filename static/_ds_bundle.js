/* @ds-bundle: {"format":3,"namespace":"QuietFightClubDesignSystem_fae847","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"FoundCheckbox","sourcePath":"components/actions/FoundCheckbox.jsx"},{"name":"Icon","sourcePath":"components/display/Icon.jsx"},{"name":"ProgressBar","sourcePath":"components/display/ProgressBar.jsx"},{"name":"SearchChip","sourcePath":"components/display/SearchChip.jsx"},{"name":"Stamp","sourcePath":"components/display/Stamp.jsx"},{"name":"ManuscriptCard","sourcePath":"components/manuscript/ManuscriptCard.jsx"},{"name":"ScriptTextarea","sourcePath":"components/manuscript/ScriptTextarea.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"6263a7b9f23d","components/actions/FoundCheckbox.jsx":"d2d2ea4de528","components/display/Icon.jsx":"27f26c2cbd5d","components/display/ProgressBar.jsx":"2083f7a45609","components/display/SearchChip.jsx":"0bd3bfcf4ad5","components/display/Stamp.jsx":"f05bf6c4fc16","components/manuscript/ManuscriptCard.jsx":"48d594d45e65","components/manuscript/ScriptTextarea.jsx":"e182f4d188b7","design_handoff_quiet_shelf/prototype/app.jsx":"2f78be9fed77","design_handoff_quiet_shelf/prototype/blurb.jsx":"75c2b3d955f9","design_handoff_quiet_shelf/prototype/data.js":"acb0e00458e9","design_handoff_quiet_shelf/prototype/format.jsx":"bf0aef92ef96","design_handoff_quiet_shelf/prototype/home.jsx":"b4fc505a546e","design_handoff_quiet_shelf/prototype/promote.jsx":"732254faa414","design_handoff_quiet_shelf/prototype/ui.jsx":"8cd32a209f24","quit-happens/app.jsx":"1a0b57d75a5d","quit-happens/cards.jsx":"9033d8e7ecbe","quit-happens/components.jsx":"d51028d82aeb","quit-happens/engine.js":"1f015bd4c8df","quit-happens/icons.jsx":"07ffd864d55f","quit-happens/results.jsx":"6983569fc09e","quit-happens/screens.jsx":"7c6724f6cdd2","ui_kits/quiet-shelf-promote/app.jsx":"8f4a9083e880","ui_kits/quiet-shelf-promote/engine.js":"e14a980c5717","ui_kits/quiet-shelf-promote/screens.jsx":"994c895d266a","ui_kits/quiet-shelf-promote/shotlist.jsx":"7de5e9ba6d34","ui_kits/quiet-shelf/app.jsx":"2f78be9fed77","ui_kits/quiet-shelf/blurb.jsx":"75c2b3d955f9","ui_kits/quiet-shelf/data.js":"acb0e00458e9","ui_kits/quiet-shelf/format.jsx":"bf0aef92ef96","ui_kits/quiet-shelf/home.jsx":"b4fc505a546e","ui_kits/quiet-shelf/promote.jsx":"732254faa414","ui_kits/quiet-shelf/ui.jsx":"8cd32a209f24"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.QuietFightClubDesignSystem_fae847 = window.QuietFightClubDesignSystem_fae847 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/display/Icon.jsx
try { (() => {
// Icon â€” Quiet Shelf's lucide subset, inlined from lucide-static@0.453.0 (ISC).
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
// Button â€” mono, letterspaced, typewriter-stamp buttons. One primary per view.

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
// FoundCheckbox â€” the satisfying "Found it" check. Quiet box, ember check.

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
// ProgressBar â€” thin, quiet progress indicator.

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
// SearchChip â€” a clickable search-term tab that opens a stock-footage search.

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
.qs-chip--edit { cursor: text; }
.qs-chip__go {
  display: inline-flex;
  align-items: center;
  color: var(--text-faint);
  text-decoration: none;
  transition: color var(--dur-fast) var(--ease-quiet);
}
.qs-chip--edit:hover .qs-chip__go,
.qs-chip__go:hover { color: var(--ember-500); }
.qs-chip__input {
  font-family: var(--font-mono);
  font-size: var(--fs-small);
  line-height: 1;
  color: var(--text-body);
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  min-width: 4ch;
}
.qs-chip__input:focus { outline: none; }
.qs-chip--edit:focus-within {
  border-color: var(--edge-strong);
  background: var(--surface-pressed);
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
  onTermChange,
  style,
  className
}) {
  injectChipCss();
  const url = href || `https://www.pexels.com/search/videos/${encodeURIComponent(term)}/`;
  // Editable variant: a text field styled like the chip; the search link
  // follows whatever the writer types.
  if (onTermChange) {
    return /*#__PURE__*/React.createElement("span", {
      className: `qs-chip qs-chip--edit${best ? ' qs-chip--best' : ''}${className ? ' ' + className : ''}`,
      style: style
    }, /*#__PURE__*/React.createElement("a", {
      className: "qs-chip__go",
      href: url,
      target: "_blank",
      rel: "noopener noreferrer",
      onClick: onClick,
      "aria-label": `Search stock footage for ${term}`
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "search",
      size: 13,
      className: "qs-chip__icon"
    })), /*#__PURE__*/React.createElement("input", {
      className: "qs-chip__input",
      type: "text",
      value: term,
      spellCheck: false,
      size: Math.max(4, (term || '').length),
      onChange: e => onTermChange(e.target.value),
      "aria-label": "Edit search term"
    }), best ? /*#__PURE__*/React.createElement("span", {
      className: "qs-chip__best-tag"
    }, "best bet") : null);
  }
  return /*#__PURE__*/React.createElement("a", {
    className: `qs-chip${best ? ' qs-chip--best' : ''}${className ? ' ' + className : ''}`,
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: onClick,
    style: style,
    "aria-label": `Search stock footage for â€œ${term}â€${best ? ' (best bet)' : ''}`
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
// Stamp â€” small rubber-stamp badge for moods and statuses.

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
// ManuscriptCard â€” the signature element. One segment of the shot list,
// styled like an index card from a writer's desk. Found â‡’ set aside, faded,
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
  onTermChange,
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
    key: i,
    term: term,
    best: i === 0,
    onTermChange: onTermChange ? (v => onTermChange(i, v)) : undefined
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
// ScriptTextarea â€” a manuscript page to paste a script into.

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


__ds_ns.Button = __ds_scope.Button;
__ds_ns.FoundCheckbox = __ds_scope.FoundCheckbox;
__ds_ns.Icon = __ds_scope.Icon;
__ds_ns.ProgressBar = __ds_scope.ProgressBar;
__ds_ns.SearchChip = __ds_scope.SearchChip;
__ds_ns.Stamp = __ds_scope.Stamp;
__ds_ns.ManuscriptCard = __ds_scope.ManuscriptCard;
__ds_ns.ScriptTextarea = __ds_scope.ScriptTextarea;

})();
