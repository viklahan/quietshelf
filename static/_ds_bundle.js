/* @ds-bundle: {"format":3,"namespace":"QuietFightClubDesignSystem_fae847","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"FoundCheckbox","sourcePath":"components/actions/FoundCheckbox.jsx"},{"name":"Icon","sourcePath":"components/display/Icon.jsx"},{"name":"ProgressBar","sourcePath":"components/display/ProgressBar.jsx"},{"name":"SearchChip","sourcePath":"components/display/SearchChip.jsx"},{"name":"Stamp","sourcePath":"components/display/Stamp.jsx"},{"name":"ManuscriptCard","sourcePath":"components/manuscript/ManuscriptCard.jsx"},{"name":"ScriptTextarea","sourcePath":"components/manuscript/ScriptTextarea.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"d8a2402f319b","components/actions/FoundCheckbox.jsx":"08d4e046968e","components/display/Icon.jsx":"d083b334effb","components/display/ProgressBar.jsx":"c5bd36db34c3","components/display/SearchChip.jsx":"488a9b250828","components/display/Stamp.jsx":"ce8061250835","components/manuscript/ManuscriptCard.jsx":"4684091ab3fa","components/manuscript/ScriptTextarea.jsx":"5b4cd9be4cae","ui_kits/quiet-fight-club/app.jsx":"fbd94005aa6b","ui_kits/quiet-fight-club/engine.js":"366cd4bb46ea","ui_kits/quiet-fight-club/screens.jsx":"8e8496cdcd20","ui_kits/quiet-fight-club/shotlist.jsx":"8daaa013118e"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.QuietFightClubDesignSystem_fae847 = window.QuietFightClubDesignSystem_fae847 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/display/Icon.jsx
try { (() => {
// Icon — Quiet Fight Club's lucide subset, inlined from lucide-static@0.453.0 (ISC).
// Quiet, consistent 2px stroke. Icons are small and never decorative noise.

const QFC_ICON_PATHS = {
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
  const inner = QFC_ICON_PATHS[name];
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
Icon.names = Object.keys(QFC_ICON_PATHS);
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Icon.jsx", error: String((e && e.message) || e) }); }

// components/actions/Button.jsx
try { (() => {
// Button — mono, letterspaced, typewriter-stamp buttons. One primary per view.

const BUTTON_CSS = `
.qfc-btn {
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
.qfc-btn:active:not(:disabled) { transform: translateY(1px); }
.qfc-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.qfc-btn--md { padding: 11px 18px; }
.qfc-btn--sm { padding: 8px 12px; }
.qfc-btn--lg { padding: 15px 26px; font-size: var(--fs-small); }

.qfc-btn--primary {
  background: var(--accent);
  color: var(--on-accent);
}
.qfc-btn--primary:hover:not(:disabled) { background: var(--accent-hover); }
.qfc-btn--primary:active:not(:disabled) { background: var(--accent-press); }

.qfc-btn--secondary {
  background: transparent;
  border-color: var(--edge-strong);
  color: var(--text-body);
}
.qfc-btn--secondary:hover:not(:disabled) { background: var(--wash-paper); }

.qfc-btn--ghost {
  background: transparent;
  color: var(--text-muted);
}
.qfc-btn--ghost:hover:not(:disabled) { background: var(--wash-paper); color: var(--text-body); }

.qfc-btn--danger {
  background: transparent;
  border-color: rgba(160, 68, 55, 0.5);
  color: var(--danger-text);
}
.qfc-btn--danger:hover:not(:disabled) { background: var(--wash-oxblood); }
`;
function injectButtonCss() {
  if (typeof document === 'undefined' || document.getElementById('qfc-btn-css')) return;
  const el = document.createElement('style');
  el.id = 'qfc-btn-css';
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
    className: `qfc-btn qfc-btn--${variant} qfc-btn--${size}${className ? ' ' + className : ''}`,
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
.qfc-found {
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
.qfc-found:hover { color: var(--text-body); }
.qfc-found__box {
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
.qfc-found:hover .qfc-found__box { border-color: var(--text-faint); }
.qfc-found__check {
  color: var(--ink-950);
  transform: scale(0);
  transition: transform var(--dur-base) var(--ease-settle);
}
.qfc-found[aria-checked="true"] { color: var(--ember-400); }
.qfc-found[aria-checked="true"] .qfc-found__box {
  background: var(--accent);
  border-color: var(--accent);
}
.qfc-found[aria-checked="true"] .qfc-found__check { transform: scale(1); }
`;
function injectFoundCss() {
  if (typeof document === 'undefined' || document.getElementById('qfc-found-css')) return;
  const el = document.createElement('style');
  el.id = 'qfc-found-css';
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
    className: `qfc-found${className ? ' ' + className : ''}`,
    onClick: () => onChange && onChange(!checked),
    style: style
  }, /*#__PURE__*/React.createElement("span", {
    className: "qfc-found__box",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 13,
    strokeWidth: 3,
    className: "qfc-found__check"
  })), /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { FoundCheckbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/FoundCheckbox.jsx", error: String((e && e.message) || e) }); }

// components/display/ProgressBar.jsx
try { (() => {
// ProgressBar — thin, quiet progress indicator.

const PROGRESS_CSS = `
.qfc-progress {
  display: block;
  width: 100%;
}
.qfc-progress__track {
  height: 4px;
  width: 100%;
  background: var(--surface-pressed);
  border-radius: var(--radius-pill);
  overflow: hidden;
}
.qfc-progress__fill {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-pill);
  transition: width var(--dur-slow) var(--ease-settle);
}
.qfc-progress__label {
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
  if (typeof document === 'undefined' || document.getElementById('qfc-progress-css')) return;
  const el = document.createElement('style');
  el.id = 'qfc-progress-css';
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
    className: `qfc-progress${className ? ' ' + className : ''}`,
    style: style,
    role: "progressbar",
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": Math.round(pct),
    "aria-label": label || 'Progress'
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "qfc-progress__label"
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    className: "qfc-progress__track"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qfc-progress__fill",
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
.qfc-chip {
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
.qfc-chip:hover {
  background: var(--surface-pressed);
  border-color: var(--edge-strong);
}
.qfc-chip:active { transform: translateY(1px); }
.qfc-chip .qfc-chip__icon { color: var(--text-faint); transition: color var(--dur-fast) var(--ease-quiet); }
.qfc-chip:hover .qfc-chip__icon { color: var(--text-muted); }
.qfc-chip--best {
  border-color: rgba(197, 137, 59, 0.45);
  background: var(--wash-ember);
}
.qfc-chip--best:hover {
  border-color: var(--ember-500);
  background: rgba(197, 137, 59, 0.2);
}
.qfc-chip--best .qfc-chip__icon { color: var(--ember-500); }
.qfc-chip__best-tag {
  font-size: 0.625rem;
  letter-spacing: var(--ls-stamp);
  text-transform: uppercase;
  color: var(--ember-400);
  border-left: 1px solid rgba(197, 137, 59, 0.35);
  padding-left: 7px;
}
`;
function injectChipCss() {
  if (typeof document === 'undefined' || document.getElementById('qfc-chip-css')) return;
  const el = document.createElement('style');
  el.id = 'qfc-chip-css';
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
    className: `qfc-chip${best ? ' qfc-chip--best' : ''}${className ? ' ' + className : ''}`,
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: onClick,
    style: style,
    "aria-label": `Search stock footage for “${term}”${best ? ' (best bet)' : ''}`
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 13,
    className: "qfc-chip__icon"
  }), /*#__PURE__*/React.createElement("span", null, term), best ? /*#__PURE__*/React.createElement("span", {
    className: "qfc-chip__best-tag"
  }, "best bet") : null);
}
Object.assign(__ds_scope, { SearchChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/SearchChip.jsx", error: String((e && e.message) || e) }); }

// components/display/Stamp.jsx
try { (() => {
// Stamp — small rubber-stamp badge for moods and statuses.

const STAMP_CSS = `
.qfc-stamp {
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
.qfc-stamp--ember {
  color: var(--ember-400);
  border-color: rgba(197, 137, 59, 0.45);
  background: var(--wash-ember);
}
.qfc-stamp--oxblood {
  color: var(--oxblood-400);
  border-color: rgba(160, 68, 55, 0.5);
  background: var(--wash-oxblood);
}
.qfc-stamp--paper {
  color: var(--text-body);
  border-color: var(--edge-strong);
  background: var(--wash-paper);
}
`;
function injectStampCss() {
  if (typeof document === 'undefined' || document.getElementById('qfc-stamp-css')) return;
  const el = document.createElement('style');
  el.id = 'qfc-stamp-css';
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
  const toneClass = tone !== 'neutral' ? ` qfc-stamp--${tone}` : '';
  return /*#__PURE__*/React.createElement("span", {
    className: `qfc-stamp${toneClass}${className ? ' ' + className : ''}`,
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
.qfc-mcard {
  position: relative;
  background: var(--surface-card);
  border: var(--border-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card), var(--shadow-inset-paper);
  padding: var(--space-6);
  transition: border-color var(--dur-base) var(--ease-quiet),
              box-shadow var(--dur-base) var(--ease-quiet);
}
.qfc-mcard__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid rgba(126, 43, 35, 0.4); /* index-card rule */
}
.qfc-mcard__id {
  font-family: var(--font-mono);
  font-size: var(--fs-meta);
  letter-spacing: var(--ls-meta);
  color: var(--text-muted);
}
.qfc-mcard__id strong {
  color: var(--text-body);
  font-weight: 600;
}
.qfc-mcard__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.qfc-mcard__clock {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: var(--fs-meta);
  letter-spacing: 0.04em;
  color: var(--text-faint);
  white-space: nowrap;
}
.qfc-mcard__excerpt {
  font-family: var(--font-body);
  font-size: var(--fs-script);
  line-height: var(--lh-script);
  color: var(--text-body);
  max-width: var(--measure-script);
  margin: 0 0 var(--space-5) 0;
  transition: opacity var(--dur-base) var(--ease-quiet);
  text-wrap: pretty;
}
.qfc-mcard__terms {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  transition: opacity var(--dur-base) var(--ease-quiet);
}
.qfc-mcard__stampbox {
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
.qfc-mcard--done { border-color: rgba(197, 137, 59, 0.28); }
.qfc-mcard--done .qfc-mcard__excerpt,
.qfc-mcard--done .qfc-mcard__terms,
.qfc-mcard--done .qfc-mcard__head { opacity: 0.45; }
.qfc-mcard--done .qfc-mcard__stampbox {
  opacity: 1;
  transform: rotate(-5deg) scale(1);
}
@media (max-width: 560px) {
  .qfc-mcard { padding: var(--space-4); }
}
`;
function injectMcardCss() {
  if (typeof document === 'undefined' || document.getElementById('qfc-mcard-css')) return;
  const el = document.createElement('style');
  el.id = 'qfc-mcard-css';
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
    className: `qfc-mcard${found ? ' qfc-mcard--done' : ''}${className ? ' ' + className : ''}`,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "qfc-mcard__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qfc-mcard__id"
  }, /*#__PURE__*/React.createElement("strong", null, pad2(index)), " \xB7 ", startTime, "\u2013", endTime), /*#__PURE__*/React.createElement("span", {
    className: "qfc-mcard__meta"
  }, mood ? /*#__PURE__*/React.createElement(__ds_scope.Stamp, {
    tone: moodTone
  }, mood) : null, clipDurationSeconds ? /*#__PURE__*/React.createElement("span", {
    className: "qfc-mcard__clock"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "clock",
    size: 13
  }), "~", clipDurationSeconds, "s clip") : null)), /*#__PURE__*/React.createElement("p", {
    className: "qfc-mcard__excerpt"
  }, excerpt), /*#__PURE__*/React.createElement("div", {
    className: "qfc-mcard__terms"
  }, terms.map((term, i) => /*#__PURE__*/React.createElement(__ds_scope.SearchChip, {
    key: term + i,
    term: term,
    best: i === 0
  }))), /*#__PURE__*/React.createElement(__ds_scope.FoundCheckbox, {
    checked: found,
    onChange: onFoundChange
  }), /*#__PURE__*/React.createElement("span", {
    className: "qfc-mcard__stampbox",
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
.qfc-scriptta {
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
.qfc-scriptta::placeholder {
  color: var(--text-faint);
  font-style: italic;
}
.qfc-scriptta:hover { border-color: var(--edge-strong); }
.qfc-scriptta:focus {
  outline: none;
  border-color: rgba(197, 137, 59, 0.55);
}
@media (max-width: 560px) {
  .qfc-scriptta { padding: var(--space-4); }
}
`;
function injectScriptTaCss() {
  if (typeof document === 'undefined' || document.getElementById('qfc-scriptta-css')) return;
  const el = document.createElement('style');
  el.id = 'qfc-scriptta-css';
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
    className: `qfc-scriptta${className ? ' ' + className : ''}`,
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

// ui_kits/quiet-fight-club/app.jsx
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
    const words = window.QFCEngine.countWords(script);
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
      const r = window.QFCEngine.map(script);
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
      className: "qfc-results",
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
      setScript(window.QFCEngine.SAMPLE_SCRIPT);
      setFieldError(null);
    },
    error: fieldError
  });
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-fight-club/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/quiet-fight-club/engine.js
try { (() => {
// QFCEngine — fake mapping engine for the UI kit. Deterministic, in-memory.
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
  window.QFCEngine = {
    WPM: WPM,
    countWords: countWords,
    fmtTime: fmtTime,
    map: map,
    SAMPLE_SCRIPT: SAMPLE_SCRIPT
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-fight-club/engine.js", error: String((e && e.message) || e) }); }

// ui_kits/quiet-fight-club/screens.jsx
try { (() => {
// Screens: EmptyDesk (landing), Working (loading), EngineError.
const {
  Button,
  ScriptTextarea,
  Icon,
  ProgressBar
} = window.QuietFightClubDesignSystem_fae847;
const E = window.QFCEngine;
function Wordmark() {
  return /*#__PURE__*/React.createElement("header", {
    className: "qfc-page__header"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "qfc-wordmark"
  }, "Quiet Fight Club"), /*#__PURE__*/React.createElement("p", {
    className: "qfc-tagline"
  }, "Turn your script into a shot list."));
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
    className: "qfc-page",
    "data-screen-label": "Empty Desk"
  }, /*#__PURE__*/React.createElement(Wordmark, null), /*#__PURE__*/React.createElement(ScriptTextarea, {
    value: script,
    onChange: onScriptChange,
    minHeight: 300
  }), /*#__PURE__*/React.createElement("div", {
    className: "qfc-deskmeta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qfc-deskmeta__counts"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-text",
    size: 13
  }), words.toLocaleString(), " ", words === 1 ? 'word' : 'words', " \xB7 \u2248", runtime, " narration"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "qfc-textlink",
    onClick: onSample
  }, "Try a sample script")), error ? /*#__PURE__*/React.createElement("p", {
    className: "qfc-fieldnote",
    role: "alert"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-alert",
    size: 14
  }), error) : null, /*#__PURE__*/React.createElement("div", {
    className: "qfc-deskaction"
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
    className: "qfc-page qfc-page--center",
    "data-screen-label": "Working"
  }, /*#__PURE__*/React.createElement(Wordmark, null), /*#__PURE__*/React.createElement("div", {
    className: "qfc-working",
    role: "status"
  }, /*#__PURE__*/React.createElement("p", {
    className: "qfc-working__line",
    key: lineIdx
  }, WORKING_LINES[lineIdx]), /*#__PURE__*/React.createElement("div", {
    className: "qfc-working__bar"
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: progress
  }))));
}
function EngineError({
  onRetry,
  onBack
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "qfc-page qfc-page--center",
    "data-screen-label": "Engine Error"
  }, /*#__PURE__*/React.createElement(Wordmark, null), /*#__PURE__*/React.createElement("div", {
    className: "qfc-enginerror",
    role: "alert"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-alert",
    size: 20,
    color: "var(--danger-text)"
  }), /*#__PURE__*/React.createElement("p", {
    className: "qfc-enginerror__msg"
  }, "The mapping engine didn't answer. Wait a moment and try again."), /*#__PURE__*/React.createElement("div", {
    className: "qfc-enginerror__actions"
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
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-fight-club/screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/quiet-fight-club/shotlist.jsx
try { (() => {
// Shot list: sticky SummaryBar + the manuscript-card board.
const {
  Button,
  ManuscriptCard,
  ProgressBar
} = window.QuietFightClubDesignSystem_fae847;
const Eng = window.QFCEngine;
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
    className: "qfc-summary",
    "data-comment-anchor": "summary-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qfc-summary__inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qfc-summary__facts"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qfc-summary__title"
  }, result.video_title_suggestion), /*#__PURE__*/React.createElement("span", {
    className: "qfc-summary__meta"
  }, total, " segments \xB7 \u2248", Eng.fmtTime(result.estimated_runtime_seconds), " runtime")), /*#__PURE__*/React.createElement("div", {
    className: "qfc-summary__progress"
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: total ? foundCount / total : 0,
    label: `${foundCount} of ${total} segments clipped`
  })), /*#__PURE__*/React.createElement("div", {
    className: "qfc-summary__actions"
  }, confirmingNew ? /*#__PURE__*/React.createElement("span", {
    className: "qfc-summary__confirm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qfc-summary__confirmtext"
  }, "Clear this map?"), /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "sm",
    onClick: onConfirmNew
  }, "Clear it"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: onCancelNew
  }, "Keep it")) : /*#__PURE__*/React.createElement("span", {
    className: "qfc-summary__btns"
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
    className: "qfc-board",
    "data-screen-label": "Shot List"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qfc-board__cards"
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
    className: dealt ? 'qfc-deal' : '',
    style: dealt ? {
      animationDelay: Math.min(i, 12) * 60 + 'ms'
    } : null
  }))), result.partial ? /*#__PURE__*/React.createElement("div", {
    className: "qfc-board__partial"
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
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/quiet-fight-club/shotlist.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.FoundCheckbox = __ds_scope.FoundCheckbox;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.SearchChip = __ds_scope.SearchChip;

__ds_ns.Stamp = __ds_scope.Stamp;

__ds_ns.ManuscriptCard = __ds_scope.ManuscriptCard;

__ds_ns.ScriptTextarea = __ds_scope.ScriptTextarea;

})();
