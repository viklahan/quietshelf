// ManuscriptCard — the signature element. One segment of the shot list,
// styled like an index card from a writer's desk. Found ⇒ set aside, faded,
// stamped.
import React from 'react';
import { Icon } from '../display/Icon.jsx';
import { Stamp } from '../display/Stamp.jsx';
import { SearchChip } from '../display/SearchChip.jsx';
import { FoundCheckbox } from '../actions/FoundCheckbox.jsx';

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

export function ManuscriptCard({
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
  className,
}) {
  injectMcardCss();
  return (
    <article
      className={`qfc-mcard${found ? ' qfc-mcard--done' : ''}${className ? ' ' + className : ''}`}
      style={style}
    >
      <div className="qfc-mcard__head">
        <span className="qfc-mcard__id">
          <strong>{pad2(index)}</strong> · {startTime}–{endTime}
        </span>
        <span className="qfc-mcard__meta">
          {mood ? <Stamp tone={moodTone}>{mood}</Stamp> : null}
          {clipDurationSeconds ? (
            <span className="qfc-mcard__clock">
              <Icon name="clock" size={13} />
              ~{clipDurationSeconds}s clip
            </span>
          ) : null}
        </span>
      </div>

      <p className="qfc-mcard__excerpt">{excerpt}</p>

      <div className="qfc-mcard__terms">
        {terms.map((term, i) => (
          <SearchChip
            key={i}
            term={term}
            best={i === 0}
            onTermChange={onTermChange ? (v) => onTermChange(i, v) : undefined}
          />
        ))}
      </div>

      <FoundCheckbox checked={found} onChange={onFoundChange} />

      <span className="qfc-mcard__stampbox" aria-hidden="true">
        <Icon name="circle-check" size={14} />
        found
      </span>
    </article>
  );
}
