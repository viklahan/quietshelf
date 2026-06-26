/* Quiet Shelf — Format. The hero. compose → becoming → the book on the shelf. */
const QSDS_fmt = window.QuietFightClubDesignSystem_fae847;
const { Button: QSButton, Icon: QSIcon } = QSDS_fmt;

const QS_ALLOWED = ['doc', 'docx', 'rtf', 'txt'];

function slugify(s) {
  return (s || 'your-book').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'your-book';
}

function ThemeCard({ theme, selected, onSelect }) {
  const faceClass = 'qs-face-' + theme.face;
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
          {theme.face === 'modern' ? <span className="qs-face-chapter">Chapter One</span> : null}
          {theme.sample}
        </p>
      </div>
      <span className="qs-theme__name">{theme.name}</span>
      <p className="qs-theme__note">{theme.note}</p>
    </button>
  );
}

function Format() {
  const { Shelf, FinishedBook, Becoming, StepLabel } = window;
  const data = window.QS_DATA;

  const [phase, setPhase] = React.useState('compose'); // compose | becoming | done
  const [fileName, setFileName] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const [theme, setTheme] = React.useState('classic');
  const [coverName, setCoverName] = React.useState('');
  const [error, setError] = React.useState('');

  const fileRef = React.useRef(null);
  const coverRef = React.useRef(null);

  function acceptStory(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (!QS_ALLOWED.includes(ext)) {
      setError('I can only read Word, RTF, or text files for now. Try one of those?');
      return;
    }
    setError('');
    setFileName(name);
    if (!title) setTitle(data.book.title);
    if (!author) setAuthor(data.book.author);
  }

  function onPickStory(e) {
    const f = e.target.files && e.target.files[0];
    if (f) acceptStory(f.name);
  }
  function onPickCover(e) {
    const f = e.target.files && e.target.files[0];
    if (f) setCoverName(f.name);
  }

  function begin() {
    if (!fileName) { setError('Bring me your story first — then we’ll begin.'); return; }
    setError('');
    setPhase('becoming');
  }
  function reset() {
    setPhase('compose');
    setFileName(''); setTitle(''); setAuthor(''); setCoverName(''); setTheme('classic'); setError('');
  }

  function download() {
    const name = slugify(title || data.book.title) + '.epub';
    const blob = new Blob(
      [`Quiet Shelf — ${title || data.book.title} by ${author || data.book.author}.\n(Demo file.)`],
      { type: 'application/epub+zip' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (phase === 'becoming') {
    return (
      <div className="qs-page qs-page--narrow">
        <Becoming
          lines={['Reading your story…', 'Setting your words…', 'Binding the pages…']}
          sub="This takes a moment. Stay a while."
          onDone={() => setPhase('done')}
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
            <FinishedBook title={title || data.book.title} author={author || data.book.author} />
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

  return (
    <div className="qs-page qs-page--narrow">
      <p className="qs-lead">Turn your manuscript into a beautiful book. One calm step at a time.</p>

      {/* 1 — Bring your story */}
      <div className="qs-step">
        <StepLabel n="1">Bring your story</StepLabel>
        <input
          ref={fileRef} type="file" accept=".doc,.docx,.rtf,.txt"
          onChange={onPickStory} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1}
        />
        {fileName ? (
          <div className="qs-file qs-drop--filled">
            <span className="qs-file__name">
              <QSIcon name="file-text" size={18} className="qs-file__ico" />
              {fileName}
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
          {data.themes.map((t) => (
            <ThemeCard key={t.id} theme={t} selected={theme === t.id} onSelect={setTheme} />
          ))}
        </div>
      </div>

      {/* 4 — Cover (optional) */}
      <div className="qs-step">
        <StepLabel n="4">Cover <span style={{ color: 'var(--text-faint)', textTransform: 'none', letterSpacing: 0 }}>— optional</span></StepLabel>
        <input ref={coverRef} type="file" accept="image/*" onChange={onPickCover} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
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
        <QSButton size="lg" disabled={!fileName} onClick={begin}>Begin</QSButton>
        <span className="qs-quiethint">When you’re ready. No rush.</span>
      </div>
    </div>
  );
}

window.Format = Format;
