/* Quiet Shelf — Format. The hero. compose -> becoming -> the book on the shelf.
   Wired to POST /api/format (multipart) and GET /api/format/themes. */
const QSDS_fmt = window.QuietFightClubDesignSystem_fae847;
const { Button: QSButton, Icon: QSIcon } = QSDS_fmt;

const QS_ALLOWED = ['docx', 'rtf', 'txt'];

/* Keep file inputs in the render tree (not display:none) so a programmatic
   .click() reliably opens the OS picker in every browser — display:none
   inputs silently fail to open in Firefox/Safari. */
const QS_HIDDEN_INPUT = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
  border: 0, opacity: 0,
};

/* Typeset previews are presentation-only: they show how each theme *feels*.
   Real display names + descriptions come from the backend; we key the sample
   text and CSS face by the theme id the API returns. */
const QS_THEME_PREVIEWS = {
  classic: {
    face: 'classic',
    sample: 'It was the hour the lamp was lit, and the sea, for once, held its breath against the rocks below.',
  },
  cozy: {
    face: 'cozy',
    sample: 'She kept the kettle on past midnight, the way her mother had, listening for the gull that never came.',
  },
  modern: {
    face: 'modern',
    sample: 'The map said nothing of the island. He folded it anyway and set it beside the window.',
  },
  children: {
    face: 'children',
    sample: 'And the little boat went out, and out, and out — until the harbour was just a freckle of gold.',
  },
};

/* If the themes call ever fails, the screen still works with these. */
const QS_THEME_FALLBACK = [
  { id: 'classic', name: 'Classic Literary', note: 'Old-style serif, a drop cap, justified pages.' },
  { id: 'cozy', name: 'Cozy', note: 'Warm, roomy leading. A fireside read.' },
  { id: 'modern', name: 'Modern Clean', note: 'Tight, quiet, plenty of air.' },
  { id: 'children', name: "Children's", note: 'Big, gentle, generously spaced.' },
];

function slugify(s) {
  return (s || 'your-book').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'your-book';
}

function stemFromFileName(name) {
  const base = (name || '').replace(/\.[^.]+$/, '');
  return base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function ThemeCard({ theme, selected, onSelect }) {
  const preview = QS_THEME_PREVIEWS[theme.id] || QS_THEME_PREVIEWS.classic;
  const faceClass = 'qs-face-' + preview.face;
  return (
    <button
      type="button"
      className={`qs-theme${selected ? ' qs-theme--on' : ''}`}
      onClick={() => onSelect(theme.id)}
      aria-pressed={selected}
    >
      <span className="qs-theme__check" aria-hidden="true"><QSIcon name="circle-check" size={18} /></span>
      <div className="qs-theme__paper">
        <p className={`qs-theme__sample ${faceClass}`}>
          {preview.face === 'modern' ? <span className="qs-face-chapter">Chapter One</span> : null}
          {preview.sample}
        </p>
      </div>
      <span className="qs-theme__name">{theme.name}</span>
      <p className="qs-theme__note">{theme.note}</p>
    </button>
  );
}

function Format() {
  const { Shelf, FinishedBook, Becoming, StepLabel } = window;

  const [phase, setPhase] = React.useState('compose'); // compose | becoming | done
  const [storyFile, setStoryFile] = React.useState(null);
  const [coverFile, setCoverFile] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const [theme, setTheme] = React.useState('classic');
  const [error, setError] = React.useState('');
  const [themes, setThemes] = React.useState(QS_THEME_FALLBACK);
  const [result, setResult] = React.useState(null); // { blob, filename }

  const fileRef = React.useRef(null);
  const coverRef = React.useRef(null);

  React.useEffect(() => {
    let alive = true;
    window.QS_API.fetchThemes()
      .then((list) => {
        if (!alive || !list.length) return;
        setThemes(list.map((t) => ({ id: t.id, name: t.display_name, note: t.description })));
      })
      .catch(() => { /* keep the fallback themes */ });
    return () => { alive = false; };
  }, []);

  function acceptStory(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!QS_ALLOWED.includes(ext)) {
      setError('I can only read Word (.docx), RTF, or text files for now. Try one of those?');
      return;
    }
    setError('');
    setStoryFile(file);
    if (!title) setTitle(stemFromFileName(file.name));
  }

  function onPickStory(e) {
    const f = e.target.files && e.target.files[0];
    if (f) acceptStory(f);
  }
  function onPickCover(e) {
    const f = e.target.files && e.target.files[0];
    if (f) setCoverFile(f);
  }

  async function begin() {
    if (!storyFile) { setError('Bring me your story first — then we’ll begin.'); return; }
    setError('');
    setResult(null);
    setPhase('becoming');
    try {
      const [out] = await Promise.all([
        window.QS_API.formatBook({
          file: storyFile,
          title: title || stemFromFileName(storyFile.name),
          author: author,
          theme: theme,
          cover: coverFile,
        }),
        window.QS_API.calmDelay(1600),
      ]);
      setResult(out);
      setPhase('done');
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setPhase('compose');
    }
  }

  function reset() {
    setPhase('compose');
    setStoryFile(null); setCoverFile(null);
    setTitle(''); setAuthor(''); setTheme('classic'); setError(''); setResult(null);
  }

  function download() {
    if (!result) return;
    const name = result.filename || (slugify(title) + '.epub');
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (phase === 'becoming') {
    return (
      <div className="qs-page qs-page--narrow">
        <Becoming
          lines={[
            'Reading your story…',
            'Setting your words…',
            'Binding the pages…',
            'Almost bound…',
          ]}
          sub="This takes a moment. Stay a while."
          duration={4200}
          onDone={() => {}}
        />
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="qs-page qs-page--narrow qs-payoff">
        <p className="qs-payoff__title">It’s a book now.</p>
        <p className="qs-payoff__sub">Your story, on the shelf — real.</p>
        <div className="qs-shelfwrap qs-shelfwrap--lg">
          <Shelf lit={true}>
            <FinishedBook title={title || 'Your book'} author={author || ' '} />
          </Shelf>
        </div>
        <div className="qs-payoff__action">
          <QSButton size="lg" icon="book-open" onClick={download}>Download your ebook</QSButton>
          <button type="button" className="qs-payoff__again" onClick={reset}>
            <QSIcon name="rotate-ccw" size={13} />Format another
          </button>
        </div>
      </div>
    );
  }

  const storyName = storyFile ? storyFile.name : '';
  const coverName = coverFile ? coverFile.name : '';

  return (
    <div className="qs-page qs-page--narrow">
      <p className="qs-lead">Turn your manuscript into a beautiful book. One calm step at a time.</p>

      {/* 1 — Bring your story */}
      <div className="qs-step">
        <StepLabel n="1">Bring your story</StepLabel>
        <input
          ref={fileRef} type="file" accept=".docx,.rtf,.txt"
          onChange={onPickStory} style={QS_HIDDEN_INPUT} tabIndex={-1}
        />
        {storyName ? (
          <div className="qs-file qs-drop--filled">
            <span className="qs-file__name">
              <QSIcon name="file-text" size={18} className="qs-file__ico" />
              {storyName}
            </span>
            <button type="button" className="qs-payoff__again" onClick={() => fileRef.current && fileRef.current.click()}>
              Change
            </button>
          </div>
        ) : (
          <button type="button" className="qs-drop" onClick={() => fileRef.current && fileRef.current.click()}>
            <span className="qs-drop__ico"><QSIcon name="book-open" size={28} /></span>
            <p className="qs-drop__line">Bring me your story.</p>
            <p className="qs-drop__hint">Word, RTF, or text</p>
          </button>
        )}
        {error ? <p className="qs-note"><QSIcon name="circle-alert" size={16} />{error}</p> : null}
      </div>

      {/* 2 — Title & author */}
      <div className="qs-step">
        <StepLabel n="2">Title &amp; author</StepLabel>
        <div className="qs-fields qs-fields--two">
          <div className="qs-field">
            <label className="qs-field__label" htmlFor="qs-title">Title</label>
            <input id="qs-title" className="qs-input" value={title}
              onChange={(e) => setTitle(e.target.value)} placeholder="The name on the cover" />
          </div>
          <div className="qs-field">
            <label className="qs-field__label" htmlFor="qs-author">Author</label>
            <input id="qs-author" className="qs-input" value={author}
              onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" />
          </div>
        </div>
      </div>

      {/* 3 — Choose a feeling */}
      <div className="qs-step">
        <StepLabel n="3">Choose a feeling</StepLabel>
        <div className="qs-themes">
          {themes.map((t) => (
            <ThemeCard key={t.id} theme={t} selected={theme === t.id} onSelect={setTheme} />
          ))}
        </div>
      </div>

      {/* 4 — Cover (optional) */}
      <div className="qs-step">
        <StepLabel n="4">Cover <span style={{ color: 'var(--text-faint)', textTransform: 'none', letterSpacing: 0 }}>— optional</span></StepLabel>
        <input ref={coverRef} type="file" accept="image/*" onChange={onPickCover} style={QS_HIDDEN_INPUT} tabIndex={-1} />
        {coverName ? (
          <div className="qs-file qs-drop--filled">
            <span className="qs-file__name"><QSIcon name="file-text" size={18} className="qs-file__ico" />{coverName}</span>
            <button type="button" className="qs-payoff__again" onClick={() => coverRef.current && coverRef.current.click()}>Change</button>
          </div>
        ) : (
          <button type="button" className="qs-drop" style={{ padding: 'var(--space-8) var(--space-6)' }} onClick={() => coverRef.current && coverRef.current.click()}>
            <p className="qs-drop__line" style={{ fontSize: 'var(--fs-script)' }}>Have a cover? Add it.</p>
            <p className="qs-drop__hint" style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>If not, I’ll make a simple one.</p>
          </button>
        )}
      </div>

      {/* 5 — Begin */}
      <div className="qs-actionrow">
        <QSButton size="lg" disabled={!storyFile} onClick={begin}>Begin</QSButton>
        <span className="qs-quiethint">When you’re ready. No rush.</span>
      </div>
    </div>
  );
}

window.Format = Format;
