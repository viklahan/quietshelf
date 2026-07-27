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

/* ── The payoff: one book on the shelf. Click it, it opens. ─────────
   PayoffBook: the closed book (3D, hinged cover, hover cracks it open).
   OpenBook: the book open on the desk — real EPUB pages via epub.js,
   or a graceful typeset "peek" spread when the epub can't render.
   BookExperience: the state machine (closed → opening → open → closing).
   Self-contained: all styles live in QS_PAYOFF_CSS, injected once. */

const QS_PAYOFF_CSS = `
.qs-pay-announce{font-family:var(--font-display);font-style:italic;font-size:clamp(1.7rem,4vw,2.3rem);color:var(--ember-400);margin:0 0 6px;line-height:1.2;text-align:center;animation:qs-pay-fade 700ms var(--ease-quiet) both}
.qs-pay-sub{font-family:var(--font-body);font-style:italic;font-size:.95rem;color:var(--text-faint);text-align:center;margin:0 0 var(--space-8);animation:qs-pay-fade 700ms var(--ease-quiet) 250ms both}
.qs-pay-reveal{animation:qs-pay-fade 800ms var(--ease-quiet) 450ms both}
.qs-pay-back{animation:qs-pay-fade 400ms var(--ease-quiet) both}
.qs-pay-back .qs-pb{animation-delay:0ms}
.qs-pay-actions{animation:qs-pay-fade 700ms var(--ease-quiet) 1050ms both}
@keyframes qs-pay-fade{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:none}}
.qs-pay-hint{text-align:center;margin:var(--space-3) 0 0;font-family:var(--font-body);font-style:italic;font-size:var(--fs-small,0.9rem);color:var(--text-faint);animation:qs-pay-fade 600ms var(--ease-quiet) 1200ms both}
.qs-pb-stage{display:flex;align-items:flex-end;justify-content:center;min-height:330px;perspective:1500px;position:relative;z-index:2}
.qs-pb{position:relative;width:200px;height:292px;transform-style:preserve-3d;border:0;background:none;padding:0;cursor:pointer;transform:rotateX(4deg) rotateY(-22deg);transition:transform 600ms var(--ease-quiet);animation:qs-pb-settle 1100ms var(--ease-settle) 500ms backwards}
@keyframes qs-pb-settle{0%{opacity:0;transform:translateY(-46px) rotateX(4deg) rotateY(-22deg)}100%{opacity:1;transform:translateY(0) rotateX(4deg) rotateY(-22deg)}}
.qs-pb:hover,.qs-pb:focus-visible{transform:rotateX(2deg) rotateY(-14deg) translateY(-4px);outline:none}
.qs-pb--opening,.qs-pb--opening:hover{transform:rotateX(0deg) rotateY(-4deg) translateY(-2px) scale(1.03)}
.qs-pb__cover{position:absolute;inset:0;transform-origin:left center;transform-style:preserve-3d;transition:transform 680ms cubic-bezier(.3,.05,.2,1);display:block}
.qs-pb:hover .qs-pb__cover,.qs-pb:focus-visible .qs-pb__cover{transform:rotateY(-28deg)}
.qs-pb--opening .qs-pb__cover,.qs-pb--opening:hover .qs-pb__cover{transform:rotateY(-160deg)}
.qs-pb__front{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:2px 5px 5px 2px;border:1px solid var(--edge-strong);box-shadow:var(--shadow-inset-paper),10px 16px 36px rgba(0,0,0,.42);overflow:hidden;display:flex;flex-direction:column;padding:24px 20px 20px;text-align:left}
.qs-pb__facefill{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:var(--shadow-inset-paper),10px 16px 36px rgba(0,0,0,.42)}
.qs-pb__front--img{background-size:cover;background-position:center;padding:18px 14px 14px}
.qs-pb__rule{display:block;width:32px;height:2px;margin-bottom:16px}
.qs-pb__title{display:block;font-family:var(--font-display);font-weight:var(--fw-display,500);font-size:1.3rem;line-height:1.16;margin:0;text-wrap:balance}
.qs-pb__author{display:block;margin-top:auto;font-family:var(--font-mono);font-size:.66rem;letter-spacing:var(--ls-meta,0.08em);text-transform:uppercase}
.qs-pb__ptitle{display:block;font-family:var(--font-display);font-size:1.15rem;line-height:1.18;color:#fff;text-shadow:0 1px 10px rgba(0,0,0,.75);text-align:center;margin:6px 0 auto;text-wrap:balance}
.qs-pb__pauthor{display:block;margin-top:auto;text-align:center;font-family:var(--font-mono);font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.92);text-shadow:0 1px 6px rgba(0,0,0,.8)}
.qs-pb__back{position:absolute;inset:0;transform:rotateY(180deg);backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:5px 2px 2px 5px;background:linear-gradient(105deg,#241d15,#1c1710);border:1px solid var(--edge-soft);display:block;opacity:0}
.qs-pb--opening .qs-pb__cover>span:first-child{opacity:0;transition:opacity 0ms 340ms}
.qs-pb--opening .qs-pb__back{opacity:1;transition:opacity 0ms 300ms}
.qs-pb__sheet{position:absolute;inset:3px 2px 3px 8px;background:linear-gradient(100deg,#efe8da,#e2d9c6);border-radius:2px 4px 4px 2px;display:flex;align-items:center;justify-content:center;padding:18px}
.qs-pb__sheet-t{font-family:var(--font-display);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:#6b6153;text-align:center;text-wrap:balance}
.qs-pb__spine{position:absolute;top:0;left:0;width:30px;height:100%;background:var(--ink-800);border-radius:2px 0 0 2px;transform-origin:left center;transform:rotateY(-90deg) translateX(-15px);border:1px solid var(--edge-soft);display:flex;align-items:center;justify-content:center}
.qs-pb__spine span{writing-mode:vertical-rl;transform:rotate(180deg);font-family:var(--font-display);font-size:.66rem;color:var(--text-faint);white-space:nowrap;letter-spacing:.04em;max-height:92%;overflow:hidden}
.qs-pb__pages{position:absolute;top:3px;bottom:3px;right:0;width:12px;transform-origin:right center;transform:rotateY(90deg) translateX(6px);background:repeating-linear-gradient(to right,var(--paper-600) 0 1px,var(--ink-700) 1px 2px);border-radius:0 2px 2px 0;display:block}
.qs-ob{margin:var(--space-6) auto 0;max-width:760px;animation:qs-ob-in 340ms var(--ease-quiet)}
@keyframes qs-ob-in{0%{opacity:0;transform:translateY(16px) scale(.955)}100%{opacity:1;transform:none}}
.qs-ob--closing{animation:qs-ob-out 260ms var(--ease-quiet) both}
@keyframes qs-ob-out{to{opacity:0;transform:translateY(14px) scale(.955)}}
.qs-ob__board{position:relative;background:linear-gradient(160deg,#2b2218,#1f1912 60%,#191410);border:1px solid var(--edge-strong);border-radius:10px;padding:12px 12px 16px;box-shadow:0 30px 60px -20px rgba(0,0,0,.7),0 0 0 1px rgba(0,0,0,.35)}
.qs-ob__pages{position:relative;height:470px;background:linear-gradient(180deg,#f6f1e6,#efe8d8);border-radius:4px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),inset 0 -12px 26px rgba(120,100,70,.16)}
.qs-ob__pages::before,.qs-ob__pages::after{content:"";position:absolute;top:0;bottom:0;width:9px;z-index:2;pointer-events:none}
.qs-ob__pages::before{left:0;background:repeating-linear-gradient(to right,rgba(120,100,70,.28) 0 1px,rgba(255,255,255,.5) 1px 3px)}
.qs-ob__pages::after{right:0;background:repeating-linear-gradient(to left,rgba(120,100,70,.28) 0 1px,rgba(255,255,255,.5) 1px 3px)}
.qs-ob__gutter{position:absolute;inset:0;pointer-events:none;z-index:2;background:linear-gradient(90deg,transparent 43%,rgba(60,45,25,.13) 49.5%,rgba(60,45,25,.22) 50%,rgba(60,45,25,.13) 50.5%,transparent 57%)}
.qs-ob__holder{position:absolute;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;transition:opacity 300ms var(--ease-quiet)}
.qs-ob__wait{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;gap:14px;align-items:center;justify-content:center;color:#8a7c62;font-family:var(--font-body);font-style:italic;font-size:.9rem}
.qs-ob__emberdot{width:9px;height:9px;border-radius:50%;background:var(--ember-500);box-shadow:0 0 18px 4px rgba(217,164,88,.45);animation:qs-ob-pulse 2600ms ease-in-out infinite}
@keyframes qs-ob-pulse{0%,100%{opacity:.55;transform:scale(.9)}50%{opacity:1;transform:scale(1.15)}}
.qs-ob__peek{position:absolute;inset:0;z-index:1;display:grid;grid-template-columns:1fr 1fr}
.qs-ob__pg{padding:46px 42px 34px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-width:0}
.qs-ob__pg--l h3{font-family:var(--font-display);font-weight:var(--fw-display,500);font-size:1.5rem;line-height:1.22;margin:16px 0 12px;color:#2c2519;text-wrap:balance}
.qs-ob__halfrule{display:block;width:34px;height:2px;background:#8a6f3f}
.qs-ob__by{font-family:var(--font-mono);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:#7a6c52}
.qs-ob__opening{font-family:var(--font-body);font-size:.95rem;line-height:1.78;color:#3a3226;margin:16px 0 0;max-width:36ch;text-align:left}
.qs-ob__opening::first-letter{font-family:var(--font-display);font-size:2.7em;float:left;line-height:.78;padding:5px 8px 0 0;color:#2c2519}
.qs-ob__note{font-family:var(--font-body);font-style:italic;font-size:.78rem;color:#8a7c62;margin:auto 0 0}
.qs-ob__turn{position:absolute;top:0;bottom:0;width:64px;border:0;background:none;cursor:pointer;z-index:4;color:transparent;font-family:var(--font-display);font-size:1.7rem;line-height:1;transition:color .2s var(--ease-quiet)}
.qs-ob__turn--l{left:0;border-radius:4px 0 0 4px}
.qs-ob__turn--r{right:0;border-radius:0 4px 4px 0}
.qs-ob__turn--l:hover{color:#5d4e35;background:linear-gradient(to right,rgba(120,95,55,.09),transparent)}
.qs-ob__turn--r:hover{color:#5d4e35;background:linear-gradient(to left,rgba(120,95,55,.09),transparent)}
.qs-ob__row{display:flex;align-items:center;justify-content:center;gap:var(--space-6);margin-top:var(--space-4)}
.qs-ob__row .qs-payoff__again{white-space:nowrap}
.qs-ob__pgnum{font-family:var(--font-mono);font-size:.66rem;letter-spacing:.1em;color:var(--text-faint);min-width:64px;text-align:center}
@media (max-width:720px){.qs-ob__pages{height:420px}.qs-ob__pg{padding:30px 22px 24px}}
@media (prefers-reduced-motion:reduce){.qs-pb,.qs-pb__cover,.qs-ob,.qs-pay-announce,.qs-pay-sub,.qs-pay-reveal,.qs-pay-back,.qs-pay-actions,.qs-pay-hint{animation:none!important;transition:none!important}}
`;

/* The finished book, closed, standing on the shelf. A real object: cover,
   spine, page block, and a half-title sheet you glimpse as the cover opens. */
function PayoffBook({ title, author, coverUrl, bg, ink, opening, onOpen, front }) {
  const themed = !!bg && !coverUrl;
  return (
    <div className="qs-pb-stage">
      <button
        type="button"
        className={`qs-pb${opening ? ' qs-pb--opening' : ''}`}
        onClick={onOpen}
        aria-label={`Open ${title} and look inside`}
        title="Look inside"
      >
        <span className="qs-pb__pages" aria-hidden="true"></span>
        <span className="qs-pb__spine" aria-hidden="true" style={themed ? { background: bg } : undefined}>
          <span style={themed ? { color: ink } : undefined}>{title}</span>
        </span>
        <span className="qs-pb__sheet" aria-hidden="true">
          <span className="qs-pb__sheet-t">{title}</span>
        </span>
        <span className="qs-pb__cover" aria-hidden="true">
          {front || (coverUrl ? (
            <span className="qs-pb__front qs-pb__front--img" style={{ backgroundImage: `url(${coverUrl})` }}>
              <span className="qs-pb__ptitle">{title}</span>
              {author ? <span className="qs-pb__pauthor">{author}</span> : null}
            </span>
          ) : (
            <span className="qs-pb__front" style={{ background: bg || 'var(--ink-700)' }}>
              <span className="qs-pb__rule" style={{ background: ink || 'var(--ember-500)' }}></span>
              <span className="qs-pb__title" style={{ color: ink || 'var(--text-body)' }}>{title}</span>
              {author ? <span className="qs-pb__author" style={{ color: ink || 'var(--text-muted)' }}>{author}</span> : null}
            </span>
          ))}
          <span className="qs-pb__back" aria-hidden="true"></span>
        </span>
      </button>
    </div>
  );
}

/* The book, open on the desk. Renders the actual EPUB (epub.js, two facing
   pages) when it can; otherwise a quiet typeset peek of the opening. */
function OpenBook({ blob, title, author, sample, closing, onClose }) {
  const PAGE_H = 470;
  const pagesRef = React.useRef(null);
  const holderRef = React.useRef(null);
  const bookRef = React.useRef(null);
  const rendRef = React.useRef(null);
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;
  const [mode, setMode] = React.useState('loading'); // loading | epub | peek
  const [pg, setPg] = React.useState(null);

  React.useEffect(() => {
    let dead = false;
    if (!blob || typeof ePub === 'undefined') { setMode('peek'); return undefined; }
    blob.arrayBuffer().then((buf) => {
      if (dead || !holderRef.current) return;
      const book = ePub(buf);
      bookRef.current = book;
      const w = Math.max(320, Math.floor((pagesRef.current ? pagesRef.current.clientWidth : 640) / 2) * 2);
      const rendition = book.renderTo(holderRef.current, {
        width: w, height: PAGE_H, flow: 'paginated', spread: 'always', minSpreadWidth: 0, gap: 56,
      });
      rendRef.current = rendition;
      rendition.on('relocated', (loc) => {
        if (dead) return;
        setMode('epub');
        try { setPg({ page: loc.start.displayed.page, total: loc.start.displayed.total }); } catch (e) {}
      });
      rendition.on('keydown', (e) => {
        if (e.key === 'ArrowRight') { try { rendition.next(); } catch (err) {} }
        else if (e.key === 'ArrowLeft') { try { rendition.prev(); } catch (err) {} }
        else if (e.key === 'Escape') onCloseRef.current();
      });
      book.ready.then(() => {
        const items = book.spine && book.spine.items;
        const startHref = items && items.length > 1 ? items[1].href : undefined;
        return rendition.display(startHref);
      }).catch(() => rendition.display());
    }).catch(() => { if (!dead) setMode('peek'); });
    return () => { dead = true; try { if (bookRef.current) bookRef.current.destroy(); } catch (e) {} };
  }, [blob]);

  // If the epub never settles, fall back to the peek rather than spin forever.
  React.useEffect(() => {
    if (mode !== 'loading') return undefined;
    const t = setTimeout(() => setMode((m) => (m === 'loading' ? 'peek' : m)), 6000);
    return () => clearTimeout(t);
  }, [mode]);

  const canTurn = mode === 'epub';
  function prev() { try { if (rendRef.current) rendRef.current.prev(); } catch (e) {} }
  function next() { try { if (rendRef.current) rendRef.current.next(); } catch (e) {} }

  React.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCloseRef.current();
      else if (e.key === 'ArrowLeft' && canTurn) prev();
      else if (e.key === 'ArrowRight' && canTurn) next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className={`qs-ob${closing ? ' qs-ob--closing' : ''}`}>
      <div className="qs-ob__board">
        <div className="qs-ob__pages" ref={pagesRef} role="region" aria-label={`Inside ${title}`}>
          {mode !== 'peek' && (
            <div ref={holderRef} className="qs-ob__holder" style={{ opacity: canTurn ? 1 : 0 }}></div>
          )}
          {mode === 'peek' && (
            <div className="qs-ob__peek">
              <div className="qs-ob__pg qs-ob__pg--l">
                <span className="qs-ob__halfrule" aria-hidden="true"></span>
                <h3>{title}</h3>
                {author ? <span className="qs-ob__by">by {author}</span> : null}
              </div>
              <div className="qs-ob__pg qs-ob__pg--r">
                {sample ? <p className="qs-ob__opening">{sample}</p> : null}
                <p className="qs-ob__note">Your words, exactly as you set them — the full book is in the download.</p>
              </div>
            </div>
          )}
          {mode === 'loading' && (
            <div className="qs-ob__wait">
              <span className="qs-ob__emberdot" aria-hidden="true"></span>
              <span>Opening your book…</span>
            </div>
          )}
          <div className="qs-ob__gutter" aria-hidden="true"></div>
          {canTurn && (
            <React.Fragment>
              <button type="button" className="qs-ob__turn qs-ob__turn--l" onClick={prev} aria-label="Previous page">‹</button>
              <button type="button" className="qs-ob__turn qs-ob__turn--r" onClick={next} aria-label="Next page">›</button>
            </React.Fragment>
          )}
        </div>
      </div>
      <div className="qs-ob__row">
        <span className="qs-ob__pgnum">{canTurn && pg ? `${pg.page} · ${pg.total}` : '\u00a0'}</span>
        <button type="button" className="qs-payoff__again" onClick={onClose}>Close the book</button>
      </div>
    </div>
  );
}

/* closed → opening (cover swings) → open (reading) → closing → closed */
function BookExperience({ blob, title, author, coverUrl, bg, ink, sample, front }) {
  const { Shelf } = window;
  const [stage, setStage] = React.useState('closed');
  const [returned, setReturned] = React.useState(false);
  const t = React.useRef(null);
  React.useEffect(() => () => clearTimeout(t.current), []);
  function open() {
    if (stage !== 'closed') return;
    setStage('opening');
    t.current = setTimeout(() => setStage('open'), 720);
  }
  function close() {
    if (stage !== 'open') return;
    setStage('closing');
    t.current = setTimeout(() => { setStage('closed'); setReturned(true); }, 280);
  }
  if (stage === 'open' || stage === 'closing') {
    return (
      <OpenBook blob={blob} title={title} author={author} sample={sample}
        closing={stage === 'closing'} onClose={close} />
    );
  }
  return (
    <div className={returned ? 'qs-pay-back' : 'qs-pay-reveal'}>
      <div className="qs-shelfwrap qs-shelfwrap--lg">
        <Shelf lit={true}>
          <PayoffBook title={title} author={author} coverUrl={coverUrl} bg={bg} ink={ink}
            opening={stage === 'opening'} onOpen={open} front={front} />
        </Shelf>
      </div>
      <p className="qs-pay-hint">Click the book to look inside.</p>
    </div>
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
    const pal = QS_COVER_PALETTE[theme] || QS_COVER_PALETTE.classic;
    const sample = (QS_THEME_PREVIEWS[theme] || QS_THEME_PREVIEWS.classic).sample;
    return (
      <div className="qs-page qs-page--narrow qs-payoff">
        <style>{QS_PAYOFF_CSS}</style>
        <p className="qs-pay-announce">It’s your book now.</p>
        <p className="qs-pay-sub">{bookTitle}{bookAuthor ? ` — by ${bookAuthor}` : ''}. Bound and ready.</p>
        <BookExperience
          blob={result && result.blob}
          title={bookTitle} author={bookAuthor}
          coverUrl={displayCover} bg={pal.bg} ink={pal.ink}
          sample={sample}
        />
        <div className="qs-payoff__action qs-pay-actions">
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-5) var(--space-6)',
              marginBottom: 'var(--space-4)',
              border: '1px solid var(--edge-soft)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-faint)',
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 'var(--fs-small)',
            }}>
              <QSIcon name="sparkles" size={15} style={{ color: 'var(--ember-400)', flexShrink: 0 }} />
              Reading your story and finding atmospheric photos…
            </div>
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
