/* Quiet Shelf — About. What it is, what each tab does, and the one promise
   that matters: your story stays yours, anything added is always stamped.
   Reuses home.jsx's and promote.jsx's existing classes — no new CSS needed. */
const QSDS_about = window.QuietFightClubDesignSystem_fae847;
const { Icon: QSIcoAbout } = QSDS_about;

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

function FeedbackBox() {
  const [msg, setMsg] = React.useState('');
  const [state, setState] = React.useState('idle'); // idle | sending | sent | error

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
        onChange={(e) => { setMsg(e.target.value); if (state !== 'idle') setState('idle'); }}
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

function About({ onNavigate }) {
  return (
    <div className="qs-page qs-home">
      <div className="qs-home__hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <img
            src="/static/assets/logo-mark.png"
            alt=""
            width="52"
            height="52"
            style={{ display: 'block', flex: 'none' }}
          />
          <h1 className="qs-home__name">About Quiet Shelf</h1>
        </div>
        <p className="qs-home__tag">Your story, made real.</p>
        <p className="qs-home__intro">
          A free, open-source toolkit for the parts of finishing a book that
          have nothing to do with writing it — the formatting, the blurb,
          the promotion, the keeping-track. Four quiet tools. No accounts.
          No cost to run on a free model key.
        </p>
      </div>

      <p className="qs-note" style={{ marginBottom: 'var(--space-8)' }}>
        <QSIcoAbout name="circle-alert" size={16} />
        <span>
          Blurb, Promote, and Story Map run on a free AI tier with a daily
          request cap that resets every 24 hours. If it runs dry, just wait
          for the reset. Self-hosting your own copy? You can switch{' '}
          <code>LLM_PROVIDER</code>{' '}in{' '}<code>.env</code>{' '}to Gemini or a
          local Ollama model instead. Format needs no AI at all and always works.
        </span>
      </p>

      <div className="qs-doors">
        <AboutRow
          icon="book-open"
          title="Format"
          line="Turns your manuscript into a properly typeset EPUB — four themes, real chapter breaks. No AI involved."
          onOpen={() => onNavigate('format')}
        />
        <AboutRow
          icon="feather"
          title="Blurb"
          line="Writes the back-cover copy, taglines, and keywords that are miserable to write about your own book."
          onOpen={() => onNavigate('blurb')}
        />
        <AboutRow
          icon="film"
          title="Promote"
          line="Maps your writing into a scene-by-scene stock-footage shot list."
          onOpen={() => onNavigate('promote')}
        />
        <AboutRow
          icon="search"
          title="Story Map"
          line="Reflects your story's characters and how they connect, so you can find your way back in."
          onOpen={() => onNavigate('storymap')}
        />
      </div>

      <p className="qs-lead" style={{ marginTop: 'var(--space-10)' }}>The one promise that matters</p>
      <p className="qs-quiethint" style={{ display: 'block', maxWidth: '640px' }}>
        Everything here reads what you actually wrote — it never invents your story.
        Story Map's character readings are drawn only from your own text.
        If you ever ask it to imagine something instead (a seed idea, a first
        draft of a cast), that result is always marked <strong>Imagined</strong>,
        and that mark travels with it into Blurb and Promote too when you ground
        with it — so you never lose track of what's yours and what the tool
        made up on your request.
      </p>

      <p className="qs-quiethint" style={{ display: 'block', marginTop: 'var(--space-6)' }}>
        Free and open-source. Built to clear the busywork around your book,
        never to write it for you.
      </p>

      <p className="qs-lead" style={{ marginTop: 'var(--space-10)' }}>Got a suggestion, or found something broken?</p>
      <FeedbackBox />
    </div>
  );
}

window.About = About;
