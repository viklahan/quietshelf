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

/* ---- Corkboard view: the map as a pinboard. Layout starts deterministic
   (importance-weighted: lead at center, others around); once the writer
   drags a card the positions are theirs — saved into the map object, so
   they survive refresh and travel inside the downloaded map file. Threads
   come straight from the extracted relationships; the label ON the line is
   the relationship type. Nothing here invents — it renders what was found. */
const QS_CORK_W = 1200;
const QS_CORK_H = 680;
const QS_CARD_W = 190;

function qsCharId(c, i) { return c.id || ('c' + i); }

function computeCorkLayout(cast) {
  const cx = QS_CORK_W / 2 - QS_CARD_W / 2;
  const cy = QS_CORK_H / 2 - 80;
  const sorted = cast.map((c, i) => ({ c, i })).sort((a, b) => (b.c.importance || 3) - (a.c.importance || 3));
  const pos = {};
  sorted.forEach((entry, rank) => {
    const id = qsCharId(entry.c, entry.i);
    if (rank === 0) { pos[id] = { x: cx, y: cy }; return; }
    const others = Math.max(1, sorted.length - 1);
    const angle = ((rank - 1) / others) * Math.PI * 2 - Math.PI / 2;
    const jx = ((entry.i * 137) % 48) - 24;
    const jy = ((entry.i * 89) % 40) - 20;
    pos[id] = {
      x: Math.round(Math.max(8, Math.min(QS_CORK_W - QS_CARD_W - 8, cx + Math.cos(angle) * 420 + jx))),
      y: Math.round(Math.max(14, Math.min(QS_CORK_H - 160, cy + Math.sin(angle) * 215 + jy))),
    };
  });
  return pos;
}

/* relationship type → yarn color, from the app's own ink/ember palette */
function qsRelStroke(label) {
  const t = (label || '').toLowerCase();
  if (/(rival|enem|antagon|conflict|betray|oppos)/.test(t)) return '#7e2b23';
  if (/(love|romance|spouse|partner|married|crush)/.test(t)) return '#d9a458';
  if (/(family|father|mother|parent|sibling|brother|sister|son|daughter|cousin|grand)/.test(t)) return '#c5893b';
  return '#a89b82';
}

/* one thread per relationship pair+type, even when both sides declare it */
function buildThreads(cast) {
  const idset = {};
  cast.forEach((c, i) => { idset[qsCharId(c, i)] = true; });
  const seen = {};
  const out = [];
  cast.forEach((c, i) => {
    const a = qsCharId(c, i);
    (c.relationships || []).forEach((r) => {
      const b = r.with;
      if (!b || !idset[b] || b === a) return;
      const key = (a < b ? a + '|' + b : b + '|' + a) + '|' + (r.type || 'other');
      if (seen[key]) return;
      seen[key] = true;
      out.push({ key, a, b, label: r.type || 'connected' });
    });
  });
  return out;
}

function CorkBoard({ cast, positions, onChange, onCommit, selectedId, onSelect }) {
  const canvasRef = React.useRef(null);
  const frameRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const threads = buildThreads(cast);
  // Fit the whole 1200x680 board inside whatever width the page gives us —
  // no scrollbars, the full picture at once. Drag math divides by the same
  // scale so the card tracks the cursor exactly.
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    function fit() {
      if (!frameRef.current) return;
      const w = frameRef.current.clientWidth;
      setScale(Math.min(1, w / QS_CORK_W));
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  function down(id, e) {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const p = positions[id] || { x: 0, y: 0 };
    dragRef.current = { id, dx: (e.clientX - rect.left) / scale - p.x, dy: (e.clientY - rect.top) / scale - p.y, moved: false };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
  }

  function move(e) {
    const d = dragRef.current;
    if (!d || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(Math.max(4, Math.min(QS_CORK_W - QS_CARD_W - 4, (e.clientX - rect.left) / scale - d.dx)));
    const y = Math.round(Math.max(10, Math.min(QS_CORK_H - 100, (e.clientY - rect.top) / scale - d.dy)));
    const cur = positions[d.id];
    if (!d.moved && cur && Math.abs(x - cur.x) < 4 && Math.abs(y - cur.y) < 4) return;
    d.moved = true;
    onChange({ ...positions, [d.id]: { x, y } });
  }

  function up() {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (d.moved) onCommit(); else onSelect(d.id);
  }

  return (
    <div className="qs-cork" ref={frameRef} style={{ height: Math.round(QS_CORK_H * scale) + 'px' }}>
      <div
        ref={canvasRef}
        className="qs-cork__canvas"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <svg className="qs-cork__svg" aria-hidden="true">
          {threads.map((t) => {
            const pa = positions[t.a];
            const pb = positions[t.b];
            if (!pa || !pb) return null;
            const x1 = pa.x + QS_CARD_W / 2, y1 = pa.y + 4;
            const x2 = pb.x + QS_CARD_W / 2, y2 = pb.y + 4;
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + 30;
            const lx = 0.25 * x1 + 0.5 * mx + 0.25 * x2;
            const ly = 0.25 * y1 + 0.5 * my + 0.25 * y2;
            const col = qsRelStroke(t.label);
            return (
              <g key={t.key}>
                <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="3" strokeLinecap="round" transform="translate(1,2)" />
                <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" />
                <foreignObject x={lx - 60} y={ly - 11} width="120" height="22" style={{ overflow: 'visible' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span className="qs-corklabel" style={{ borderColor: col }}>{t.label}</span>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
        {cast.map((c, i) => {
          const id = qsCharId(c, i);
          const p = positions[id];
          if (!p) return null;
          const tex = c.texture || {};
          const texLine = QS_TEXTURE_LABELS.map(([k]) => tex[k]).find(Boolean);
          return (
            <div
              key={id}
              className={`qs-pincard${selectedId === id ? ' qs-pincard--sel' : ''}`}
              style={{ left: p.x + 'px', top: p.y + 'px' }}
              onPointerDown={(e) => down(id, e)}
              onPointerMove={move}
              onPointerUp={up}
              role="button"
              tabIndex={0}
              aria-label={`${c.name}, ${c.role || 'supporting'}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id); } }}
            >
              <span className="qs-pincard__pin" aria-hidden="true"></span>
              <h4 className="qs-pincard__name">{c.name}</h4>
              <div className="qs-pincard__meta">
                <QSStamp tone={roleTone(c.role)}>{c.role || 'supporting'}</QSStamp>
                <Importance n={c.importance} />
              </div>
              {texLine ? <p className="qs-pincard__tex">{texLine}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
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

/* Edit a character — the writer's hand on the map. Saving writes into the
   map itself: the corkboard card updates, localStorage keeps it, and the
   downloaded map file carries it. This isn't the Imagine door — nothing is
   invented; the writer is correcting their own reflection. */
function EditCharacterPanel({ ch, onSave, onCancel }) {
  const [name, setName] = React.useState(ch.name || '');
  const [role, setRole] = React.useState(ch.role || '');
  const [importance, setImportance] = React.useState(Math.max(1, Math.min(5, ch.importance || 3)));
  const [personality, setPersonality] = React.useState(ch.personality || '');
  const [arc, setArc] = React.useState(ch.arc || '');
  const [texture, setTexture] = React.useState(() => ({ ...(ch.texture || {}) }));

  function save() {
    const cleanTex = {};
    Object.keys(texture).forEach((k) => {
      const v = (texture[k] || '').trim();
      if (v) cleanTex[k] = v;
    });
    onSave({
      name: name.trim() || ch.name,
      role: role.trim() || ch.role,
      importance,
      personality: personality.trim(),
      arc: arc.trim(),
      texture: cleanTex,
    });
  }

  const labelStyle = { display: 'block', margin: '0 0 4px', fontSize: 'var(--fs-small)', color: 'var(--text-faint)' };
  const rowStyle = { marginTop: 'var(--space-4)' };

  return (
    <section className="qs-char" style={{ marginTop: 'var(--space-6)' }}>
      <div className="qs-char__head">
        <h3 className="qs-char__name">Editing</h3>
        <span className="qs-char__meta"><QSStamp tone="paper">yours to change</QSStamp></span>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle} htmlFor="qs-edit-name">Name</label>
        <input id="qs-edit-name" className="qs-input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle} htmlFor="qs-edit-role">Role</label>
        <input id="qs-edit-role" className="qs-input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="protagonist, rival, mentor…" />
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Importance</span>
        <div className="qs-pills">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" className={`qs-pill${importance === n ? ' qs-pill--on' : ''}`}
              onClick={() => setImportance(n)} aria-pressed={importance === n}>{n}</button>
          ))}
        </div>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle} htmlFor="qs-edit-personality">Personality</label>
        <textarea id="qs-edit-personality" className="qs-input" style={{ minHeight: '72px', resize: 'vertical' }}
          value={personality} onChange={(e) => setPersonality(e.target.value)} />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle} htmlFor="qs-edit-arc">Arc</label>
        <textarea id="qs-edit-arc" className="qs-input" style={{ minHeight: '56px', resize: 'vertical' }}
          value={arc} onChange={(e) => setArc(e.target.value)} />
      </div>

      {QS_TEXTURE_LABELS.map(([k, label]) => (
        <div style={rowStyle} key={k}>
          <label style={labelStyle} htmlFor={`qs-edit-tex-${k}`}>{label}</label>
          <input id={`qs-edit-tex-${k}`} className="qs-input" value={texture[k] || ''}
            onChange={(e) => setTexture((t) => ({ ...t, [k]: e.target.value }))} />
        </div>
      ))}

      <div className="qs-actionrow">
        <QSBtnSmap size="lg" icon="feather" onClick={save}>Save changes</QSBtnSmap>
        <button type="button" className="qs-payoff__again" onClick={onCancel}>Cancel</button>
      </div>
      <p className="qs-quiethint" style={{ marginTop: 'var(--space-3)' }}>
        Your edits become part of the map — they save with it and travel in the downloaded file.
        Relationship lines aren't editable yet.
      </p>
    </section>
  );
}

function StoryMapPage() {
  const { Becoming, CopyButton, useKeptDraft, saveLastMap, Tooltip } = window;

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
  const [view, setView] = React.useState('board'); // board | list
  const [selectedId, setSelectedId] = React.useState(null); // corkboard selection
  const [editingChar, setEditingChar] = React.useState(false);
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
     grounding source for Blurb and Promote. Found-clip castings ride along
     so footage choices survive across sessions and machines. */
  function downloadMap(m) {
    let out = m;
    try {
      const castings = JSON.parse(localStorage.getItem('qs.promote.castings'));
      if (castings && Object.keys(castings).length) out = { ...m, castings };
    } catch (e) { /* no castings to carry */ }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
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
        if (m.castings && typeof m.castings === 'object' && !Array.isArray(m.castings)) {
          try { localStorage.setItem('qs.promote.castings', JSON.stringify(m.castings)); } catch (err) {}
        }
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

    /* The writer's hand: fold an edit into the map itself, keep foundMap in
       step (so "back to the page" doesn't silently revert their work), and
       persist — the corkboard re-renders from the same object. */
    const applyCharEdit = (id, patch) => {
      const nextChars = cast.map((c, i) => (qsCharId(c, i) === id ? { ...c, ...patch } : c));
      const next = { ...map, characters: nextChars };
      setMap(next);
      if (!next.fabricated && next.story_detected) setFoundMap(next);
      if (nextChars.length) saveLastMap(next);
      setEditingChar(false);
    };

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
          {!imagined ? <Tooltip text="Confidence is the engine's own read on how clear this story was to map — not a judgment of your writing. Each card below also shows dots for importance: more filled means more central to the story." /> : null}
          {!imagined ? <QSStamp tone="paper">{`confidence · ${map.confidence || 'low'}`}</QSStamp> : null}
          <span style={{ flex: 1 }}></span>
          <button type="button" className="qs-copy" onClick={() => downloadMap(map)}>
            <QSIcoSmap name="file-text" size={13} />Save map
          </button>
          <CopyButton text={notionText(map)} label="Copy for Notion" />
        </div>
        {map.note ? <p className="qs-quiethint" style={{ margin: '0 0 var(--space-6) 0' }}>{map.note}</p> : null}

        <div className="qs-pills" style={{ marginBottom: 'var(--space-4)' }} aria-label="Map view">
          <button type="button" className={`qs-pill${view === 'board' ? ' qs-pill--on' : ''}`}
            onClick={() => setView('board')} aria-pressed={view === 'board'}>Corkboard</button>
          <button type="button" className={`qs-pill${view === 'list' ? ' qs-pill--on' : ''}`}
            onClick={() => setView('list')} aria-pressed={view === 'list'}>List</button>
        </div>

        {view === 'board' ? (
          <>
            <CorkBoard
              cast={cast}
              positions={map.positions || computeCorkLayout(cast)}
              onChange={(p) => setMap((prev) => ({ ...prev, positions: p }))}
              onCommit={() => setMap((prev) => { if ((prev.characters || []).length) saveLastMap(prev); return prev; })}
              selectedId={selectedId}
              onSelect={(id) => { setEditingChar(false); setSelectedId((cur) => (cur === id ? null : id)); }}
            />
            <p className="qs-cork__hint">Drag a card to rearrange — your layout saves with the map. Click a card for the full profile.</p>
            {(() => {
              const sel = cast.find((c, i) => qsCharId(c, i) === selectedId);
              if (!sel) return null;
              if (editingChar) {
                return (
                  <EditCharacterPanel
                    key={selectedId}
                    ch={sel}
                    onSave={(patch) => applyCharEdit(selectedId, patch)}
                    onCancel={() => setEditingChar(false)}
                  />
                );
              }
              return (
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <CharacterCard ch={sel} names={names} imagined={imagined} />
                  <div className="qs-actionrow">
                    <button type="button" className="qs-payoff__again" onClick={() => setEditingChar(true)}>
                      Edit this character
                    </button>
                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          <div className="qs-board">
            {cast.map((c, idx) => (
              <div className="qs-deal" key={c.id || idx} style={{ animationDelay: (idx * 60) + 'ms' }}>
                <CharacterCard ch={c} names={names} imagined={imagined} />
              </div>
            ))}
          </div>
        )}

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
