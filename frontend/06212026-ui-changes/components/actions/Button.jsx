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
