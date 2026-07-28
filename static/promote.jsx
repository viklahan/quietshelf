/* Quiet Shelf — Promote. Paste → word/runtime → progressive map → segment cards.
   Now uses SSE streaming (/api/promote/stream) so the first segments appear
   as soon as the fastest chunk finishes — no more waiting for the full map. */
const QSDS_promo = window.QuietFightClubDesignSystem_fae847;
const { Button: QSBtnPromo, Icon: QSIcoPromo, ScriptTextarea: QSScriptTA, ManuscriptCard } = QSDS_promo;

const QS_MIN_WORDS = 100;
const QS_MAX_WORDS = 999999; // no cap — send the whole story

function countWords(s) {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}
function runtimeFromWords(w) {
  const secs = Math.round((w / 150) * 60);
  const m = Math.floor(secs / 60), s = secs % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function orientationParam(orientation) {
  if (orientation === 'horizontal') return '?orientation=landscape';
  if (orientation === 'vertical') return '?orientation=portrait';
  if (orientation === 'square') return '?orientation=square';
  return '';
}

function pickTextTokens(text, count) {
  count = count || 4;
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

function moodToTone(mood) {
  const m = (mood || '').toLowerCase();
  if (/(hope|warm|joy|resolv|tender|love|calm|peace|gentle|bright|uplift|triumph|celebrat|relief|comfort|nostalgic|bittersweet)/.test(m)) return 'ember';
  if (/(tense|dark|grief|fear|turning|danger|storm|anger|loss|despair|dread|haunt|ominous|tragic|urgent|anxious|conflict|bitter|brutal)/.test(m)) return 'oxblood';
  if (/(solemn|quiet|still|somber|reflect|grey|melanchol|contemplat|wistful|pensive|mournful|serene|subdued|restrained|introspect)/.test(m)) return 'paper';
  return 'ember'; // default to warm rather than dead neutral
}

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
    needsRemap: !!seg.needs_remap,
  };
}

const QS_CASTINGS_KEY = 'qs.promote.castings';
function loadCastings() {
  try { return JSON.parse(localStorage.getItem(QS_CASTINGS_KEY)) || {}; } catch (e) { return {}; }
}
function saveCastings(c) {
  try { localStorage.setItem(QS_CASTINGS_KEY, JSON.stringify(c)); } catch (e) {}
}

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

const QS_VIDEO_SITES = [
  { id: 'pexels',  label: 'Pexels',  url: function(term, op) { return 'https://www.pexels.com/search/videos/' + encodeURIComponent(term) + '/' + op; } },
  { id: 'pixabay', label: 'Pixabay', url: function(term) { return 'https://pixabay.com/videos/search/' + encodeURIComponent(term) + '/'; } },
  { id: 'coverr',  label: 'Coverr',  url: function(term) { return 'https://coverr.co/s?q=' + encodeURIComponent(term); } },
  { id: 'mixkit',  label: 'Mixkit',  url: function(term) { return 'https://mixkit.co/free-stock-video/' + encodeURIComponent(term) + '/'; } },
];

function Promote() {
  const { Becoming, CopyButton, useKeptDraft, loadLastMap, GroundRow, Tooltip } = window;

  const [phase, setPhase] = React.useState(() => (loadLastResult() ? 'done' : 'compose'));
  const [text, setText] = useKeptDraft('qs.draft.promote');
  const [file, setFile] = React.useState(null);
  const [error, setError] = React.useState('');
  const [found, setFound] = React.useState(() => { const r = loadLastResult(); return r ? (r.found || {}) : {}; });
  const [segs, setSegs] = React.useState(() => { const r = loadLastResult(); return r ? r.segs : []; });
  const [orientation, setOrientation] = React.useState('both');
  const [videoSite, setVideoSite] = React.useState('pexels');
  const [gmap] = React.useState(loadLastMap);
  const [useMap, setUseMap] = React.useState(() => {
    const m = loadLastMap();
    return !!(m && !m.fabricated);
  });
  const [groundedBy, setGroundedBy] = React.useState(() => { const r = loadLastResult(); return r ? (r.groundedBy || null) : null; });
  const [castings, setCastings] = React.useState(loadCastings);
  const [totalChunks, setTotalChunks] = React.useState(0);
  const [doneChunks, setDoneChunks] = React.useState(0);
  const [inputWordCount, setInputWordCount] = React.useState(0);
  const [showThumbnail, setShowThumbnail] = React.useState(false);
  const [mapTitle, setMapTitle] = React.useState('');
  const streamCleanupRef = React.useRef(null);
  const chunkBufferRef = React.useRef({});
  const fileRef = React.useRef(null);

  React.useEffect(() => () => { if (streamCleanupRef.current) streamCleanupRef.current(); }, []);

  const words = countWords(text);

  function onPickFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!['docx', 'rtf', 'txt'].includes(ext)) {
      setError('I can only read Word (.docx), RTF, or plain text files. Try one of those?');
      return;
    }
    setError('');
    setFile(f);
    // Extract text server-side — handles DOCX, RTF, and TXT correctly
    window.QS_API.promoteExtract(f).then(function(res) {
      setText(res.text || '');
      if ((res.word_count || 0) < QS_MIN_WORDS) {
        setError('That file looks short — make sure it has at least ' + QS_MIN_WORDS + ' words.');
      }
    }).catch(function(err) {
      setError((err && err.message) || 'Could not read that file. Try copying the text directly.');
      setFile(null);
    });
  }

  function clearFile() {
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function keepClip(names, url) {
    const next = Object.assign({}, castings);
    names.forEach(function(n) {
      if (url) next[n] = { url: url };
      else delete next[n];
    });
    setCastings(next);
    saveCastings(next);
  }

  function map() {
    if (words < QS_MIN_WORDS) {
      setError('Paste at least ' + QS_MIN_WORDS + ' words to map your visuals.');
      return;
    }
    const grounding = useMap && gmap ? gmap : null;
    setError('');
    setFound({});
    setSegs([]);
    setGroundedBy(null);
    setTotalChunks(0);
    setDoneChunks(0);
    setInputWordCount(words);
    chunkBufferRef.current = {}; // fresh buffer for this run
    setPhase('becoming');

    const cleanup = window.QS_API.promoteStream(
      text,
      grounding,
      {
        onChunk: function(newSegs, done, total, chunkIndex) {
          setTotalChunks(total);
          setDoneChunks(done);
          // Buffer each chunk's cards under its chunk_index in a ref (survives
          // re-renders and is never serialized). Chunks arrive out of order
          // (fastest first), so we sort by index before display or slide 1
          // shows middle-of-script text.
          chunkBufferRef.current[chunkIndex] = newSegs.map(toCard);
          const buffer = chunkBufferRef.current;
          const ordered = [];
          Object.keys(buffer)
            .map(Number)
            .sort(function(a, b) { return a - b; })
            .forEach(function(k) { buffer[k].forEach(function(c) { ordered.push(c); }); });
          // Renumber display indices sequentially in script order
          ordered.forEach(function(c, i) { c.index = i + 1; });
          setSegs(function(prev) {
            if (prev.length === 0 && ordered.length > 0) setPhase('done');
            return ordered;
          });
          saveLastResult({
            segs: ordered,
            groundedBy: grounding ? { n: grounding.characters.length, fabricated: !!grounding.fabricated } : null,
            found: {},
          });
        },
        onDone: function(title, _runtime) {
          setGroundedBy(grounding ? { n: grounding.characters.length, fabricated: !!grounding.fabricated } : null);
          setMapTitle(title || '');
          setPhase('done');
          setTotalChunks(0);
          setDoneChunks(0);
        },
        onError: function(msg) {
          setError(msg || 'The AI is unavailable right now. Try again in a minute.');
          setPhase('compose');
          setTotalChunks(0);
          setDoneChunks(0);
        },
      }
    );
    streamCleanupRef.current = cleanup;
  }

  function toggle(i, v) {
    setFound(function(p) {
      const next = Object.assign({}, p, { [i]: v });
      saveLastResult({ segs: segs, groundedBy: groundedBy, found: next });
      return next;
    });
  }

  function editTerm(cardIdx, termIdx, value) {
    setSegs(function(prev) {
      const next = prev.map(function(s, i) {
        return i === cardIdx
          ? Object.assign({}, s, { terms: s.terms.map(function(t, j) { return j === termIdx ? value : t; }) })
          : s;
      });
      saveLastResult({ segs: next, groundedBy: groundedBy, found: found });
      return next;
    });
  }

  const doneCount = segs.filter(function(s) { return found[s.index]; }).length;
  const mappedWords = segs.reduce(function(acc, s) { return acc + countWords(s.excerpt); }, 0);
  const remapCount = segs.filter(function(s) { return s.needsRemap; }).length;

  function notionText() {
    return segs.map(function(s) {
      return '## ' + String(s.index).padStart(2, '0') + ' \u00b7 ' + s.startTime + '\u2013' + s.endTime + ' \u00b7 ' + s.mood + '\n' +
        s.excerpt + '\n' +
        'Clip ~' + s.clipDurationSeconds + 's\n' +
        'Search: ' + s.terms.join(' / ') + '\n';
    }).join('\n');
  }

  function clearAll() {
    setPhase('compose');
    setFound({});
    setSegs([]);
    setGroundedBy(null);
    setFile(null);
    setText('');
    if (fileRef.current) fileRef.current.value = '';
    saveLastResult(null);
  }

  if (phase === 'becoming') {
    const pct = totalChunks > 0 ? Math.round((doneChunks / totalChunks) * 100) : 0;
    const barLabel = totalChunks > 0
      ? 'Mapping segment ' + (doneChunks + 1) + ' of ' + totalChunks
      : 'Reading your piece\u2026';
    return (
      <div className="qs-page">
        <div className="qs-mapprogress">
          <div className="qs-mapprogress__film" aria-hidden="true">
            <QSIcoPromo name="film" size={44} />
          </div>
          <p className="qs-mapprogress__title">Mapping your footage</p>
          <p className="qs-mapprogress__label">{barLabel}</p>
          <div className="qs-mapprogress__track" role="progressbar"
            aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
            aria-label="Mapping progress">
            <div
              className={'qs-mapprogress__fill' + (totalChunks === 0 ? ' qs-mapprogress__fill--indeterminate' : '')}
              style={totalChunks > 0 ? { width: pct + '%' } : {}}
            ></div>
          </div>
          <p className="qs-mapprogress__pct">
            {totalChunks > 0 ? pct + '%' : 'Getting started\u2026'}
          </p>
          <p className="qs-quiethint" style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
            Free models can be slow — hang tight, your words are being mapped.
          </p>
        </div>
      </div>
    );
  }

  if (showThumbnail) {
    const Studio = window.ThumbnailStudio;
    return (
      <Studio
        segments={segs}
        title={mapTitle}
        onClose={function() { setShowThumbnail(false); }}
      />
    );
  }

  if (phase === 'done') {
    const isLoading = totalChunks > 0 && doneChunks < totalChunks;
    return (
      <div className="qs-page">
        <p className="qs-lead">Your visuals, scene by scene. Open a search, find the clip, check it off.</p>

        <div className="qs-mapline">
          <QSIcoPromo name="list-checks" size={16} />
          <span className="qs-mapline__count">{String(doneCount).padStart(2, '0')} of {String(segs.length).padStart(2, '0')} mapped</span>
          {mappedWords > 0 && inputWordCount > 0 ? (
            <span className="qs-quiethint" style={{ marginLeft: 'var(--space-3)' }}>
              {'· '}{mappedWords.toLocaleString()} of {inputWordCount.toLocaleString()} words covered
              {mappedWords < inputWordCount * 0.95 ? ' ⚠️ incomplete' : ' ✓'}
            </span>
          ) : null}
          {isLoading ? (
            <span className="qs-quiethint" style={{ marginLeft: 'var(--space-3)' }}>
              {'\u2014 mapping segment ' + doneChunks + ' of ' + totalChunks + '\u2026'}
            </span>
          ) : null}
          <span style={{ flex: 1 }}></span>
          {!isLoading && remapCount > 0 ? (
            <button type="button" className="qs-payoff__again" style={{ marginRight: 'var(--space-3)', color: 'var(--ember-400)', borderColor: 'var(--ember-500)' }} onClick={map}>
              <QSIcoPromo name="rotate-ccw" size={13} />Remap {remapCount} unmapped
            </button>
          ) : null}
          {!isLoading && segs.length > 0 ? (
            <button type="button" className="qs-payoff__again" style={{ marginRight: 'var(--space-3)' }} onClick={function() { setShowThumbnail(true); }}>
              <QSIcoPromo name="image" size={13} />Make a thumbnail
            </button>
          ) : null}
          <button type="button" className="qs-payoff__again" style={{ marginRight: 'var(--space-3)' }} onClick={clearAll}>
            <QSIcoPromo name="rotate-ccw" size={13} />New piece
          </button>
          <CopyButton text={notionText()} label="Copy for Notion" />
        </div>

        <div className="qs-groundrow" role="radiogroup" aria-label="Video source">
          {QS_VIDEO_SITES.map(function(site) {
            return (
              <button key={site.id} type="button" role="radio"
                aria-checked={videoSite === site.id}
                className={'qs-pill' + (videoSite === site.id ? ' qs-pill--on' : '')}
                onClick={function() { setVideoSite(site.id); }}>
                {site.label}
              </button>
            );
          })}
        </div>

        {groundedBy ? (
          <p className="qs-quiethint" style={{ margin: '0 0 var(--space-6) 0' }}>
            Grounded by your story map {'\u00b7'} {groundedBy.n} {groundedBy.n === 1 ? 'character' : 'characters'}
            {groundedBy.fabricated ? ' \u00b7 imagined cast, on your request' : ''}
          </p>
        ) : null}

        <div className="qs-board">
          {segs.map(function(s, idx) {
            return (
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
                  onTermChange={function(ti, v) { editTerm(idx, ti, v); }}
                  found={!!found[s.index]}
                  onFoundChange={function(v) { toggle(s.index, v); }}
                />
                <div className="qs-casting">
                  {s.needsRemap ? (
                    <p className="qs-quiethint" style={{ color: 'var(--ember-400)', margin: '0 0 var(--space-2) 0' }}>
                      <QSIcoPromo name="circle-alert" size={14} /> The AI couldn't reach this one — these are placeholder words from your text. Hit “Remap” above to try again.
                    </p>
                  ) : null}
                  {s.terms.length ? (
                    <a
                      className="qs-casting__link"
                      href={(QS_VIDEO_SITES.find(function(x){return x.id===videoSite;})||QS_VIDEO_SITES[0]).url(s.terms[0],orientationParam(orientation))}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {'Open in ' + ((QS_VIDEO_SITES.find(function(x){return x.id===videoSite;})||QS_VIDEO_SITES[0]).label) + (orientation !== 'both' ? ' (' + orientation + ')' : '') + ' ↗'}
                    </a>
                  ) : null}
                  {s.cast.filter(function(n) { return castings[n] && castings[n].url; }).map(function(n) {
                    return (
                      <a key={n} className="qs-casting__link" href={castings[n].url} target="_blank" rel="noreferrer">
                        {'You used this clip for ' + n + ' \u2197'}
                      </a>
                    );
                  })}
                  {found[s.index] && s.cast.length ? (
                    <input
                      className="qs-input qs-casting__input"
                      placeholder={'Keep the clip link for ' + s.cast.join(' & ') + ' \u2014 paste it here\u2026'}
                      defaultValue={(castings[s.cast[0]] || {}).url || ''}
                      onBlur={function(e) { keepClip(s.cast, e.target.value.trim()); }}
                      aria-label={'Clip link for ' + s.cast.join(' and ')}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {isLoading ? (
          <div style={{ marginTop: 'var(--space-6)' }}>
            <div className="qs-mapprogress__track" style={{ maxWidth: '440px', margin: '0 auto' }}
              role="progressbar" aria-valuenow={Math.round((doneChunks / totalChunks) * 100)}
              aria-valuemin={0} aria-valuemax={100} aria-label="Mapping progress">
              <div className="qs-mapprogress__fill" style={{ width: Math.round((doneChunks / totalChunks) * 100) + '%' }}></div>
            </div>
            <p className="qs-quiethint" style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
              Mapping segment {doneChunks} of {totalChunks} — more on their way{'…'}
            </p>
          </div>
        ) : (
          <div className="qs-actionrow qs-actionrow--center" style={{ marginTop: 'var(--space-12)' }}>
            <button type="button" className="qs-payoff__again" onClick={clearAll}>
              <QSIcoPromo name="rotate-ccw" size={13} />Map a different piece
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="qs-page">
      <p className="qs-lead">Paste your writing. I'll map it into a calm shot-by-shot video plan.</p>
      <div className="qs-markwrap">
        {!text ? <span className="qs-markwrap__ico" aria-hidden="true"><QSIcoPromo name="film" size={120} /></span> : null}
        <QSScriptTA
          value={text}
          onChange={setText}
          placeholder="Paste your writing here…"
          minHeight={260}
          ariaLabel="Your writing"
        />
      </div>

      <div className="qs-or"><span>or</span></div>

      <input
        ref={fileRef} type="file" accept=".docx,.rtf,.txt"
        onChange={onPickFile}
        style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0, opacity: 0 }}
        tabIndex={-1}
      />
      {file ? (
        <div className="qs-file qs-drop--filled">
          <span className="qs-file__name">
            <QSIcoPromo name="file-text" size={18} className="qs-file__ico" />{file.name}
          </span>
          <button type="button" className="qs-payoff__again" onClick={clearFile}>Remove</button>
        </div>
      ) : (
        <button type="button" className="qs-drop"
          onClick={function() { fileRef.current && fileRef.current.click(); }}>
          <span className="qs-drop__ico"><QSIcoPromo name="file-text" size={28} /></span>
          <p className="qs-drop__line">Bring me your writing.</p>
          <p className="qs-drop__hint">Word, RTF, or text</p>
        </button>
      )}
      <div className="qs-meter">
        <span><strong>{words.toLocaleString()}</strong> words</span>
        <span aria-hidden="true">{'\u00b7'}</span>
        <span>{'\u2248 '}<strong>{runtimeFromWords(words)}</strong>{' runtime'}</span>
        {text ? <React.Fragment><span aria-hidden="true">{'\u00b7'}</span><span>draft kept</span></React.Fragment> : null}
      </div>
      {gmap ? <GroundRow map={gmap} use={useMap} onChange={setUseMap} /> : null}
      <div className="qs-groundrow" role="radiogroup" aria-label="Preferred footage orientation">
        {['both', 'horizontal', 'vertical', 'square'].map(function(o) {
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={orientation === o}
              className={'qs-pill' + (orientation === o ? ' qs-pill--on' : '')}
              onClick={function() { setOrientation(o); }}
            >
              {o === 'both' ? 'Any' : o === 'horizontal' ? 'Horizontal' : o === 'vertical' ? 'Vertical' : 'Square'}
            </button>
          );
        })}
        <Tooltip text="Filters the video search links to wide (horizontal), tall (vertical), or square footage. Your editable search terms are unaffected." />
      </div>
      {error ? <p className="qs-note"><QSIcoPromo name="circle-alert" size={16} /><span>{error}</span></p> : null}
      <div className="qs-actionrow">
        <QSBtnPromo size="lg" icon="sparkles" onClick={map}>Map my visuals</QSBtnPromo>
      </div>
    </div>
  );
}

window.Promote = Promote;
