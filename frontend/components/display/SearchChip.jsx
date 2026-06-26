// SearchChip — a clickable search-term tab that opens a stock-footage search.
import React from 'react';
import { Icon } from './Icon.jsx';

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
.qfc-chip--edit { cursor: text; }
.qfc-chip__go {
  display: inline-flex;
  align-items: center;
  color: var(--text-faint);
  text-decoration: none;
  transition: color var(--dur-fast) var(--ease-quiet);
}
.qfc-chip--edit:hover .qfc-chip__go,
.qfc-chip__go:hover { color: var(--ember-500); }
.qfc-chip__input {
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
.qfc-chip__input:focus { outline: none; }
.qfc-chip--edit:focus-within {
  border-color: var(--edge-strong);
  background: var(--surface-pressed);
}
`;

function injectChipCss() {
  if (typeof document === 'undefined' || document.getElementById('qfc-chip-css')) return;
  const el = document.createElement('style');
  el.id = 'qfc-chip-css';
  el.textContent = CHIP_CSS;
  document.head.appendChild(el);
}

export function SearchChip({ term, best = false, href, onClick, onTermChange, style, className }) {
  injectChipCss();
  const url = href || `https://www.pexels.com/search/videos/${encodeURIComponent(term)}/`;
  // Editable variant: a text field styled like the chip; the search link
  // follows whatever the writer types.
  if (onTermChange) {
    return (
      <span
        className={`qfc-chip qfc-chip--edit${best ? ' qfc-chip--best' : ''}${className ? ' ' + className : ''}`}
        style={style}
      >
        <a
          className="qfc-chip__go"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          aria-label={`Search stock footage for ${term}`}
        >
          <Icon name="search" size={13} className="qfc-chip__icon" />
        </a>
        <input
          className="qfc-chip__input"
          type="text"
          value={term}
          spellCheck={false}
          size={Math.max(4, (term || '').length)}
          onChange={(e) => onTermChange(e.target.value)}
          aria-label="Edit search term"
        />
        {best ? <span className="qfc-chip__best-tag">best bet</span> : null}
      </span>
    );
  }
  return (
    <a
      className={`qfc-chip${best ? ' qfc-chip--best' : ''}${className ? ' ' + className : ''}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      style={style}
      aria-label={`Search stock footage for “${term}”${best ? ' (best bet)' : ''}`}
    >
      <Icon name="search" size={13} className="qfc-chip__icon" />
      <span>{term}</span>
      {best ? <span className="qfc-chip__best-tag">best bet</span> : null}
    </a>
  );
}
