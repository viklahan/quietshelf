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
  };
}

function Promote() {
  const { Becoming, CopyButton } = window;

  const [phase, setPhase] = React.useState('compose'); // compose | becoming | done
  const [text, setText] = React.useState('');
  const [error, setError] = React.useState('');
  const [found, setFound] = React.useState({});
  const [segs, setSegs] = React.useState([]);

  const words = countWords(text);

  async function map() {
    if (words < QS_MIN_WORDS) {
      setError(`This looks like a fragment. Paste the full piece (at least ${QS_MIN_WORDS} words) for a proper visual map.`);
      return;
    }
    if (words > QS_MAX_WORDS) {
      setError(`That’s a long piece (${words.toLocaleString()} words). Split it into parts of ${QS_MAX_WORDS.toLocaleString()} words or fewer.`);
      return;
    }
    setError('');
    setFound({});
    setPhase('becoming');
    try {
      const [shotlist] = await Promise.all([
        window.QS_API.promote(text),
        window.QS_API.calmDelay(1600),
      ]);
      setSegs((shotlist.segments || []).map(toCard));
      setPhase('done');
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setPhase('compose');
    }
  }

  function toggle(i, v) { setFound((p) => ({ ...p, [i]: v })); }
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
    return (
      <div className="qs-page">
        <Becoming
          lines={[
            'Reading your piece…',
            'Breaking it into scenes…',
            'Mapping the visuals…',
            'Choosing search terms…',
            'Still working — free models can be slow…',
          ]}
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
                found={!!found[s.index]}
                onFoundChange={(v) => toggle(s.index, v)}
              />
            </div>
          ))}
        </div>

        <div className="qs-actionrow qs-actionrow--center" style={{ marginTop: 'var(--space-12)' }}>
          <button type="button" className="qs-payoff__again" onClick={() => { setPhase('compose'); setFound({}); setSegs([]); }}>
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
      </div>
      {error ? <p className="qs-note"><QSIcoPromo name="circle-alert" size={16} />{error}</p> : null}
      <div className="qs-actionrow">
        <QSBtnPromo size="lg" icon="sparkles" onClick={map}>Map my visuals</QSBtnPromo>
      </div>
    </div>
  );
}

window.Promote = Promote;
