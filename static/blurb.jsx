/* Quiet Shelf — Blurb. Paste/bring → tone → calm loading → copyable cards.
   Wired to POST /api/blurb (multipart Form: text|file, tone, length). */
const QSDS_blurb = window.QuietFightClubDesignSystem_fae847;
const { Button: QSBtnBlurb, Icon: QSIcoBlurb, ScriptTextarea } = QSDS_blurb;

/* Keep the file input rendered (not display:none) so a programmatic .click()
   reliably opens the OS picker across browsers. */
const QS_HIDDEN_INPUT = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
  border: 0, opacity: 0,
};

const QS_TONES = [
  { id: 'warm', label: 'Warm' },
  { id: 'literary', label: 'Literary' },
  { id: 'punchy', label: 'Punchy' },
  { id: 'mysterious', label: 'Mysterious' },
];

function countWordsB(s) {
  const t = (s || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

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

  const [phase, setPhase] = React.useState('compose'); // compose | becoming | done
  const [text, setText] = React.useState('');
  const [file, setFile] = React.useState(null);
  const [tone, setTone] = React.useState('warm');
  const [length] = React.useState('medium');
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState(null);
  const fileRef = React.useRef(null);

  function onPick(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!['docx', 'rtf', 'txt'].includes(ext)) {
      setError('I can only read Word (.docx), RTF, or text files for now. Try one of those?');
      return;
    }
    setError('');
    setFile(f);
  }

  function clearFile() {
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function find() {
    if (!file && countWordsB(text) < 50) {
      setError('There’s not enough here yet. Paste a few paragraphs (50+ words), or bring the file.');
      return;
    }
    setError('');
    setResult(null);
    setPhase('becoming');
    try {
      const [res] = await Promise.all([
        window.QS_API.generateBlurb({ text, file, tone, length }),
        window.QS_API.calmDelay(1600),
      ]);
      setResult(res);
      setPhase('done');
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setPhase('compose');
    }
  }

  if (phase === 'becoming') {
    return (
      <div className="qs-page qs-page--narrow">
        <Becoming
          lines={['Reading between the lines…', 'Listening for the heart of it…', 'Finding your words…']}
          sub="Almost there."
          duration={3600}
          onDone={() => {}}
        />
      </div>
    );
  }

  if (phase === 'done' && result) {
    const taglines = result.taglines || [];
    const keywords = result.keywords || [];
    const taglineCopy = taglines.map((t, i) => `${i + 1}. ${t}`).join('\n');
    return (
      <div className="qs-page qs-page--narrow">
        <p className="qs-lead">Here are your words. Take the ones that feel like the book.</p>
        <div className="qs-results">
          <RCard label="Back-cover copy" copyText={result.back_cover}>
            <p className="qs-backcover">{result.back_cover}</p>
          </RCard>

          <RCard label="Taglines" copyText={taglineCopy}>
            <ul className="qs-taglines">
              {taglines.map((t, i) => (
                <li className="qs-tagline" key={i}>
                  <span className="qs-tagline__n">{String(i + 1).padStart(2, '0')}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </RCard>

          <RCard label="Store description" copyText={result.short_description}>
            <p className="qs-store">{result.short_description}</p>
          </RCard>

          <RCard label="Suggested keywords" copyText={keywords.join(', ')}>
            <div className="qs-keywords">
              {keywords.map((k) => <span className="qs-kw" key={k}>{k}</span>)}
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
          <input ref={fileRef} type="file" accept=".docx,.rtf,.txt" onChange={onPick} style={QS_HIDDEN_INPUT} tabIndex={-1} />
          {file ? (
            <div className="qs-file qs-drop--filled" style={{ flex: 1 }}>
              <span className="qs-file__name"><QSIcoBlurb name="file-text" size={18} className="qs-file__ico" />{file.name}</span>
              <button type="button" className="qs-payoff__again" onClick={clearFile}>Remove</button>
            </div>
          ) : (
            <button type="button" className="qs-payoff__again" onClick={() => fileRef.current && fileRef.current.click()}>
              <QSIcoBlurb name="file-text" size={13} />Bring the file instead
            </button>
          )}
        </div>
        {file ? <p className="qs-quiethint" style={{ marginTop: 'var(--space-3)' }}>Using your file. I’ll read a representative sample of it.</p> : null}
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
