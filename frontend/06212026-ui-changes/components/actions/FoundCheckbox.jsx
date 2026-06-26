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
