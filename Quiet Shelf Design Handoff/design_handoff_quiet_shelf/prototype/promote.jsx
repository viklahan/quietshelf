/* Quiet Shelf — Promote. Paste → word/runtime → calm map → segment cards. */
const QSDS_promo = window.QuietFightClubDesignSystem_fae847;
const { Button: QSBtnPromo, Icon: QSIcoPromo, ScriptTextarea: QSScriptTA, ManuscriptCard } = QSDS_promo;

function countWords(s) {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}
function runtimeFromWords(w) {
  const secs = Math.round((w / 150) * 60); // ~150 narrated wpm
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function Promote() {
  const { Becoming, CopyButton } = window;
  const data = window.QS_DATA;

  const [phase, setPhase] = React.useState('compose'); // compose | becoming | done
  const [text, setText] = React.useState('');
  const [error, setError] = React.useState('');
  const [found, setFound] = React.useState({});

  const words = countWords(text);
  const segs = data.segments;

  function map() {
    if (words < 40) { setError('This looks like a fragment. Paste the full piece for a proper visual map.'); return; }
    setError('');
    setPhase('becoming');
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
          lines={['Reading your piece…', 'Breaking it into scenes…', 'Mapping the visuals…']}
          sub="Mapping your footage."
          duration={3600}
          onDone={() => setPhase('done')}
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
          <button type="button" className="qs-payoff__again" onClick={() => { setPhase('compose'); setFound({}); }}>
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
