/* Quiet Shelf — Blurb. Paste/bring → tone → calm loading → copyable cards. */
const QSDS_blurb = window.QuietFightClubDesignSystem_fae847;
const { Button: QSBtnBlurb, Icon: QSIcoBlurb, ScriptTextarea } = QSDS_blurb;

const QS_TONES = [
  { id: 'warm', label: 'Warm' },
  { id: 'literary', label: 'Literary' },
  { id: 'punchy', label: 'Punchy' },
  { id: 'mysterious', label: 'Mysterious' },
];

function RCard({ label, copyText, children }) {
  const { CopyButton } = window;
  return (
    <section className="qs-rcard">
      <div className="qs-rcard__head">
        <span className="qs-rcard__label">{label}</span>
        {copyText != null ? <CopyButton text={copyText} /> : null}
      </div>
      {children}
    </section>
  );
}

function Blurb() {
  const { Becoming } = window;
  const data = window.QS_DATA.blurb;

  const [phase, setPhase] = React.useState('compose'); // compose | becoming | done
  const [text, setText] = React.useState('');
  const [tone, setTone] = React.useState('warm');
  const [error, setError] = React.useState('');
  const fileRef = React.useRef(null);

  function onPick(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!['doc', 'docx', 'rtf', 'txt'].includes(ext)) {
      setError('I can only read Word, RTF, or text files for now. Try one of those?');
      return;
    }
    setError('');
    setText(`[${f.name}]\nYour manuscript is ready. Press Find my words whenever you like.`);
  }

  function find() {
    if (!text.trim()) { setError('There’s no story here yet. Paste it in, or bring the file.'); return; }
    setError('');
    setPhase('becoming');
  }

  if (phase === 'becoming') {
    return (
      <div className="qs-page qs-page--narrow">
        <Becoming
          lines={['Reading between the lines…', 'Listening for the heart of it…', 'Finding your words…']}
          sub="Almost there."
          duration={3600}
          onDone={() => setPhase('done')}
        />
      </div>
    );
  }

  if (phase === 'done') {
    const taglineCopy = data.taglines.map((t, i) => `${i + 1}. ${t}`).join('\n');
    return (
      <div className="qs-page qs-page--narrow">
        <p className="qs-lead">Here are your words. Take the ones that feel like the book.</p>
        <div className="qs-results">
          <RCard label="Back-cover copy" copyText={data.backCover}>
            <p className="qs-backcover">{data.backCover}</p>
          </RCard>

          <RCard label="Taglines" copyText={taglineCopy}>
            <ul className="qs-taglines">
              {data.taglines.map((t, i) => (
                <li className="qs-tagline" key={i}>
                  <span className="qs-tagline__n">{String(i + 1).padStart(2, '0')}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </RCard>

          <RCard label="Store description" copyText={data.storeDescription}>
            <p className="qs-store">{data.storeDescription}</p>
          </RCard>

          <RCard label="Suggested keywords" copyText={data.keywords.join(', ')}>
            <div className="qs-keywords">
              {data.keywords.map((k) => <span className="qs-kw" key={k}>{k}</span>)}
            </div>
          </RCard>
        </div>
        <div className="qs-actionrow">
          <button type="button" className="qs-payoff__again" onClick={() => setPhase('compose')}>
            <QSIcoBlurb name="rotate-ccw" size={13} />Try a different tone
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qs-page qs-page--narrow">
      <p className="qs-lead">Paste your story, or bring the file. I’ll find the words to describe it.</p>

      <div className="qs-step">
        <ScriptTextarea
          value={text}
          onChange={setText}
          placeholder="Paste your story here…"
          minHeight={220}
          ariaLabel="Your story"
        />
        <div className="qs-actionrow" style={{ marginTop: 'var(--space-4)' }}>
          <input ref={fileRef} type="file" accept=".doc,.docx,.rtf,.txt" onChange={onPick} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          <button type="button" className="qs-payoff__again" onClick={() => fileRef.current && fileRef.current.click()}>
            <QSIcoBlurb name="file-text" size={13} />Bring the file instead
          </button>
        </div>
        {error ? <p className="qs-note"><QSIcoBlurb name="circle-alert" size={16} />{error}</p> : null}
      </div>

      <div className="qs-step">
        <p className="qs-steplabel">How should it sound?</p>
        <div className="qs-pills">
          {QS_TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`qs-pill${tone === t.id ? ' qs-pill--on' : ''}`}
              onClick={() => setTone(t.id)}
              aria-pressed={tone === t.id}
            >{t.label}</button>
          ))}
        </div>
      </div>

      <div className="qs-actionrow">
        <QSBtnBlurb size="lg" icon="sparkles" onClick={find}>Find my words</QSBtnBlurb>
      </div>
    </div>
  );
}

window.Blurb = Blurb;
