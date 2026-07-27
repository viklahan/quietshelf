/* Quiet Shelf — shared custom UI (shelf, finished book, the becoming, copy,
   kept drafts, and the story-map grounding row). */
const QSDS = window.QuietFightClubDesignSystem_fae847;
const { Icon } = QSDS;

/* kept drafts — a refresh must never eat a writer's words ---------- */
function useKeptDraft(key) {
  const [value, setValue] = React.useState(() => {
    try { return localStorage.getItem(key) || ''; } catch (e) { return ''; }
  });
  const set = React.useCallback((next) => {
    setValue(next);
    try {
      if (next) localStorage.setItem(key, next);
      else localStorage.removeItem(key);
    } catch (e) { /* private mode / full storage — the in-memory draft still works */ }
  }, [key]);
  return [value, set];
}

/* the last story map, kept so other tabs can ground with it -------- */
const QS_LAST_MAP_KEY = 'qs.storymap.last';

function loadLastMap() {
  try {
    const raw = localStorage.getItem(QS_LAST_MAP_KEY);
    if (!raw) return null;
    const m = JSON.parse(raw);
    if (!m || !Array.isArray(m.characters) || !m.characters.length) return null;
    return m;
  } catch (e) { return null; }
}

function saveLastMap(m) {
  try { localStorage.setItem(QS_LAST_MAP_KEY, JSON.stringify(m)); } catch (e) {}
}

/* "Ground with your story map" — the quiet opt-in row Blurb and
   Promote share. The Imagined stamp travels with an imagined map. */
function GroundRow({ map, use, onChange }) {
  const { Stamp } = QSDS;
  const n = (map.characters || []).length;
  return (
    <div className="qs-groundrow">
      <button
        type="button"
        className={`qs-pill${use ? ' qs-pill--on' : ''}`}
        aria-pressed={use}
        onClick={() => onChange(!use)}
      >
        <Icon name="book-open" size={13} /> Ground with your story map · {n} {n === 1 ? 'character' : 'characters'}
      </button>
      {map.fabricated ? <Stamp tone="ember">Imagined</Stamp> : null}
    </div>
  );
}

/* copy-to-clipboard with a soft, brief "copied" confirmation -------- */
function useCopied(timeout = 1600) {
  const [copied, setCopied] = React.useState(false);
  const tref = React.useRef(null);
  const copy = React.useCallback((text) => {
    const done = () => {
      setCopied(true);
      clearTimeout(tref.current);
      tref.current = setTimeout(() => setCopied(false), timeout);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      done();
    }
  }, [timeout]);
  React.useEffect(() => () => clearTimeout(tref.current), []);
  return [copied, copy];
}

/* a quiet "Copy" affordance that turns into "Copied" --------------- */
function CopyButton({ text, label = 'Copy', ariaLabel }) {
  const [copied, copy] = useCopied();
  return (
    <button
      type="button"
      className={`qs-copy${copied ? ' qs-copy--done' : ''}`}
      onClick={() => copy(text)}
      aria-label={ariaLabel || (copied ? 'Copied' : label)}
    >
      <Icon name={copied ? 'check' : 'copy'} size={13} strokeWidth={copied ? 3 : 2} />
      {copied ? 'Copied' : label}
    </button>
  );
}

/* The wooden shelf. Children are whatever rests on it (book/spines). */
function Shelf({ children, lit = false, className }) {
  return (
    <div className={`qs-shelf${lit ? ' qs-shelf--lit' : ''}${className ? ' ' + className : ''}`}>
      <div className="qs-shelf__glow" aria-hidden="true"></div>
      <div className="qs-shelf__books">{children}</div>
      <div className="qs-shelf__plank"></div>
      <div className="qs-shelf__lip"></div>
    </div>
  );
}

/* A book spine standing on the shelf (home: earlier finished works). */
function Spine({ title, height = 118, tone }) {
  return (
    <div
      className={`qs-spine${tone === 'ember' ? ' qs-spine--ember' : ''}`}
      style={{ height }}
      aria-hidden="true"
    >
      <span className="qs-spine__t">{title}</span>
    </div>
  );
}

/* The finished book — front cover, spine, page edges. The payoff.
   coverUrl (a real uploaded image) takes priority; otherwise bg/ink let the
   caller match the ACTUAL theme colors instead of a generic dark mockup.
   All three are optional so existing callers (e.g. Home's decorative use)
   keep working unchanged. */
function FinishedBook({ title, author, coverUrl, bg, ink }) {
  if (coverUrl) {
    return (
      <div className="qs-bookstage">
        <div className="qs-book" role="img" aria-label={`${title} by ${author}, a finished ebook`}>
          <div className="qs-book__pages" aria-hidden="true"></div>
          <div className="qs-book__spine" aria-hidden="true"><span>{title}</span></div>
          <div
            className="qs-book__face"
            style={{ backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          ></div>
        </div>
      </div>
    );
  }
  return (
    <div className="qs-bookstage">
      <div className="qs-book" role="img" aria-label={`${title} by ${author}, a finished ebook`}>
        <div className="qs-book__pages" aria-hidden="true"></div>
        <div className="qs-book__spine" aria-hidden="true"><span>{title}</span></div>
        <div className="qs-book__face" style={bg ? { background: bg } : undefined}>
          <div className="qs-book__rule" aria-hidden="true" style={ink ? { background: ink } : undefined}></div>
          <h3 className="qs-book__title" style={ink ? { color: ink } : undefined}>{title}</h3>
          <span className="qs-book__author" style={ink ? { color: ink } : undefined}>{author}</span>
        </div>
      </div>
    </div>
  );
}

/* "The becoming" — calm loader cycling through reassuring lines. */
function Becoming({ lines, sub, onDone, duration = 4200 }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    // Keep the lines moving for as long as the work actually runs. Real calls
    // (free-tier LLMs especially) usually outlast `duration`, so cycle the
    // lines instead of freezing on the last one — the parent unmounts us when
    // the request resolves. onDone stays a soft, optional auto-advance.
    const per = Math.max(900, Math.floor(duration / lines.length));
    const step = setInterval(() => setI((p) => p + 1), per);
    const finish = onDone ? setTimeout(() => onDone(), duration) : null;
    return () => { clearInterval(step); if (finish) clearTimeout(finish); };
  }, []);
  return (
    <div className="qs-becoming" role="status" aria-live="polite">
      <span className="qs-becoming__lamp" aria-hidden="true"></span>
      <p className="qs-becoming__line" key={i}>{lines[i % lines.length]}</p>
      {sub ? <p className="qs-becoming__sub">{sub}</p> : null}
    </div>
  );
}

/* A small numbered step heading. */
function StepLabel({ n, children }) {
  return (
    <p className="qs-steplabel">
      {n ? <span className="qs-steplabel__n">{n}</span> : null}
      {children}
    </p>
  );
}

/* Tooltip — a small "?" affordance that reveals one short line on hover/focus.
   Shared across every tab so a control never needs guessing before you commit
   to it. Keyboard accessible (focus shows it same as hover); one instance of
   its CSS injected once, like the other components in this file. */
function injectTooltipCss() {
  if (typeof document === 'undefined' || document.getElementById('qs-tooltip-css')) return;
  const el = document.createElement('style');
  el.id = 'qs-tooltip-css';
  el.textContent = `
.qs-tip {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.qs-tip__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 1px solid var(--edge-strong);
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1;
  background: transparent;
  cursor: help;
  transition: color var(--dur-fast) var(--ease-quiet), border-color var(--dur-fast) var(--ease-quiet);
}
.qs-tip__trigger:hover, .qs-tip__trigger:focus-visible {
  color: var(--ember-400);
  border-color: rgba(197, 137, 59, 0.55);
  outline: none;
}
.qs-tip__bubble {
  position: absolute;
  bottom: calc(100% + 7px);
  left: 50%;
  transform: translateX(-50%) translateY(2px);
  min-width: 160px;
  max-width: 240px;
  width: max-content;
  background: var(--surface-raised);
  border: 1px solid var(--edge-strong);
  border-radius: var(--radius-xs);
  box-shadow: var(--shadow-card);
  color: var(--text-body);
  font-family: var(--font-body);
  font-size: var(--fs-small);
  line-height: 1.35;
  padding: 7px 10px;
  z-index: 20;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--dur-fast) var(--ease-quiet), transform var(--dur-fast) var(--ease-quiet);
}
.qs-tip__trigger:hover + .qs-tip__bubble,
.qs-tip__trigger:focus-visible + .qs-tip__bubble {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  pointer-events: auto;
}
`;
  document.head.appendChild(el);
}

function Tooltip({ text, label = 'More info' }) {
  injectTooltipCss();
  return (
    <span className="qs-tip">
      <button type="button" className="qs-tip__trigger" aria-label={label} tabIndex={0}>?</button>
      <span className="qs-tip__bubble" role="tooltip">{text}</span>
    </span>
  );
}

Object.assign(window, {
  useCopied, CopyButton, Shelf, Spine, FinishedBook, Becoming, StepLabel, Tooltip,
  useKeptDraft, loadLastMap, saveLastMap, GroundRow,
});
