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
