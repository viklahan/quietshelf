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
