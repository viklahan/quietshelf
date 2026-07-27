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
  { id: 'warm', label: 'Warm', eg: 'A story about finding your way home — and the people who help you get there.' },
  { id: 'literary', label: 'Literary', eg: 'In the silence between sentences, the truth of who we are quietly assembles itself.' },
  { id: 'punchy', label: 'Punchy', eg: 'She had 48 hours. One name. No backup.' },
  { id: 'mysterious', label: 'Mysterious', eg: 'Something followed her home. She just didn’t know it yet.' },
];

const QS_LENGTHS = [
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'full', label: 'Full' },
];

/* kept blurbs — saved runs the writer chose to keep */
const QS_KEPT_KEY = 'qs.blurb.kept';
function loadKeptBlurbs() {
  try { return JSON.parse(localStorage.getItem(QS_KEPT_KEY)) || []; } catch (e) { return []; }
}
function saveKeptBlurbs(list) {
  try { localStorage.setItem(QS_KEPT_KEY, JSON.stringify(list.slice(0, 12))); } catch (e) {}
}

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
  const { Becoming, useKeptDraft, loadLastMap, GroundRow, Tooltip } = window;

  const [phase, setPhase] = React.useState('compose'); // compose | becoming | done
  const [text, setText] = useKeptDraft('qs.draft.blurb');
  const [file, setFile] = React.useState(null);
  const [tone, setTone] = React.useState('warm');
  const [length, setLength] = React.useState('medium');
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [take, setTake] = React.useState(0);
  const [comps, setComps] = React.useState([]);
  const [kept, setKept] = React.useState(loadKeptBlurbs);
  const [justKept, setJustKept] = React.useState(false);
  // The saved Story Map, if one exists. Found maps ground by default; an
  // imagined map is strictly opt-in — invention never flows in silently.
  const [gmap] = React.useState(loadLastMap);
  const [useMap, setUseMap] = React.useState(() => {
    const m = loadLastMap();
    return !!(m && !m.fabricated);
  });
  const [groundedBy, setGroundedBy] = React.useState(null); // {n, fabricated} of the run shown
  const fileRef = React.useRef(null);

  const words = countWordsB(text);

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
    const grounding = useMap && gmap ? gmap : null;
    setError('');
    setResult(null);
    setPhase('becoming');
    try {
      const [res] = await Promise.all([
        window.QS_API.generateBlurb({
          text, file, tone, length,
          mapJson: grounding ? JSON.stringify(grounding) : undefined,
        }),
        window.QS_API.calmDelay(1600),
      ]);
      setResult(res);
      setTake(0);
      setComps(res.comps || []);
      setJustKept(false);
      setGroundedBy(grounding ? { n: grounding.characters.length, fabricated: !!grounding.fabricated } : null);
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
    const { Stamp: QSStampB } = QSDS_blurb;
    /* Works today (single back_cover) and with the three-takes API (back_cover_variants). */
    const variants = (result.back_cover_variants && result.back_cover_variants.length) ? result.back_cover_variants : [result.back_cover];
    const takeIdx = Math.min(take, variants.length - 1);
    const keepThis = () => {
      const entry = {
        id: 'k' + Date.now(), ts: Date.now(), tone, length,
        back_cover: variants[takeIdx], taglines, keywords,
        short_description: result.short_description,
        query_paragraph: result.query_paragraph, comps,
      };
      const next = [entry, ...kept];
      setKept(next); saveKeptBlurbs(next); setJustKept(true);
    };
    return (
      <div className="qs-page qs-page--narrow">
        <p className="qs-lead">Here are your words. Take the ones that feel like the book.</p>
        {groundedBy ? (
          <p className="qs-quiethint" style={{ marginBottom: 'var(--space-6)' }}>
            Grounded by your story map · {groundedBy.n} {groundedBy.n === 1 ? 'character' : 'characters'}
            {groundedBy.fabricated ? <> <QSStampB tone="ember">Imagined</QSStampB></> : null}
          </p>
        ) : null}
        <div className="qs-results">
          <section>
            <div className="qs-rcard__head" style={{ border: 'none', margin: '0 0 var(--space-4)', padding: 0 }}>
              <span className="qs-rcard__label">Back-cover copy</span>
            </div>
            {variants.length > 1 ? (
              <div className="qs-takes" role="radiogroup" aria-label="Back-cover takes">
                {variants.map((v, i) => (
                  <button key={i} type="button" role="radio" aria-checked={takeIdx === i}
                    className={`qs-take${takeIdx === i ? ' qs-take--on' : ''}`}
                    onClick={() => setTake(i)}>Take {String(i + 1).padStart(2, '0')}</button>
                ))}
              </div>
            ) : null}
            <div className="qs-bcr" aria-label="Back cover preview">
              <hr className="qs-bcr__rule" />
              <p className="qs-bcr__text">{variants[takeIdx]}</p>
              <hr className="qs-bcr__rule" />
              <div className="qs-bcr__code" aria-hidden="true">
                <span className="qs-bcr__bars"></span>
                <span className="qs-bcr__isbn">ISBN 978-1-83904-627-1</span>
              </div>
            </div>
            <div className="qs-bcr-actions">
              <window.CopyButton text={variants[takeIdx]} label="Copy back-cover copy" />
              <button type="button" className="qs-copy" onClick={keepThis} disabled={justKept}>
                <QSIcoBlurb name={justKept ? 'check' : 'feather'} size={13} />{justKept ? 'Kept on your shelf' : 'Keep this blurb'}
              </button>
            </div>
          </section>

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

          {result.query_paragraph ? (
            <RCard label="Query paragraph" copyText={result.query_paragraph}>
              <p className="qs-store">{result.query_paragraph}</p>
            </RCard>
          ) : null}

          <RCard label="Store description" copyText={result.short_description}>
            <p className="qs-store">{result.short_description}</p>
          </RCard>

          {comps.length ? (
            <RCard label="Comp titles" copyText={comps.join('\n')}>
              <div className="qs-comps">
                {comps.map((c, i) => (
                  <input key={i} className="qs-compinput" value={c} aria-label={`Comp title ${i + 1}`}
                    onChange={(e) => setComps((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))} />
                ))}
              </div>
              <p className="qs-quiethint" style={{ marginTop: 'var(--space-3)' }}>Suggestions to edit — you know your shelf best.</p>
            </RCard>
          ) : null}

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
        <div className="qs-markwrap">
          {!text && !file ? <span className="qs-markwrap__ico" aria-hidden="true"><QSIcoBlurb name="feather" size={120} /></span> : null}
          <ScriptTextarea
            value={text}
            onChange={setText}
            placeholder="Paste your story here…"
            minHeight={220}
            ariaLabel="Your story"
          />
        </div>
        <div className="qs-or"><span>or</span></div>

        <input ref={fileRef} type="file" accept=".docx,.rtf,.txt" onChange={onPick} style={QS_HIDDEN_INPUT} tabIndex={-1} />
        {file ? (
          <div className="qs-file qs-drop--filled">
            <span className="qs-file__name"><QSIcoBlurb name="file-text" size={18} className="qs-file__ico" />{file.name}</span>
            <button type="button" className="qs-payoff__again" onClick={clearFile}>Remove</button>
          </div>
        ) : (
          <button type="button" className="qs-drop" onClick={() => fileRef.current && fileRef.current.click()}>
            <span className="qs-drop__ico"><QSIcoBlurb name="file-text" size={28} /></span>
            <p className="qs-drop__line">Bring me your story.</p>
            <p className="qs-drop__hint">Word, RTF, or text</p>
          </button>
        )}
        {file ? <p className="qs-quiethint" style={{ marginTop: 'var(--space-3)' }}>Using your file. I’ll read a representative sample of it.</p> : null}
        {!file && text ? (
          <div className="qs-meter">
            <span><strong>{words.toLocaleString()}</strong> words</span>
            <span aria-hidden="true">·</span>
            <span>≈ <strong>{Math.max(1, Math.round(words / 230))}</strong> min read</span>
            <span aria-hidden="true">·</span>
            <span>draft kept</span>
          </div>
        ) : null}
        {gmap ? <GroundRow map={gmap} use={useMap} onChange={setUseMap} /> : null}
        {error ? <p className="qs-note"><QSIcoBlurb name="circle-alert" size={16} />{error}</p> : null}
      </div>

      <div className="qs-step">
        <p className="qs-steplabel">How should it sound? <Tooltip text="Warm: friendly and personal. Literary: elevated, evocative prose. Punchy: short lines, fast hooks. Mysterious: intriguing, holds a little back." /></p>
        <div className="qs-tonecards">
          {QS_TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`qs-tonecard${tone === t.id ? ' qs-tonecard--on' : ''}`}
              onClick={() => setTone(t.id)}
              aria-pressed={tone === t.id}
            >
              <span className="qs-tonecard__label">{t.label}</span>
              <p className="qs-tonecard__eg">{t.eg}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="qs-step">
        <p className="qs-steplabel">How much of it?</p>
        <div className="qs-pills" role="radiogroup" aria-label="Blurb length">
          {QS_LENGTHS.map((l) => (
            <button key={l.id} type="button" role="radio" aria-checked={length === l.id}
              className={`qs-pill${length === l.id ? ' qs-pill--on' : ''}`}
              onClick={() => setLength(l.id)}>{l.label}</button>
          ))}
        </div>
      </div>

      {kept.length ? (
        <div className="qs-step">
          <p className="qs-steplabel">Kept blurbs</p>
          <div className="qs-kept">
            {kept.map((k) => (
              <div className="qs-keptrow" key={k.id}>
                <p className="qs-keptrow__line">{k.back_cover}</p>
                <span className="qs-keptrow__meta">{k.tone} · {new Date(k.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <button type="button" className="qs-payoff__again" onClick={() => {
                  setResult({ back_cover: k.back_cover, back_cover_variants: [k.back_cover], taglines: k.taglines || [], keywords: k.keywords || [], short_description: k.short_description, query_paragraph: k.query_paragraph, comps: k.comps || [] });
                  setComps(k.comps || []); setTone(k.tone); setTake(0); setJustKept(false); setGroundedBy(null); setPhase('done');
                }}>Open</button>
                <button type="button" className="qs-payoff__again" aria-label="Remove kept blurb" onClick={() => {
                  const next = kept.filter((x) => x.id !== k.id);
                  setKept(next); saveKeptBlurbs(next);
                }}>
                  <QSIcoBlurb name="x" size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="qs-actionrow">
        <QSBtnBlurb size="lg" icon="sparkles" onClick={find}>Find my words</QSBtnBlurb>
      </div>
    </div>
  );
}

window.Blurb = Blurb;
