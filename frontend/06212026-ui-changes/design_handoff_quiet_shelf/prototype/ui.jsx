/* Quiet Shelf — shared custom UI (shelf, finished book, the becoming, copy). */
const QSDS = window.QuietFightClubDesignSystem_fae847;
const { Icon } = QSDS;

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

/* The finished book — front cover, spine, page edges. The payoff. */
function FinishedBook({ title, author }) {
  return (
    <div className="qs-bookstage">
      <div className="qs-book" role="img" aria-label={`${title} by ${author}, a finished ebook`}>
        <div className="qs-book__pages" aria-hidden="true"></div>
        <div className="qs-book__spine" aria-hidden="true"><span>{title}</span></div>
        <div className="qs-book__face">
          <div className="qs-book__rule" aria-hidden="true"></div>
          <h3 className="qs-book__title">{title}</h3>
          <span className="qs-book__author">{author}</span>
        </div>
      </div>
    </div>
  );
}

/* "The becoming" — calm loader cycling through reassuring lines. */
function Becoming({ lines, sub, onDone, duration = 4200 }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const per = Math.max(900, Math.floor(duration / lines.length));
    const step = setInterval(() => setI((p) => Math.min(p + 1, lines.length - 1)), per);
    const finish = setTimeout(() => onDone && onDone(), duration);
    return () => { clearInterval(step); clearTimeout(finish); };
  }, []);
  return (
    <div className="qs-becoming" role="status" aria-live="polite">
      <span className="qs-becoming__lamp" aria-hidden="true"></span>
      <p className="qs-becoming__line" key={i}>{lines[i]}</p>
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

Object.assign(window, {
  useCopied, CopyButton, Shelf, Spine, FinishedBook, Becoming, StepLabel,
});
