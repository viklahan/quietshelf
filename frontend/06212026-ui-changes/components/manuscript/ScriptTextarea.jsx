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
