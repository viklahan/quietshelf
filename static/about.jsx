/* Quiet Shelf — About / Support. The lantern is the hero.
   CSS-only shelf + lantern, localStorage flame state, Ko-fi donate. */
const QSDS_about = window.QuietFightClubDesignSystem_fae847;
const { Icon: QSIcoAbout } = QSDS_about;

/* ── Flame state ──────────────────────────────────────────────────── */
const QS_LANTERN_KEY = 'qs.lantern.lastDonate';
const QS_LANTERN_DIM_DAYS = 5; // dims after this many days without a click

function getLanternState() {
  try {
    const raw = localStorage.getItem(QS_LANTERN_KEY);
    if (!raw) return 'dim';
    const last = parseInt(raw, 10);
    if (isNaN(last)) return 'dim';
    const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24);
    return daysSince < QS_LANTERN_DIM_DAYS ? 'lit' : 'dim';
  } catch (e) { return 'dim'; }
}

function recordDonate() {
  try { localStorage.setItem(QS_LANTERN_KEY, String(Date.now())); } catch (e) {}
}

/* ── Books on the shelf — fixed set, feels hand-curated ──────────── */
const BOOKS = [
  { w: 14, h: 68, c: '#2d3a4a' },
  { w: 22, h: 80, c: '#3a2a1e' },
  { w: 16, h: 72, c: '#1e3028' },
  { w: 10, h: 60, c: '#3d2a3a' },
  { w: 20, h: 76, c: '#4a3820' },
  { w: 14, h: 64, c: '#2a3240' },
  // gap for lantern, filled with narrower books on right
  { w: 12, h: 58, c: '#3a1e1e' },
  { w: 18, h: 74, c: '#283830' },
  { w: 24, h: 82, c: '#2e2818' },
  { w: 14, h: 66, c: '#3a2c40' },
  { w: 16, h: 70, c: '#1e2c3a' },
  { w: 20, h: 78, c: '#3c2c1c' },
];

/* ── CSS Lantern (pure, no images) ───────────────────────────────── */
function Lantern({ state }) {
  return (
    <div className={'qs-lantern' + (state === 'dim' ? ' qs-lantern--dim' : '') + (state === 'roar' ? ' qs-lantern--roar' : '')}>
      <div className="qs-lantern__hook"></div>
      <div className="qs-lantern__cap"></div>
      <div className="qs-lantern__body">
        <div className="qs-flame">
          <div className="qs-flame__outer"></div>
          <div className="qs-flame__inner"></div>
        </div>
      </div>
      <div className="qs-lantern__base"></div>
    </div>
  );
}

/* ── Bookshelf with lantern ─────────────────────────────────────── */
function BookShelf({ lanternState }) {
  const leftBooks = BOOKS.slice(0, 6);
  const rightBooks = BOOKS.slice(6);
  return (
    <div className="qs-shelf">
      <div className="qs-shelf__books">
        {leftBooks.map(function(b, i) {
          return (
            <div
              key={i}
              className="qs-book-spine"
              style={{ '--w': b.w + 'px', '--h': b.h + 'px', '--c': b.c }}
            />
          );
        })}
        {/* Gap with lantern anchored inside it */}
        <div style={{ width: '60px', flexShrink: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
            <Lantern state={lanternState} />
          </div>
        </div>
        {rightBooks.map(function(b, i) {
          return (
            <div
              key={i + 6}
              className="qs-book-spine"
              style={{ '--w': b.w + 'px', '--h': b.h + 'px', '--c': b.c }}
            />
          );
        })}
      </div>
      <div className="qs-shelf__plank"></div>
    </div>
  );
}

/* ── Feedback box ──────────────────────────────────────────────── */
function FeedbackBox() {
  const [msg, setMsg] = React.useState('');
  const [state, setState] = React.useState('idle');

  async function send() {
    if (!msg.trim() || state === 'sending') return;
    setState('sending');
    try {
      await window.QS_API.sendFeedback(msg.trim());
      setMsg('');
      setState('sent');
    } catch (e) {
      setState('error');
    }
  }

  return (
    <div>
      <textarea
        value={msg}
        onChange={function(e) { setMsg(e.target.value); if (state !== 'idle') setState('idle'); }}
        placeholder="What's working, what's not, what you wish it did…"
        rows={3}
        style={{
          display: 'block', width: '100%', maxWidth: '520px', minHeight: '84px', resize: 'vertical',
          background: 'var(--surface-raised)', border: '1px solid var(--edge-strong)',
          borderRadius: 'var(--radius-xs)', color: 'var(--text-body)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)', padding: '10px 12px',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
        <button
          type="button"
          onClick={send}
          disabled={!msg.trim() || state === 'sending'}
          style={{
            background: 'none', border: '1px solid var(--edge-strong)', borderRadius: 'var(--radius-xs)',
            color: 'var(--ember-400)', padding: '7px 16px', cursor: msg.trim() ? 'pointer' : 'default',
            fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)', opacity: msg.trim() ? 1 : 0.5,
          }}
        >
          {state === 'sending' ? 'Sending…' : 'Send'}
        </button>
        {state === 'sent' ? <span className="qs-quiethint">Thanks — got it.</span> : null}
        {state === 'error' ? <span className="qs-quiethint">Couldn't send that — try again?</span> : null}
      </div>
    </div>
  );
}

/* ── Tab door ─────────────────────────────────────────────────── */
function AboutRow({ icon, title, line, onOpen }) {
  return (
    <button type="button" className="qs-door" onClick={onOpen}>
      <span className="qs-door__ico"><QSIcoAbout name={icon} size={20} /></span>
      <h2 className="qs-door__title">{title}</h2>
      <p className="qs-door__line">{line}</p>
      <span className="qs-door__go">Open<QSIcoAbout name="arrow-right" size={13} /></span>
    </button>
  );
}

/* ── About page ───────────────────────────────────────────────── */
function About({ onNavigate }) {
  const [lanternState, setLanternState] = React.useState(getLanternState);
  const [showThanks, setShowThanks] = React.useState(false);

  function handleDonate() {
    recordDonate();
    setLanternState('roar');
    setShowThanks(true);
    // After roar animation, settle to lit
    setTimeout(function() { setLanternState('lit'); }, 1300);
  }

  return (
    <div className="qs-page">

      {/* ── Lantern hero ── */}
      <div className="qs-lantern-scene">
        <div className="qs-lantern-scene__glow"></div>
        <BookShelf lanternState={lanternState} />

        <div className="qs-lantern-copy">
          <p className="qs-lantern-copy__headline">
            {lanternState === 'dim'
              ? 'The shelf is quiet tonight.'
              : 'The shelf is burning warm.'}
          </p>
          <p className="qs-lantern-copy__body">
            Quiet Shelf is free forever. The AI is free. The code is free.
            The <strong>Cloud storage that keeps the lights on cost around $30 a month.</strong>
            {' '}If your story found its shelf here — keep the light on.
          </p>
          <a
            className="qs-donate-btn"
            href="https://ko-fi.com/quietshelf"
            target="_blank"
            rel="noreferrer"
            onClick={handleDonate}
          >
            🕯️ Keep the light on
          </a>
          <p className={'qs-lantern-thankyou' + (showThanks ? ' qs-lantern-thankyou--show' : '')}>
            The shelf roars. Thank you. ❤️
          </p>
        </div>
      </div>

      <div className="qs-lantern-divider"></div>

      {/* ── What it is ── */}
      <div style={{ maxWidth: '640px' }}>
        <h1 className="qs-home__name" style={{ marginBottom: 'var(--space-3)' }}>About Quiet Shelf</h1>
        <p className="qs-home__tag">Your story, made real.</p>
        <p className="qs-home__intro">
          A free, open-source toolkit for the parts of finishing a book that
          have nothing to do with writing it — the formatting, the blurb,
          the promotion, the keeping-track. Four quiet tools. No accounts.
          No cost to run on a free model key.
        </p>
      </div>

      <p className="qs-note" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <QSIcoAbout name="circle-alert" size={16} />
        <span>
          Blurb, Promote, and Story Map run on a free AI tier with a daily
          request cap that resets every 24 hours. If it runs dry, just wait
          for the reset. Self-hosting{' '}
          <a className="qs-casting__link" href="https://github.com/viklahan/quietshelf" target="_blank" rel="noreferrer">your own copy</a>?
          {' '}Switch <code>LLM_PROVIDER</code> in <code>.env</code> to Gemini or Ollama.
          Format needs no AI at all and always works.
        </span>
      </p>

      {/* ── The four tools ── */}
      <div className="qs-doors">
        <AboutRow icon="book-open" title="Format"
          line="Turns your manuscript into a properly typeset EPUB — four themes, real chapter breaks. No AI involved."
          onOpen={function() { onNavigate('format'); }} />
        <AboutRow icon="feather" title="Blurb"
          line="Writes the back-cover copy, taglines, and keywords that are miserable to write about your own book."
          onOpen={function() { onNavigate('blurb'); }} />
        <AboutRow icon="film" title="Promote"
          line="Maps your writing into a scene-by-scene stock-footage shot list."
          onOpen={function() { onNavigate('promote'); }} />
        <AboutRow icon="search" title="Story Map"
          line="Reflects your story's characters and how they connect, so you can find your way back in."
          onOpen={function() { onNavigate('storymap'); }} />
      </div>

      {/* ── The promise ── */}
      <p className="qs-lead" style={{ marginTop: 'var(--space-10)' }}>The one promise that matters</p>
      <p className="qs-quiethint" style={{ display: 'block', maxWidth: '640px' }}>
        Everything here reads what you actually wrote — it never invents your story.
        Story Map's character readings are drawn only from your own text.
        If you ever ask it to imagine something instead, that result is always
        marked <strong>Imagined</strong>, and that mark travels with it into
        Blurb and Promote — so you never lose track of what's yours and what
        the tool made up on your request.
      </p>

      <p className="qs-quiethint" style={{ display: 'block', marginTop: 'var(--space-6)' }}>
        Free and open-source. Built to clear the busywork around your book,
        never to write it for you.{' '}
        <a className="qs-casting__link" href="https://github.com/viklahan/quietshelf" target="_blank" rel="noreferrer">View the code on GitHub ↗</a>
      </p>

      {/* ── Feedback ── */}
      <p className="qs-lead" style={{ marginTop: 'var(--space-10)' }}>Got a suggestion, or found something broken?</p>
      <FeedbackBox />
      <p className="qs-quiethint" style={{ display: 'block', marginTop: 'var(--space-3)' }}>
        Or{' '}
        <a className="qs-casting__link" href="https://github.com/viklahan/quietshelf/issues" target="_blank" rel="noreferrer">open an issue on GitHub ↗</a>
        {' '}if you're comfortable there.
      </p>

    </div>
  );
}

window.About = About;
