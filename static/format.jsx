/* Quiet Shelf — Format. The hero. compose -> becoming -> the book on the shelf.
   Wired to POST /api/format (multipart) and GET /api/format/themes.
   Cover suggestions: AI extracts themes → waterfall sources photos from
   Unsplash/Pexels/Pixabay → writer picks one or uploads their own. */
const QSDS_fmt = window.QuietFightClubDesignSystem_fae847;
const { Button: QSButton, Icon: QSIcon } = QSDS_fmt;

const QS_ALLOWED = ['docx', 'rtf', 'txt'];

const QS_HIDDEN_INPUT = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
  border: 0, opacity: 0,
};

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
    sample: 'And the little boat went out, and out, and out \u2014 until the harbour was just a freckle of gold.',
  },
};

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

const QS_COVER_PALETTE = {
  classic: { bg: '#f4f0e8', ink: '#28221c' },
  cozy: { bg: '#f7f1ee', ink: '#3c2e2e' },
  modern: { bg: '#fafafa', ink: '#18181c' },
  children: { bg: '#fff8e6', ink: '#2c3e50' },
};

/* Photo suggestion card — atmospheric thumbnail the writer can pick */
function PhotoCard({ photo, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(selected ? null : photo)}
      aria-pressed={selected}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '2/3',
        borderRadius: 'var(--radius-xs)',
        overflow: 'hidden',
        border: selected ? '2px solid var(--ember-400)' : '2px solid transparent',
        cursor: 'pointer',
        background: 'var(--surface-raised)',
        transition: 'border-color 0.15s',
        padding: 0,
      }}
    >
      <img
        src={photo.thumb_url}
        alt={photo.search_term}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {selected && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(197,137,59,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <QSIcon name="circle-check" size={32} style={{ color: 'var(--ember-400)' }} />
        </div>
      )}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
        padding: '8px 6px 4px',
      }}>
        <p style={{
          margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.7)',
          fontFamily: 'var(--font-body)', lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {photo.photographer} · {photo.source}
        </p>
      </div>
    </button>
  );
}

function Format() {
  const { Shelf, FinishedBook, Becoming, StepLabel, Tooltip } = window;

  const [phase, setPhase] = React.useState('compose');
  const [storyFile, setStoryFile] = React.useState(null);
  const [coverFile, setCoverFile] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const [theme, setTheme] = React.useState('classic');
  const [error, setError] = React.useState('');
  const [themes, setThemes] = React.useState(QS_THEME_FALLBACK);
  const [result, setResult] = React.useState(null);
  const [suggestions, setSuggestions] = React.useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = React.useState(false);
  const [chosenPhoto, setChosenPhoto] = React.useState(null);

  const fileRef = React.useRef(null);
  const coverRef = React.useRef(null);

  const [coverPreviewUrl, setCoverPreviewUrl] = React.useState(null);
  React.useEffect(() => {
    if (!coverFile) { setCoverPreviewUrl(null); return undefined; }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  // Also generate a preview URL for the chosen stock photo
  const [photoPreviewUrl, setPhotoPreviewUrl] = React.useState(null);
  React.useEffect(() => {
    setPhotoPreviewUrl(chosenPhoto ? chosenPhoto.thumb_url : null);
  }, [chosenPhoto]);

  React.useEffect(() => {
    let alive = true;
    window.QS_API.fetchThemes()
      .then((list) => {
        if (!alive || !list.length) return;
        setThemes(list.map((t) => ({ id: t.id, name: t.display_name, note: t.description })));
      })
      .catch(() => {});
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
    setSuggestions([]);
    setChosenPhoto(null);
    if (!title) setTitle(stemFromFileName(file.name));
  }

  function onPickStory(e) {
    const f = e.target.files && e.target.files[0];
    if (f) acceptStory(f);
  }
  function onPickCover(e) {
    const f = e.target.files && e.target.files[0];
    if (f) { setCoverFile(f); setChosenPhoto(null); }
  }

  async function loadSuggestions() {
    if (!storyFile || suggestionsLoading) return;
    setSuggestionsLoading(true);
    setSuggestions([]);
    setChosenPhoto(null);
    try {
      const text = await storyFile.text().catch(() => '');
      const passage = text.split(/\s+/).slice(0, 600).join(' ');
      const data = await window.QS_API.getCoverSuggestions({
        title: title || storyFile.name,
        passage,
        n: 3,
      });
      setSuggestions(data.suggestions || []);
    } catch (e) {
      // Suggestions are optional \u2014 silently fail, writer can still upload their own
    } finally {
      setSuggestionsLoading(false);
    }
  }

  async function begin() {
    if (!storyFile) { setError('Bring me your story first \u2014 then we\u2019ll begin.'); return; }
    setError('');
    setResult(null);
    setPhase('becoming');
    try {
      // Priority: uploaded cover file > chosen stock photo > typographic generated cover
      let coverToSend = coverFile;
      if (!coverToSend && chosenPhoto) {
        const blob = await window.QS_API.fetchCoverImage(chosenPhoto.url);
        coverToSend = new File([blob], 'cover.jpg', { type: blob.type || 'image/jpeg' });
      }
      const [out] = await Promise.all([
        window.QS_API.formatBook({
          file: storyFile,
          title: title || stemFromFileName(storyFile.name),
          author: author || 'Unknown Author',
          theme: theme,
          cover: coverToSend,
        }),
        window.QS_API.calmDelay(1600),
      ]);
      setResult(out);
      setPhase('done');
    } catch (err) {
      const msg = (err && typeof err.message === 'string') ? err.message : 'Something went wrong. Try again.';
      setError(msg);
      setPhase('compose');
    }
  }

  function reset() {
    setPhase('compose');
    setStoryFile(null); setCoverFile(null); setChosenPhoto(null);
    setTitle(''); setAuthor(''); setTheme('classic'); setError('');
    setResult(null); setSuggestions([]);
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
            'Reading your story\u2026',
            'Setting your words\u2026',
            'Binding the pages\u2026',
            'Almost bound\u2026',
          ]}
          sub="This takes a moment. Stay a while."
          duration={4200}
          onDone={() => {}}
        />
      </div>
    );
  }

  if (phase === 'done') {
    const displayCover = coverPreviewUrl || photoPreviewUrl;
    const bookTitle = title || 'Your book';
    const bookAuthor = author || '';
    return (
      <div className="qs-page qs-page--narrow qs-payoff">

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
            color: 'var(--ember-400)',
            margin: '0 0 var(--space-3)',
            lineHeight: 1.2,
          }}>
            It's your book now.
          </p>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            color: 'var(--text-body)',
            margin: '0 0 var(--space-2)',
          }}>
            {bookTitle}
          </p>
          {bookAuthor ? (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--fs-small)',
              color: 'var(--text-faint)',
              margin: '0 0 var(--space-4)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              by {bookAuthor}
            </p>
          ) : null}
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--fs-body)',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            margin: 0,
          }}>
            Enjoy.
          </p>
        </div>

        <div className="qs-shelfwrap qs-shelfwrap--lg" style={{ marginBottom: 'var(--space-8)' }}>
          <Shelf lit={true}>
            <FinishedBook
              title={bookTitle}
              author={bookAuthor}
              coverUrl={displayCover}
              bg={(QS_COVER_PALETTE[theme] || QS_COVER_PALETTE.classic).bg}
              ink={(QS_COVER_PALETTE[theme] || QS_COVER_PALETTE.classic).ink}
            />
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
  const hasCover = !!(coverFile || chosenPhoto);

  return (
    <div className="qs-page qs-page--narrow">
      <p className="qs-lead">Turn your manuscript into a beautiful book. One calm step at a time.</p>

      {/* 1 \u2014 Bring your story */}
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
        {error ? <p className="qs-note"><QSIcon name="circle-alert" size={16} /><span>{String(error)}</span></p> : null}
      </div>

      {/* 2 \u2014 Title & author */}
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

      {/* 3 \u2014 Choose a feeling */}
      <div className="qs-step">
        <StepLabel n="3">Choose a feeling</StepLabel>
        <div className="qs-themes">
          {themes.map((t) => (
            <ThemeCard key={t.id} theme={t} selected={theme === t.id} onSelect={setTheme} />
          ))}
        </div>
      </div>

      {/* 4 \u2014 Cover mood (AI suggestions) */}
      {storyFile && (
        <div className="qs-step">
          <StepLabel n="4">
            Cover mood
            {' '}
            <Tooltip text="I'll read your story and suggest atmospheric photos for the cover. Pick one, upload your own, or skip — I'll generate a clean typographic cover either way." />
          </StepLabel>

          {suggestions.length === 0 && !suggestionsLoading && (
            <button
              type="button"
              className="qs-drop"
              style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}
              onClick={loadSuggestions}
            >
              <span className="qs-drop__ico"><QSIcon name="sparkles" size={22} /></span>
              <p className="qs-drop__line" style={{ fontSize: 'var(--fs-script)' }}>Suggest covers from your story</p>
              <p className="qs-drop__hint">I'll read your opening and find 3 atmospheric photos</p>
            </button>
          )}

          {suggestionsLoading && (
            <p className="qs-quiethint" style={{ marginBottom: 'var(--space-4)', fontStyle: 'italic' }}>
              Reading your story and finding photos\u2026
            </p>
          )}

          {suggestions.length > 0 && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-3)',
              }}>
                {suggestions.map((photo, i) => (
                  <PhotoCard
                    key={i}
                    photo={photo}
                    selected={chosenPhoto && chosenPhoto.url === photo.url}
                    onSelect={setChosenPhoto}
                  />
                ))}
              </div>
              <button
                type="button"
                className="qs-payoff__again"
                onClick={loadSuggestions}
                disabled={suggestionsLoading}
                style={{ marginBottom: 'var(--space-4)' }}
              >
                <QSIcon name="refresh-cw" size={13} />
                {suggestionsLoading ? 'Finding more...' : 'Try different photos'}
              </button>
            </>
          )}

          {chosenPhoto && (
            <p className="qs-quiethint" style={{ marginBottom: 'var(--space-3)' }}>
              Photo by {chosenPhoto.photographer} via {chosenPhoto.source}.
              {' '}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--ember-400)', cursor: 'pointer', padding: 0, font: 'inherit' }}
                onClick={() => setChosenPhoto(null)}
              >
                Clear
              </button>
            </p>
          )}

          {/* Upload your own cover */}
          <input ref={coverRef} type="file" accept="image/*" onChange={onPickCover} style={QS_HIDDEN_INPUT} tabIndex={-1} />
          {coverName ? (
            <div className="qs-file qs-drop--filled">
              <span className="qs-file__name"><QSIcon name="file-text" size={18} className="qs-file__ico" />{coverName}</span>
              <button type="button" className="qs-payoff__again" onClick={() => coverRef.current && coverRef.current.click()}>Change</button>
            </div>
          ) : (
            <button
              type="button"
              className="qs-drop"
              style={{ padding: 'var(--space-6) var(--space-6)' }}
              onClick={() => coverRef.current && coverRef.current.click()}
            >
              <p className="qs-drop__line" style={{ fontSize: 'var(--fs-script)' }}>
                {hasCover ? 'Or upload your own cover' : 'Have a cover? Upload it.'}
              </p>
              <p className="qs-drop__hint" style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                {hasCover ? 'Replaces the selected photo' : 'If not, I\u2019ll make a simple one.'}
              </p>
            </button>
          )}
        </div>
      )}

      {/* 5 \u2014 Begin */}
      <div className="qs-actionrow">
        <QSButton size="lg" disabled={!storyFile} onClick={begin}>Begin</QSButton>
        <span className="qs-quiethint">When you're ready. No rush.</span>
      </div>
    </div>
  );
}

window.Format = Format;
