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

/* Search terms are written for Pexels: 2-5 words, evocative, cinematic
   ("abandoned lighthouse tower at dusk"). Pexels and Pixabay have large
   catalogues and rank loosely, so the whole phrase works there and the extra
   words genuinely improve the results.

   Coverr does AND-matching over a SMALL catalogue, so the same phrase returns
   nothing at all. Measured 2026-08-20, real result counts from Coverr:

     "abandoned lighthouse tower at dusk"   0  ->  "lighthouse"  2
     "woman staring out window quietly"     0  ->  "woman"    999+
     "coffee going cold by laptop"          0  ->  "coffee"    216
     "two empty chairs cafe table"          0  ->  "chairs"     70
     "gulls circling grey cloudy sky"       0  ->  "gulls"      17
     "empty office after hours desk lamp"   0  ->  "office"    258

   Every full phrase scored ZERO. The terms were not bad - they were aimed at
   the wrong search engine. Coverr gets the subject noun instead. */
const QS_SEARCH_STOPWORDS = {
  a: 1, an: 1, the: 1, of: 1, in: 1, on: 1, at: 1, by: 1, to: 1, with: 1, and: 1,
  or: 1, for: 1, from: 1, into: 1, over: 1, under: 1, near: 1, through: 1,
  against: 1, beside: 1, behind: 1, alone: 1, down: 1, up: 1, out: 1,
  two: 1, three: 1, four: 1, several: 1, many: 1, some: 1, one: 1,
  empty: 1, old: 1, new: 1, small: 1, large: 1, big: 1, dark: 1, bright: 1,
  quiet: 1, still: 1, grey: 1, gray: 1, abandoned: 1, weathered: 1, faded: 1,
  worn: 1, distant: 1, tiny: 1, huge: 1, warm: 1, cold: 1, soft: 1,
};

/* The subject of a search term: first word that is not a function word, a
   numeral, a scene-setting adjective, or a participle/adverb. The prompt writes
   terms subject-first, so the first survivor is almost always the thing the
   camera is pointed at. */
function qsCoreTerm(term) {
  const words = String(term || '').toLowerCase().split(/\s+/)
    .map(function(w) { return w.replace(/[^a-z0-9-]/g, ''); })
    .filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (QS_SEARCH_STOPWORDS[w]) continue;
    if (w.length > 4 && (w.endsWith('ing') || w.endsWith('ly'))) continue;
    return w;
  }
  return words[0] || String(term || '');
}

const QS_VIDEO_SITES = [
  { id: 'pexels',  label: 'Pexels',  url: function(term, op) { return 'https://www.pexels.com/search/videos/' + encodeURIComponent(term) + '/' + op; } },
  { id: 'pixabay', label: 'Pixabay', url: function(term) { return 'https://pixabay.com/videos/search/' + encodeURIComponent(term) + '/'; } },
  // Small catalogue, AND-matched: send the subject noun, not the full phrase.
  { id: 'coverr',  label: 'Coverr',  url: function(term) { return 'https://coverr.co/s?q=' + encodeURIComponent(qsCoreTerm(term)); } },
  // /free-stock-video/<term>/ is a browse-by-TAG path and 404s to an empty page
  // for anything that is not already a tag - the full phrase scored 0 clips
  // there while ?q= returned 40 for the identical phrase. Use the search.
  { id: 'mixkit',  label: 'Mixkit',  url: function(term) { return 'https://mixkit.co/free-stock-video/?q=' + encodeURIComponent(term); } },
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
  const [showNarrate, setShowNarrate] = React.useState(false);
  const [mapTitle, setMapTitle] = React.useState('');
  const [remapBusy, setRemapBusy] = React.useState(false);
  // What the mapper will actually map. NOT the pasted count: the title is
  // lifted out to become the video title, and [music]/timestamp noise is
  // dropped. Comparing against the raw paste reported a shortfall that was
  // never a shortfall - and would have ticked through a real one.
  const [mappableWords, setMappableWords] = React.useState(0);
  const [detectedTitle, setDetectedTitle] = React.useState('');
  const [exportOpen, setExportOpen] = React.useState(false);
  const streamCleanupRef = React.useRef(null);
  const chunkBufferRef = React.useRef({});
  const fileRef = React.useRef(null);
  // Smooth progress: chunk completions are the only REAL events, but they can
  // be 30-60s apart (free-tier AI). Between events the bar advances on a
  // per-chunk time estimate, capped below the next real tick so it never lies.
  const [, forceTick] = React.useState(0);
  const runStartRef = React.useRef(0);        // when this map started
  const lastEventRef = React.useRef(0);       // when the last chunk landed
  const chunkEstRef = React.useRef(35);       // seconds per chunk-wave (adapts)

  // Live reading lines: real fragments of the writer's own text, paired with
  // verbs that describe what the mapper genuinely does (find names, weigh
  // phrases against footage, mark beats, read moods). Nothing invented.
  const phrasePoolRef = React.useRef([]);
  React.useEffect(function () {
    if (phase !== 'becoming') return;
    const words = (text || '').split(/\s+/).filter(Boolean);
    const pool = [];
    for (let i = 0; i + 6 < words.length && pool.length < 40; i += 17) {
      const frag = words.slice(i, i + Math.min(7, 4 + (i % 4))).join(' ')
        .replace(/[\u201C\u201D"]+/g, '').replace(/[.,;:!?]+$/, '');
      if (frag.length > 12) pool.push(frag);
    }
    phrasePoolRef.current = pool.length ? pool : ['your piece'];
  }, [phase, text]);

  function busyReadingLine() {
    const pool = phrasePoolRef.current;
    if (!pool.length) return '';
    const elapsed = Math.max(0, (Date.now() - runStartRef.current) / 1000);
    const step = Math.floor(elapsed / 4);  // rotate every 4s
    const frag = pool[step % pool.length];
    const verbs = [
      'Listening for names near \u201C', 
      'Weighing \u201C',
      'Marking a beat around \u201C',
      'Reading \u201C',
      'Searching moods for \u201C',
    ];
    const tails = ['\u201D', '\u201D against stock footage', '\u201D', '\u201D\u2026', '\u201D'];
    const v = step % verbs.length;
    return verbs[v] + frag + tails[v];
  }

  function elapsedLabel() {
    const s = Math.max(0, Math.floor((Date.now() - runStartRef.current) / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  const mappingActive = totalChunks > 0 && doneChunks < totalChunks;
  React.useEffect(function() {
    if (!(phase === 'becoming' || mappingActive)) return;
    const id = setInterval(function() { forceTick(function(t) { return t + 1; }); }, 400);
    return function() { clearInterval(id); };
  }, [phase, mappingActive]);

  function smoothPct() {
    if (totalChunks <= 0) return 0;
    const base = doneChunks / totalChunks;
    if (doneChunks >= totalChunks) return 100;
    // How far through the in-flight wave are we, by time?
    const since = (Date.now() - (lastEventRef.current || runStartRef.current)) / 1000;
    const waveShare = Math.min(2, totalChunks - doneChunks) / totalChunks; // concurrency 2
    const partial = Math.min(since / chunkEstRef.current, 0.92) * waveShare;
    return Math.min(99, Math.round((base + partial) * 100));
  }

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
    const currentWords = countWords(text);
    if (currentWords < QS_MIN_WORDS) {
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
    setInputWordCount(currentWords);
    chunkBufferRef.current = {}; // fresh buffer for this run
    runStartRef.current = Date.now();
    lastEventRef.current = 0;
    chunkEstRef.current = 35; // reset the per-chunk estimate each run
    setPhase('becoming');

    const cleanup = window.QS_API.promoteStream(
      text,
      grounding,
      {
        onMeta: function(evt) {
          setMappableWords(evt.mappable_words || 0);
          setDetectedTitle(evt.title || '');
        },
        onChunk: function(newSegs, done, total, chunkIndex) {
          setTotalChunks(total);
          setDoneChunks(done);
          // Real event: re-anchor the smooth bar and adapt the estimate to
          // how long chunks are ACTUALLY taking this run.
          lastEventRef.current = Date.now();
          if (done > 0) {
            const measured = (Date.now() - runStartRef.current) / 1000 / done;
            chunkEstRef.current = Math.max(8, Math.min(90, measured));
          }
          // Chunks arrive fastest-first, not in reading order. Sorting only the
          // chunks RECEIVED is not enough: if chunk 3 lands first it becomes the
          // whole list and gets renumbered 01, 02, 03 - the writer watching the
          // fourth part of their own story appear as slide one and then jump when
          // chunk 0 arrives. Every slot is now laid out up front: a chunk that
          // has landed shows its cards, one that has not holds a placeholder.
          // Real content can never occupy a position that is not its own,
          // because the space ahead of it is already spoken for.
          chunkBufferRef.current[chunkIndex] = newSegs.map(toCard);
          const buffer = chunkBufferRef.current;
          const ordered = [];
          const limit = total || Object.keys(buffer).length;
          for (let k = 0; k < limit; k++) {
            if (buffer[k]) buffer[k].forEach(function(c) { ordered.push(c); });
            else ordered.push({ pending: true, chunkIndex: k, index: 'pending-' + k });
          }
          // Number the real cards in script order; placeholders carry no number
          // because the count in front of them is not known yet.
          let placed = 0;
          ordered.forEach(function(c) { if (!c.pending) { placed += 1; c.index = placed; } });
          setSegs(function(prev) {
            if (prev.length === 0 && ordered.length > 0) setPhase('done');
            return ordered;
          });
          // Placeholders are display state, never saved: a restored draft must
          // not resurrect a slot that was only ever a loading affordance.
          saveLastResult({
            segs: ordered.filter(function(c) { return !c.pending; }),
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
      saveLastResult({ segs: next.filter(function(c) { return !c.pending; }),
                       groundedBy: groundedBy, found: found });
      return next;
    });
  }

  // Placeholders are a rendering affordance and nothing else. Every count,
  // export and completeness judgement runs on the real cards only - a pending
  // slot has no words, and letting one reach the word counter would make the
  // coverage line lie about the writer's own script.
  const realSegs = segs.filter(function(s) { return !s.pending; });
  const doneCount = realSegs.filter(function(s) { return found[s.index]; }).length;
  const mappedWords = realSegs.reduce(function(acc, s) { return acc + countWords(s.excerpt); }, 0);
  const remapCount = realSegs.filter(function(s) { return s.needsRemap; }).length;

  function notionText() {
    return realSegs.map(function(s) {
      return '## ' + String(s.index).padStart(2, '0') + ' \u00b7 ' + s.startTime + '\u2013' + s.endTime + ' \u00b7 ' + s.mood + '\n' +
        s.excerpt + '\n' +
        'Clip ~' + s.clipDurationSeconds + 's\n' +
        'Search: ' + s.terms.join(' / ') + '\n';
    }).join('\n');
  }

  function remapUnmapped() {
    // Contiguous runs of needs-remap cards; each run was one failed AI chunk.
    // Remap ONLY those runs - never the whole script again.
    if (remapBusy) return;
    const runs = [];
    realSegs.forEach(function(s, i) {
      if (s.needsRemap) {
        const last = runs[runs.length - 1];
        if (last && last.a + last.n === i) last.n += 1;
        else runs.push({ a: i, n: 1 });
      }
    });
    if (!runs.length) return;

    const wordsIn = function(a, b) {
      return countWords(realSegs.slice(a, b).map(function(c) { return c.excerpt; }).join(' '));
    };

    // Grow each run outward until it clears the API's 100-word floor. The old
    // code FILTERED runs that were too short, so a six-word closing line could
    // never be remapped - the button counted it, promised to fix it, and
    // silently skipped it forever. Borrowing neighbours costs nothing: they get
    // remapped too, with more context than they had the first time.
    const spans = runs.map(function(r) {
      let a = r.a, b = r.a + r.n;
      while (wordsIn(a, b) < QS_MIN_WORDS && (a > 0 || b < realSegs.length)) {
        if (b < realSegs.length) b += 1;
        else if (a > 0) a -= 1;
        if (wordsIn(a, b) >= QS_MIN_WORDS) break;
        if (a > 0) a -= 1;
      }
      return { a: a, b: b };
    });

    // Overlapping spans would remap the same cards twice and fight each other.
    const merged = [];
    spans.sort(function(x, y) { return x.a - y.a; }).forEach(function(s) {
      const last = merged[merged.length - 1];
      if (last && s.a <= last.b) last.b = Math.max(last.b, s.b);
      else merged.push({ a: s.a, b: s.b });
    });

    const eligible = merged.filter(function(s) { return wordsIn(s.a, s.b) >= QS_MIN_WORDS; });
    if (!eligible.length) {
      setError('This piece is too short to remap a part of it on its own \u2014 use \u201cNew piece\u201d to re-run the whole script.');
      return;
    }
    setRemapBusy(true);
    setError('');
    let ri = 0;
    function nextRun() {
      if (ri >= eligible.length) { setRemapBusy(false); return; }
      const span = eligible[ri++];
      const cards = realSegs.slice(span.a, span.b);
      // Sacrificial first line: the mapper's title detector absorbs it, so the
      // run's real first beat can never be eaten as a "title".
      const joined = 'Remap pass\n\n' + cards.map(function(c) { return c.excerpt; }).join('\n');
      const buffer = {};
      window.QS_API.promoteStream(joined, null, {
        onChunk: function(newSegs, _d, _t, chunkIndex) { buffer[chunkIndex] = newSegs.map(toCard); },
        onDone: function(_title) {
          const fresh = [];
          Object.keys(buffer).map(Number).sort(function(a, b) { return a - b; })
            .forEach(function(k) { buffer[k].forEach(function(c) { fresh.push(c); }); });
          if (fresh.length) {
            setSegs(function(prev) {
              // Locate the span by its first card's text (indices may have shifted)
              const at = prev.findIndex(function(s) { return s.excerpt === cards[0].excerpt; });
              if (at === -1) return prev;
              const out = prev.slice(0, at).concat(fresh, prev.slice(at + cards.length));
              out.forEach(function(c, i) { c.index = i + 1; });
              saveLastResult({ segs: out.filter(function(c) { return !c.pending; }),
                               groundedBy: groundedBy, found: found });
              return out;
            });
          }
          nextRun();
        },
        onError: function(msg) {
          setError(msg || 'Remap failed \u2014 try again in a minute.');
          setRemapBusy(false);
        },
      });
    }
    nextRun();
  }

  function downloadFile(name, mime, content) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
  }
  function exportBase() {
    return (mapTitle || 'shot-list').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'shot-list';
  }
  function exportNotion() {
    downloadFile(exportBase() + '.md', 'text/markdown',
      (mapTitle ? '# ' + mapTitle + '\n\n' : '') + notionText());
  }
  function csvEscape(v) {
    v = String(v == null ? '' : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function exportCsv() {
    const rows = [['#', 'Start', 'End', 'Excerpt', 'Mood', 'Clip (s)', 'Search terms', 'Found']];
    realSegs.forEach(function(s) {
      rows.push([s.index, s.startTime, s.endTime, s.excerpt, s.mood, s.clipDurationSeconds, s.terms.join(' / '), found[s.index] ? 'yes' : '']);
    });
    downloadFile(exportBase() + '.csv', 'text/csv',
      rows.map(function(r) { return r.map(csvEscape).join(','); }).join('\n'));
  }

  function applyRealDurations(durs) {
    // Narration gives us the TRUE seconds per segment; recompute the whole
    // timeline cumulatively so start/end times match the spoken piece.
    setSegs(function(prev) {
      let t = 0;
      const fmt = function(s) { const m = Math.floor(s / 60), ss = Math.round(s % 60); return m + ':' + String(ss).padStart(2, '0'); };
      const out = prev.map(function(s) {
        const d = durs.find(function(x) { return x.index === s.index; });
        if (!d) return s;
        const start = t, end = t + d.seconds; t = end;
        return Object.assign({}, s, {
          startTime: fmt(start), endTime: fmt(end),
          clipDurationSeconds: Math.max(1, Math.round(d.seconds)),
        });
      });
      saveLastResult({ segs: out, groundedBy: groundedBy, found: found });
      return out;
    });
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
    const pct = smoothPct();
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
            {(totalChunks > 0 ? pct + '%' : 'Getting started\u2026') + ' \u00b7 ' + elapsedLabel()}
          </p>
          <p className="qs-quiethint" style={{ marginTop: 'var(--space-4)', textAlign: 'center', minHeight: '1.4em' }}>
            {busyReadingLine()}
          </p>
          <p className="qs-quiethint" style={{ marginTop: 'var(--space-2)', textAlign: 'center', opacity: 0.7 }}>
            Free models can be slow — your words are being mapped, not lost.
          </p>
        </div>
      </div>
    );
  }

  if (showNarrate) {
    const Narrate = window.NarrateStudio;
    return (
      <Narrate
        segments={segs}
        onClose={function() { setShowNarrate(false); }}
        onDurations={applyRealDurations}
      />
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
          <span className="qs-mapline__count">{String(doneCount).padStart(2, '0')} of {String(realSegs.length).padStart(2, '0')} mapped</span>
          {mappedWords > 0 && inputWordCount > 0 ? (
            <span className="qs-quiethint" style={{ marginLeft: 'var(--space-3)' }}>
              {'· '}{mappedWords.toLocaleString()} of {(mappableWords || inputWordCount).toLocaleString()} words covered
              {isLoading ? null
                : mappedWords < (mappableWords || inputWordCount) ? ' ⚠️ incomplete' : ' ✓'}
              {!isLoading && detectedTitle ? (
                <span> {'· title: “'}{detectedTitle}{'”'}</span>
              ) : null}
            </span>
          ) : null}
          {isLoading ? (
            <span className="qs-quiethint" style={{ marginLeft: 'var(--space-3)' }}>
              {'\u2014 mapping segment ' + doneChunks + ' of ' + totalChunks + '\u2026'}
            </span>
          ) : null}
          <span style={{ flex: 1 }}></span>
          {!isLoading && remapCount > 0 ? (
            <button type="button" className="qs-payoff__again" disabled={remapBusy} style={{ marginRight: 'var(--space-3)', color: 'var(--ember-400)', borderColor: 'var(--ember-500)' }} onClick={remapUnmapped}>
              <QSIcoPromo name="rotate-ccw" size={13} />{remapBusy ? 'Remapping\u2026' : 'Remap ' + remapCount + ' unmapped'}
            </button>
          ) : null}
          {!isLoading && realSegs.length > 0 ? (
            <button type="button" className="qs-payoff__again" style={{ marginRight: 'var(--space-3)' }} onClick={function() { setShowThumbnail(true); }}>
              <QSIcoPromo name="image" size={13} />Thumbnail Studio
            </button>
          ) : null}
          {!isLoading && realSegs.length > 0 ? (
            <button type="button" className="qs-payoff__again" style={{ marginRight: 'var(--space-3)' }} onClick={function() { setShowNarrate(true); }}>
              <QSIcoPromo name="mic" size={13} />Narrate
            </button>
          ) : null}
          <button type="button" className="qs-payoff__again" style={{ marginRight: 'var(--space-3)' }} onClick={clearAll}>
            <QSIcoPromo name="rotate-ccw" size={13} />New piece
          </button>
          <span className="qs-exportwrap">
            <button type="button" className="qs-payoff__again" aria-haspopup="menu" aria-expanded={exportOpen}
              onClick={function() { setExportOpen(function(o) { return !o; }); }}>
              <QSIcoPromo name="download" size={13} />Export<QSIcoPromo name="chevron-down" size={12} />
            </button>
            {exportOpen ? (
              <React.Fragment>
                <span className="qs-exportmenu__scrim" onClick={function() { setExportOpen(false); }}></span>
                <span className="qs-exportmenu" role="menu">
                  <button type="button" role="menuitem" className="qs-exportmenu__item"
                    onClick={function() { setExportOpen(false); exportNotion(); }}>
                    <QSIcoPromo name="file-text" size={13} />For Notion (.md)
                  </button>
                  <button type="button" role="menuitem" className="qs-exportmenu__item"
                    onClick={function() { setExportOpen(false); exportCsv(); }}>
                    <QSIcoPromo name="table" size={13} />Spreadsheet (.csv)
                  </button>
                </span>
              </React.Fragment>
            ) : null}
          </span>
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
            if (s.pending) {
              // Holds this chunk's place in the reading order while it maps.
              return (
                <div className="qs-deal" key={s.index}>
                  <div className="qs-deal--pending" aria-busy="true" aria-live="polite">
                    <span className="qs-deal--pending__lamp" aria-hidden="true"></span>
                    <span className="qs-quiethint">Mapping this part of your story…</span>
                  </div>
                </div>
              );
            }
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
                  termHref={function(t) {
                    const site = QS_VIDEO_SITES.find(function(x) { return x.id === videoSite; }) || QS_VIDEO_SITES[0];
                    return site.url(t, orientationParam(orientation));
                  }}
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
              role="progressbar" aria-valuenow={smoothPct()}
              aria-valuemin={0} aria-valuemax={100} aria-label="Mapping progress">
              <div className="qs-mapprogress__fill" style={{ width: smoothPct() + '%' }}></div>
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
