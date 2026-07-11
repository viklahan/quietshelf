/* Quiet Shelf — Promote. Paste → word/runtime → calm map → segment cards.
   Wired to POST /api/promote (JSON {script}) -> ShotList. */
const QSDS_promo = window.QuietFightClubDesignSystem_fae847;
const { Button: QSBtnPromo, Icon: QSIcoPromo, ScriptTextarea: QSScriptTA, ManuscriptCard } = QSDS_promo;

const QS_MIN_WORDS = 100;
const QS_MAX_WORDS = 3000;

function countWords(s) {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}
function runtimeFromWords(w) {
  const secs = Math.round((w / 150) * 60); // ~150 narrated wpm
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* CONFIRMED against the live site (2026-07): the public pexels.com search
   page honors ?orientation=landscape|portrait|square as a real filter, not
   just its authenticated API — clicking the filter in-browser changes the
   URL to exactly this. A precise param beats a hopeful word in the query. */
function orientationParam(orientation) {
  if (orientation === 'horizontal') return '?orientation=landscape';
  if (orientation === 'vertical') return '?orientation=portrait';
  if (orientation === 'square') return '?orientation=square';
  return '';
}

/* Pull a few real, capitalized word-like tokens out of the writer's own
   pasted text for the live loading screen — cheap, no extra model call, and
   no accuracy claim (we don't check these are actually character names).
   Falls back gracefully (returns []) when the text has no obvious proper
   nouns, e.g. a piece with no named characters. */
function pickTextTokens(text, count = 4) {
  const seen = new Set();
  const picked = [];
  const common = new Set(['The', 'This', 'That', 'They', 'Then', 'There', 'When', 'What', 'With', 'Her', 'His', 'And', 'But', 'For', 'You', 'Your']);
  const re = /\b[A-Z][a-z]{2,}\b/g;
  let m;
  while ((m = re.exec(text)) && picked.length < count) {
    const w = m[0];
    if (common.has(w) || seen.has(w)) continue;
    seen.add(w);
    picked.push(w);
  }
  return picked;
}

/* moodTone tints the card; it's purely visual. We derive it from the mood
   word the backend returns so the colour matches the feeling. */
function moodToTone(mood) {
  const m = (mood || '').toLowerCase();
  if (/(hope|warm|joy|resolved|tender|love|calm|peace|gentle)/.test(m)) return 'ember';
  if (/(tense|dark|grief|fear|turning|danger|storm|anger|loss)/.test(m)) return 'oxblood';
  if (/(solemn|quiet|still|somber|reflect|grey|melanchol)/.test(m)) return 'paper';
  return 'neutral';
}

/* Map a backend Segment to the ManuscriptCard's props. */
function toCard(seg) {
  return {
    index: seg.id,
    startTime: seg.start_time,
    endTime: seg.end_time,
    excerpt: seg.script_text,
    mood: seg.mood,
    moodTone: moodToTone(seg.mood),
    clipDurationSeconds: seg.clip_duration_seconds,
    terms: seg.search_terms || [],
    cast: seg.cast || [],
  };
}

/* Found-clip memory — clip links keyed to the CHARACTER, not the segment,
   so the same person keeps the same footage across the whole video (and
   across sessions: castings travel inside the saved story map file). */
const QS_CASTINGS_KEY = 'qs.promote.castings';

function loadCastings() {
  try { return JSON.parse(localStorage.getItem(QS_CASTINGS_KEY)) || {}; } catch (e) { return {}; }
}
function saveCastings(c) {
  try { localStorage.setItem(QS_CASTINGS_KEY, JSON.stringify(c)); } catch (e) {}
}

/* The mapped result itself — a refresh must never cost the writer the API
   call that produced it. Kept separately from castings (which already
   survive refresh) since this is the shot list, not the clip links. */
const QS_LAST_RESULT_KEY = 'qs.promote.lastresult';

function loadLastResult() {
  try {
    const raw = localStorage.getItem(QS_LAST_RESULT_KEY);
    if (!raw) return null;
    const r = JSON.parse(raw);
    if (!r || !Array.isArray(r.segs) || !r.segs.length) return null;
    return r;
  } catch (e) { return null; }
}
function saveLastResult(r) {
  try {
    if (r) localStorage.setItem(QS_LAST_RESULT_KEY, JSON.stringify(r));
    else localStorage.removeItem(QS_LAST_RESULT_KEY);
  } catch (e) {}
}

function Promote() {
  const { Becoming, CopyButton, useKeptDraft, loadLastMap, GroundRow, Tooltip } = window;

  const [phase, setPhase] = React.useState(() => (loadLastResult() ? 'done' : 'compose'));
  const [text, setText] = useKeptDraft('qs.draft.promote');
  const [error, setError] = React.useState('');
  const [found, setFound] = React.useState(() => { const r = loadLastResult(); return r ? (r.found || {}) : {}; });
  const [segs, setSegs] = React.useState(() => { const r = loadLastResult(); return r ? r.segs : []; });
  // Footage orientation preference — affects only the "open in Pexels" quick
  // link (see orientationSuffix); the editable search-term chips are untouched.
  const [orientation, setOrientation] = React.useState('both');
  // The saved Story Map, if one exists. Found maps ground by default; an
  // imagined map is strictly opt-in — invention never flows in silently.
  const [gmap] = React.useState(loadLastMap);
  const [useMap, setUseMap] = React.useState(() => {
    const m = loadLastMap();
    return !!(m && !m.fabricated);
  });
  const [groundedBy, setGroundedBy] = React.useState(() => { const r = loadLastResult(); return r ? (r.groundedBy || null) : null; }); // {n, fabricated} of the run shown
  const [castings, setCastings] = React.useState(loadCastings);

  const words = countWords(text);

  /* Keep (or clear) the clip link for every character in a segment. */
  function keepClip(names, url) {
    const next = { ...castings };
    names.forEach((n) => {
      if (url) next[n] = { url };
      else delete next[n];
    });
    setCastings(next);
    saveCastings(next);
  }

  async function map() {
    if (words < QS_MIN_WORDS) {
      setError(`This looks like a fragment. Paste the full piece (at least ${QS_MIN_WORDS} words) for a proper visual map.`);
      return;
    }
    if (words > QS_MAX_WORDS) {
      setError(`That’s a long piece (${words.toLocaleString()} words). Split it into parts of ${QS_MAX_WORDS.toLocaleString()} words or fewer.`);
      return;
    }
    const grounding = useMap && gmap ? gmap : null;
    setError('');
    setFound({});
    setPhase('becoming');
    try {
      const [shotlist] = await Promise.all([
        window.QS_API.promote(text, grounding),
        window.QS_API.calmDelay(1600),
      ]);
      const mappedSegs = (shotlist.segments || []).map(toCard);
      const gb = grounding ? { n: grounding.characters.length, fabricated: !!grounding.fabricated } : null;
      setSegs(mappedSegs);
      setGroundedBy(gb);
      saveLastResult({ segs: mappedSegs, groundedBy: gb, found: {} });
      setPhase('done');
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setPhase('compose');
    }
  }

  function toggle(i, v) {
    setFound((p) => {
      const next = { ...p, [i]: v };
      saveLastResult({ segs, groundedBy, found: next });
      return next;
    });
  }

  /* Edit one search term in place. The card's search links read straight from
     these terms, so an edit re-points the stock-footage search immediately. */
  function editTerm(cardIdx, termIdx, value) {
    setSegs((prev) => {
      const next = prev.map((s, i) =>
        i === cardIdx
          ? { ...s, terms: s.terms.map((t, j) => (j === termIdx ? value : t)) }
          : s
      );
      saveLastResult({ segs: next, groundedBy, found });
      return next;
    });
  }
  const doneCount = segs.filter((s) => found[s.index]).length;

  function notionText() {
    return segs.map((s) =>
      `## ${String(s.index).padStart(2, '0')} · ${s.startTime}–${s.endTime} · ${s.mood}\n` +
      `${s.excerpt}\n` +
      `Clip ~${s.clipDurationSeconds}s\n` +
      `Search: ${s.terms.join(' / ')}\n`
    ).join('\n');
  }

  if (phase === 'becoming') {
    // Read the writer's OWN pasted text back to them while the real work runs
    // — proves the engine is actually reading their piece, not spinning a
    // generic spinner. Cheap client-side token pull, no extra model call.
    const tokens = pickTextTokens(text);
    const tokenTemplates = [
      (t) => `Finding a shot for ${t}…`,
      (t) => `Picturing a scene with ${t}…`,
      (t) => `Placing ${t} on the timeline…`,
    ];
    const tokenLines = tokens.map((t, i) => tokenTemplates[i % tokenTemplates.length](t));
    const lines = [
      'Reading your piece…',
      ...tokenLines,
      'Breaking it into scenes…',
      'Choosing search terms…',
      'Still working — free models can be slow…',
    ];
    return (
      <div className="qs-page">
        <Becoming
          lines={lines}
          sub="Mapping your footage."
          duration={3600}
          onDone={() => {}}
        />
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="qs-page">
        <p className="qs-lead">Your visuals, scene by scene. Open a search, find the clip, check it off.</p>

        <div className="qs-mapline">
          <QSIcoPromo name="list-checks" size={16} />
          <span className="qs-mapline__count">{String(doneCount).padStart(2, '0')} of {String(segs.length).padStart(2, '0')} mapped</span>
          <span style={{ flex: 1 }}></span>
          <CopyButton text={notionText()} label="Copy for Notion" />
        </div>
        {groundedBy ? (
          <p className="qs-quiethint" style={{ margin: '0 0 var(--space-6) 0' }}>
            Grounded by your story map · {groundedBy.n} {groundedBy.n === 1 ? 'character' : 'characters'}
            {groundedBy.fabricated ? ' · imagined cast, on your request' : ''}
          </p>
        ) : null}

        <div className="qs-board">
          {segs.map((s, idx) => (
            <div className="qs-deal" key={s.index} style={{ animationDelay: (idx * 60) + 'ms' }}>
              <ManuscriptCard
                index={s.index}
                startTime={s.startTime}
                endTime={s.endTime}
                excerpt={s.excerpt}
                mood={s.mood}
                moodTone={s.moodTone}
                clipDurationSeconds={s.clipDurationSeconds}
                terms={s.terms}
                onTermChange={(ti, v) => editTerm(idx, ti, v)}
                found={!!found[s.index]}
                onFoundChange={(v) => toggle(s.index, v)}
              />
              <div className="qs-casting">
                {s.terms.length ? (
                  <a
                    className="qs-casting__link"
                    href={`https://www.pexels.com/search/videos/${encodeURIComponent(s.terms[0])}/${orientationParam(orientation)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open best match in Pexels{orientation !== 'both' ? ` (${orientation})` : ''} ↗
                  </a>
                ) : null}
                {s.cast.filter((n) => castings[n] && castings[n].url).map((n) => (
                  <a key={n} className="qs-casting__link" href={castings[n].url} target="_blank" rel="noreferrer">
                    You used this clip for {n} ↗
                  </a>
                ))}
                {found[s.index] && s.cast.length ? (
                  <input
                    className="qs-input qs-casting__input"
                    placeholder={`Keep the clip link for ${s.cast.join(' & ')} — paste it here…`}
                    defaultValue={(castings[s.cast[0]] || {}).url || ''}
                    onBlur={(e) => keepClip(s.cast, e.target.value.trim())}
                    aria-label={`Clip link for ${s.cast.join(' and ')}`}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="qs-actionrow qs-actionrow--center" style={{ marginTop: 'var(--space-12)' }}>
          <button type="button" className="qs-payoff__again" onClick={() => { setPhase('compose'); setFound({}); setSegs([]); setGroundedBy(null); saveLastResult(null); }}>
            <QSIcoPromo name="rotate-ccw" size={13} />Map a different piece
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qs-page">
      <p className="qs-lead">Paste your writing. I’ll map it into a calm shot-by-shot video plan.</p>
      <QSScriptTA
        value={text}
        onChange={setText}
        placeholder="Paste your writing here…"
        minHeight={260}
        ariaLabel="Your writing"
      />
      <div className="qs-meter">
        <span><strong>{words.toLocaleString()}</strong> words</span>
        <span aria-hidden="true">·</span>
        <span>≈ <strong>{runtimeFromWords(words)}</strong> runtime</span>
        {text ? <><span aria-hidden="true">·</span><span>draft kept</span></> : null}
      </div>
      {gmap ? <GroundRow map={gmap} use={useMap} onChange={setUseMap} /> : null}
      <div className="qs-groundrow" role="radiogroup" aria-label="Preferred footage orientation">
        {['both', 'horizontal', 'vertical', 'square'].map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={orientation === o}
            className={`qs-pill${orientation === o ? ' qs-pill--on' : ''}`}
            onClick={() => setOrientation(o)}
          >
            {o === 'both' ? 'Any' : o === 'horizontal' ? 'Horizontal' : o === 'vertical' ? 'Vertical' : 'Square'}
          </button>
        ))}
        <Tooltip text="Filters the “open in Pexels” link to wide (horizontal, e.g. YouTube), tall (vertical, e.g. Reels/TikTok/Shorts), or square footage. Your editable search terms below are unaffected." />
      </div>
      {error ? <p className="qs-note"><QSIcoPromo name="circle-alert" size={16} />{error}</p> : null}
      <div className="qs-actionrow">
        <QSBtnPromo size="lg" icon="sparkles" onClick={map}>Map my visuals</QSBtnPromo>
      </div>
    </div>
  );
}

window.Promote = Promote;
