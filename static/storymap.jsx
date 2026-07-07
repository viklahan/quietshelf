/* Quiet Shelf — Story Map. The mirror: paste/bring → scan-driven becoming →
   the cast, exactly as written. When there's nothing to reflect, the Imagine
   door opens — everything imagined is stamped, never passed off as found.
   Wired to POST /api/storymap/{scan,map,imagine} (multipart Form). */
const QSDS_smap = window.QuietFightClubDesignSystem_fae847;
const { Button: QSBtnSmap, Icon: QSIcoSmap, ScriptTextarea: QSSmapTA, Stamp: QSStamp } = QSDS_smap;

const QS_SM_MIN_WORDS = 10;
const QS_SM_MAX_WORDS = 3000;

const QS_SM_HIDDEN_INPUT = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
  border: 0, opacity: 0,
};

const QS_IMAGINE_MODES = [
  { id: 'seed', label: 'Seed a cast', hint: 'A few characters to start from.' },
  { id: 'full', label: 'Imagine it all', hint: 'A complete invented map.' },
  { id: 'prompts', label: 'Ask me questions', hint: 'Questions that open doors — no invented people.' },
];

function countWordsSm(s) {
  const t = (s || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

/* role → stamp tone. Purely visual: leads glow ember, everyone else paper. */
function roleTone(role) {
  const r = (role || '').toLowerCase();
  if (/(protagonist|lead|main|hero|heroine|narrator)/.test(r)) return 'ember';
  if (/(antagonist|villain|rival)/.test(r)) return 'oxblood';
  return 'paper';
}

const QS_TEXTURE_LABELS = [
  ['appearance', 'Appearance'],
  ['clothing', 'Clothing'],
  ['habits', 'Habits'],
  ['routines', 'Routines'],
  ['notable_objects', 'Objects'],
  ['associated_places', 'Places'],
];

/* importance 1-5 as quiet dots */
function Importance({ n }) {
  const v = Math.max(1, Math.min(5, n || 3));
  return (
    <span className="qs-imp" aria-label={`importance ${v} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`qs-imp__dot${i <= v ? ' qs-imp__dot--on' : ''}`} aria-hidden="true"></span>
      ))}
    </span>
  );
}

function CharacterCard({ ch, names, imagined }) {
  const texture = ch.texture || {};
  const textureRows = QS_TEXTURE_LABELS.filter(([k]) => texture[k]);
  const rels = ch.relationships || [];
  return (
    <section className={`qs-char${imagined ? ' qs-char--imagined' : ''}`}>
      <div className="qs-char__head">
        <h3 className="qs-char__name">{ch.name}</h3>
        <span className="qs-char__meta">
          {imagined ? <QSStamp tone="ember">Imagined</QSStamp> : null}
          <QSStamp tone={roleTone(ch.role)}>{ch.role || 'supporting'}</QSStamp>
          <Importance n={ch.importance} />
        </span>
      </div>
      {ch.personality ? <p className="qs-char__personality">{ch.personality}</p> : null}
      {ch.arc ? <p className="qs-char__arc"><QSIcoSmap name="arrow-right" size={13} className="qs-char__arcico" />{ch.arc}</p> : null}
      {textureRows.length ? (
        <dl className="qs-char__texture">
          {textureRows.map(([k, label]) => (
            <div className="qs-char__trow" key={k}>
              <dt>{label}</dt>
              <dd>{texture[k]}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {rels.length ? (
        <ul className="qs-char__rels">
          {rels.map((r, i) => (
            <li className="qs-rel" key={i}>
              <span className="qs-rel__who">{names[r.with] || r.with}</span>
              <span className="qs-rel__type">{r.type || 'other'}</span>
              {r.note ? <span className="qs-rel__note">{r.note}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/* The Imagine door — mode pills + an optional nudge. `prominent` opens it
   pre-expanded (the empty-map dead end); otherwise it's a quiet threshold. */
function ImagineDoor({ prominent, busy, onImagine }) {
  const [open, setOpen] = React.useState(!!prominent);
  const [mode, setMode] = React.useState('seed');
  const [nudge, setNudge] = React.useState('');

  if (!open) {
    return (
      <div className="qs-actionrow qs-actionrow--center">
        <button type="button" className="qs-payoff__again" onClick={() => setOpen(true)}>
          <QSIcoSmap name="sparkles" size={13} />Open the Imagine door
        </button>
      </div>
    );
  }

  const chosen = QS_IMAGINE_MODES.find((m) => m.id === mode);
  return (
    <section className="qs-imagine">
      <div className="qs-imagine__head">
        <QSIcoSmap name="sparkles" size={16} className="qs-imagine__ico" />
        <span className="qs-imagine__title">The Imagine door</span>
        <QSStamp tone="ember">Invents on request</QSStamp>
      </div>
      <p className="qs-imagine__line">
        Ask, and I’ll dream something up from your material. Everything that
        comes through this door is stamped as imagined — never passed off as
        found on the page.
      </p>
      <div className="qs-pills">
        {QS_IMAGINE_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`qs-pill${mode === m.id ? ' qs-pill--on' : ''}`}
            onClick={() => setMode(m.id)}
            aria-pressed={mode === m.id}
          >{m.label}</button>
        ))}
      </div>
      <p className="qs-quiethint" style={{ marginTop: 'var(--space-3)' }}>{chosen.hint}</p>
      <input
        className="qs-input"
        style={{ marginTop: 'var(--space-4)' }}
        value={nudge}
        onChange={(e) => setNudge(e.target.value)}
        placeholder="A nudge, if you like — a genre, a mood, a premise…"
        aria-label="Nudge for the imagine engine"
      />
      <div className="qs-actionrow">
        <QSBtnSmap size="lg" icon="sparkles" onClick={() => onImagine(mode, nudge)} disabled={busy}>
          {busy ? 'Imagining…' : 'Imagine'}
        </QSBtnSmap>
      </div>
    </section>
  );
}

function StoryMapPage() {
  const { Becoming, CopyButton, useKeptDraft, saveLastMap } = window;

  const [phase, setPhase] = React.useState('compose'); // compose | becoming | map | prompts
  const [text, setText] = useKeptDraft('qs.draft.storymap');
  const [file, setFile] = React.useState(null);
  const [error, setError] = React.useState('');
  const [map, setMap] = React.useState(null);          // StoryMap (found or imagined)
  const [foundMap, setFoundMap] = React.useState(null); // last mirror result, to return to
  const [prompts, setPrompts] = React.useState(null);   // StoryPrompts
  const [scanNames, setScanNames] = React.useState([]);
  const [imagining, setImagining] = React.useState(false);
  const [lastImagine, setLastImagine] = React.useState(null); // for reroll
  const fileRef = React.useRef(null);
  const mapFileRef = React.useRef(null);

  const words = countWordsSm(text);

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

  async function mapStory() {
    if (!file && words < QS_SM_MIN_WORDS) {
      setError('Need a bit more text to map — paste a few sentences of story, or bring the file.');
      return;
    }
    if (!file && words > QS_SM_MAX_WORDS) {
      setError(`Story Map v1 maps up to ${QS_SM_MAX_WORDS.toLocaleString()} words — try a chapter or excerpt.`);
      return;
    }
    setError('');
    setScanNames([]);
    setPhase('becoming');
    // Pass 1 feeds the loader while Pass 2 does the real reading. The scan is
    // best-effort: it can fail or finish late without ever blocking the map.
    window.QS_API.storymapScan({ text, file })
      .then((s) => setScanNames((s.characters || []).slice(0, 6)))
      .catch(() => {});
    try {
      const [result] = await Promise.all([
        window.QS_API.storymapMap({ text, file }),
        window.QS_API.calmDelay(1600),
      ]);
      setMap(result);
      setFoundMap(result);
      setLastImagine(null);
      // Keep the map so Blurb and Promote can ground with it, and so a
      // refresh doesn't cost the writer their session's reading.
      if ((result.characters || []).length) saveLastMap(result);
      setPhase('map');
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setPhase('compose');
    }
  }

  async function imagine(mode, nudge, reroll) {
    const existing = (foundMap && foundMap.story_detected)
      ? foundMap.characters.map((c) => c.name)
      : [];
    setImagining(true);
    setError('');
    try {
      const result = await window.QS_API.storymapImagine({ text, file, mode, nudge, existing, reroll });
      setLastImagine({ mode, nudge });
      if (mode === 'prompts') {
        setPrompts(result);
        setPhase('prompts');
      } else {
        setMap(result);
        if ((result.characters || []).length) saveLastMap(result);
        setPhase('map');
      }
    } catch (err) {
      setError(err.message || 'Couldn’t imagine a story this time. Try again.');
    } finally {
      setImagining(false);
    }
  }

  function reset() {
    setPhase('compose');
    setMap(null);
    setFoundMap(null);
    setPrompts(null);
    setScanNames([]);
    setLastImagine(null);
    setError('');
  }

  /* Save the map as a file the writer owns — re-loadable here, and the
     grounding source for Blurb and Promote. */
  function downloadMap(m) {
    const blob = new Blob([JSON.stringify(m, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `story-map-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  function onPickMap(e) {
    const f = e.target.files && e.target.files[0];
    if (mapFileRef.current) mapFileRef.current.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const m = JSON.parse(reader.result);
        if (!m || !Array.isArray(m.characters) || !m.characters.length) {
          setError('That file doesn’t look like a saved story map. Save one from this tab first.');
          return;
        }
        setError('');
        setMap(m);
        if (!m.fabricated && m.story_detected) setFoundMap(m);
        saveLastMap(m);
        setPhase('map');
      } catch (err) {
        setError('That file doesn’t look like a saved story map. Save one from this tab first.');
      }
    };
    reader.readAsText(f);
  }

  function notionText(m) {
    const names = {};
    m.characters.forEach((c) => { names[c.id] = c.name; });
    const header = m.fabricated
      ? '> Imagined on request — invented, not found in the text.\n\n'
      : '';
    return header + m.characters.map((c) => {
      const lines = [`## ${c.name} · ${c.role || 'supporting'} · ${'●'.repeat(Math.max(1, Math.min(5, c.importance || 3)))}`];
      if (c.personality) lines.push(c.personality);
      if (c.arc) lines.push(`Arc: ${c.arc}`);
      const t = c.texture || {};
      QS_TEXTURE_LABELS.forEach(([k, label]) => { if (t[k]) lines.push(`${label}: ${t[k]}`); });
      (c.relationships || []).forEach((r) => {
        lines.push(`— ${names[r.with] || r.with} (${r.type || 'other'})${r.note ? ': ' + r.note : ''}`);
      });
      return lines.join('\n');
    }).join('\n\n');
  }

  if (phase === 'becoming') {
    const lines = scanNames.length
      ? [
          `Found ${scanNames.slice(0, 3).join(', ')}…`,
          'Following how they connect…',
          'Reading only what’s on the page…',
          'Still working — free models can be slow…',
        ]
      : [
          'Reading your story…',
          'Listening for who’s there…',
          'Reading only what’s on the page…',
          'Still working — free models can be slow…',
        ];
    return (
      <div className="qs-page qs-page--narrow">
        <Becoming lines={lines} sub="Mapping your story." duration={3600} onDone={() => {}} />
      </div>
    );
  }

  if (phase === 'prompts' && prompts) {
    return (
      <div className="qs-page qs-page--narrow">
        <p className="qs-lead">Questions, not answers — each one opens a door.</p>
        {prompts.note ? <p className="qs-quiethint" style={{ marginBottom: 'var(--space-6)' }}>{prompts.note}</p> : null}
        <div className="qs-results">
          {(prompts.prompts || []).map((p, i) => (
            <section className="qs-rcard" key={i} style={{ animationDelay: (i * 60) + 'ms' }}>
              <div className="qs-rcard__head">
                <span className="qs-rcard__label">{String(i + 1).padStart(2, '0')}</span>
                <QSStamp tone="ember">Imagined</QSStamp>
              </div>
              <p className="qs-prompt__q">{p.question}</p>
              {p.angle ? <p className="qs-prompt__angle">{p.angle}</p> : null}
            </section>
          ))}
        </div>
        {error ? <p className="qs-note"><QSIcoSmap name="circle-alert" size={16} />{error}</p> : null}
        <div className="qs-actionrow qs-actionrow--center">
          <button type="button" className="qs-payoff__again" disabled={imagining}
            onClick={() => imagine('prompts', (lastImagine && lastImagine.nudge) || '', true)}>
            <QSIcoSmap name="rotate-ccw" size={13} />{imagining ? 'Imagining…' : 'Different questions'}
          </button>
          {foundMap ? (
            <button type="button" className="qs-payoff__again" onClick={() => { setMap(foundMap); setPhase('map'); }}>
              Back to the map
            </button>
          ) : null}
          <button type="button" className="qs-payoff__again" onClick={reset}>
            Map a different story
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'map' && map) {
    const imagined = !!map.fabricated;
    const cast = map.characters || [];
    const names = {};
    cast.forEach((c) => { names[c.id] = c.name; });

    if (!imagined && !map.story_detected) {
      // The honest empty map — and the door out of the dead end.
      return (
        <div className="qs-page qs-page--narrow">
          <p className="qs-lead">I read it carefully — there’s no story to map here yet.</p>
          {map.note ? <p className="qs-quiethint" style={{ marginBottom: 'var(--space-8)' }}>{map.note}</p> : null}
          <ImagineDoor prominent busy={imagining} onImagine={(mode, nudge) => imagine(mode, nudge, false)} />
          {error ? <p className="qs-note"><QSIcoSmap name="circle-alert" size={16} />{error}</p> : null}
          <div className="qs-actionrow qs-actionrow--center">
            <button type="button" className="qs-payoff__again" onClick={reset}>
              <QSIcoSmap name="rotate-ccw" size={13} />Try a different piece
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="qs-page qs-page--narrow">
        <p className="qs-lead">
          {imagined ? 'A cast, imagined for you. Take what sparks; leave the rest.' : 'Your cast, exactly as written.'}
        </p>

        {imagined ? (
          <div className="qs-imagined-banner">
            <QSStamp tone="ember">Imagined</QSStamp>
            <span>Everything below was invented on request — it is not a reading of your text.</span>
          </div>
        ) : null}

        <div className="qs-mapline">
          <QSIcoSmap name="search" size={16} />
          <span className="qs-mapline__count">
            {String(cast.length).padStart(2, '0')} {cast.length === 1 ? 'character' : 'characters'}
            {imagined ? ' imagined' : ' found'}
          </span>
          {!imagined ? <QSStamp tone="paper">{`confidence · ${map.confidence || 'low'}`}</QSStamp> : null}
          <span style={{ flex: 1 }}></span>
          <button type="button" className="qs-copy" onClick={() => downloadMap(map)}>
            <QSIcoSmap name="file-text" size={13} />Save map
          </button>
          <CopyButton text={notionText(map)} label="Copy for Notion" />
        </div>
        {map.note ? <p className="qs-quiethint" style={{ margin: '0 0 var(--space-6) 0' }}>{map.note}</p> : null}

        <div className="qs-board">
          {cast.map((c, idx) => (
            <div className="qs-deal" key={c.id || idx} style={{ animationDelay: (idx * 60) + 'ms' }}>
              <CharacterCard ch={c} names={names} imagined={imagined} />
            </div>
          ))}
        </div>

        {error ? <p className="qs-note"><QSIcoSmap name="circle-alert" size={16} />{error}</p> : null}

        {imagined ? (
          <div className="qs-actionrow qs-actionrow--center" style={{ marginTop: 'var(--space-12)' }}>
            <button type="button" className="qs-payoff__again" disabled={imagining}
              onClick={() => imagine((lastImagine && lastImagine.mode) || 'seed', (lastImagine && lastImagine.nudge) || '', true)}>
              <QSIcoSmap name="rotate-ccw" size={13} />{imagining ? 'Imagining…' : 'Imagine a different take'}
            </button>
            {foundMap && foundMap.story_detected ? (
              <button type="button" className="qs-payoff__again" onClick={() => { setMap(foundMap); setPhase('map'); }}>
                Back to what’s on the page
              </button>
            ) : null}
            <button type="button" className="qs-payoff__again" onClick={reset}>
              Map a different story
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 'var(--space-12)' }}>
            <ImagineDoor busy={imagining} onImagine={(mode, nudge) => imagine(mode, nudge, false)} />
            <div className="qs-actionrow qs-actionrow--center">
              <button type="button" className="qs-payoff__again" onClick={reset}>
                <QSIcoSmap name="rotate-ccw" size={13} />Map a different story
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="qs-page qs-page--narrow">
      <p className="qs-lead">Who’s in your story? I’ll map the people and how they connect — only what’s on the page.</p>

      <div className="qs-step">
        <QSSmapTA
          value={text}
          onChange={setText}
          placeholder="Paste your story here…"
          minHeight={220}
          ariaLabel="Your story"
        />
        <div className="qs-or"><span>or</span></div>

        <input ref={fileRef} type="file" accept=".docx,.rtf,.txt" onChange={onPick} style={QS_SM_HIDDEN_INPUT} tabIndex={-1} />
        {file ? (
          <div className="qs-file qs-drop--filled">
            <span className="qs-file__name"><QSIcoSmap name="file-text" size={18} className="qs-file__ico" />{file.name}</span>
            <button type="button" className="qs-payoff__again" onClick={clearFile}>Remove</button>
          </div>
        ) : (
          <button type="button" className="qs-drop" onClick={() => fileRef.current && fileRef.current.click()}>
            <span className="qs-drop__ico"><QSIcoSmap name="file-text" size={28} /></span>
            <p className="qs-drop__line">Bring me your story.</p>
            <p className="qs-drop__hint">Word, RTF, or text · up to 3,000 words</p>
          </button>
        )}
        {!file && text ? (
          <div className="qs-meter">
            <span><strong>{words.toLocaleString()}</strong> words</span>
            <span aria-hidden="true">·</span>
            <span>≈ <strong>{Math.max(1, Math.round(words / 230))}</strong> min read</span>
            <span aria-hidden="true">·</span>
            <span>draft kept</span>
          </div>
        ) : null}
        {error ? <p className="qs-note"><QSIcoSmap name="circle-alert" size={16} />{error}</p> : null}
      </div>

      <div className="qs-actionrow">
        <QSBtnSmap size="lg" icon="search" onClick={mapStory}>Map my story</QSBtnSmap>
        <input ref={mapFileRef} type="file" accept=".json,application/json" onChange={onPickMap} style={QS_SM_HIDDEN_INPUT} tabIndex={-1} />
        <button type="button" className="qs-payoff__again" onClick={() => mapFileRef.current && mapFileRef.current.click()}>
          Load a saved map
        </button>
      </div>
      <p className="qs-quiethint" style={{ marginTop: 'var(--space-4)' }}>
        The map is a mirror — it reflects what you wrote and never invents.
        If there’s nothing to reflect yet, I’ll offer you the Imagine door.
      </p>
    </div>
  );
}

window.StoryMapPage = StoryMapPage;
