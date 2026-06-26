// ProgressBar — thin, quiet progress indicator.
import React from 'react';

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

export function ProgressBar({ value = 0, label, style, className }) {
  injectProgressCss();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`qfc-progress${className ? ' ' + className : ''}`}
      style={style}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label || 'Progress'}
    >
      {label ? <span className="qfc-progress__label">{label}</span> : null}
      <div className="qfc-progress__track">
        <div className="qfc-progress__fill" style={{ width: pct + '%' }}></div>
      </div>
    </div>
  );
}
