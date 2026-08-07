/* Quiet Shelf — Scout.
   Harvests what real people are asking right now (Reddit rising + weekly top,
   via the free JSON API — no scraping, no keys) and distills it into research
   MATERIAL. Synthesis is bring-your-own-prompt: the writer's editorial prompt
   lives in the textbox and their browser, never in this codebase. */

// Reddit sources are HIDDEN until our API access request is approved
// (Responsible Builder Policy). Flip this flag when the ticket clears -
// everything underneath still works.
const QS_SCOUT_REDDIT_ENABLED = false;

// FastAPI validation errors send detail as an ARRAY of objects; plain errors
// send a string. Render both as humans, never as [object Object].
function qsDetailToText(detail) {
  if (!detail) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(function (e) { return (e && e.msg) ? e.msg : JSON.stringify(e); }).join('; ');
  }
  return JSON.stringify(detail);
}
const QS_SCOUT_DEFAULT_SOURCES = ['selfimprovement', 'DecidingToBeBetter', 'getdisciplined'];
const QS_SCOUT_MAX_SOURCES = 6;
const QS_SCOUT_LS_KEY = 'qs-scout-sources';
const QS_SCOUT_PROMPT_KEY = 'qs-scout-prompt';
const QS_SCOUT_SEEDS_KEY = 'qs-scout-seeds';

function scoutLoadSeeds() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(QS_SCOUT_SEEDS_KEY) || 'null');
    if (Array.isArray(raw)) return raw.slice(0, 4);
  } catch (e) {}
  return [];
}
function scoutSaveSeeds(list) {
  try { window.localStorage.setItem(QS_SCOUT_SEEDS_KEY, JSON.stringify(list)); } catch (e) {}
}

// A starter, not a doctrine: loads into the textbox where the writer owns and
// edits it. Their refined version lives in their browser, never in this code.
const QS_SCOUT_STARTER_PROMPT = [
  'You are an editorial researcher for a quiet, introspective video essay channel.',
  'Your job: find the CONTRADICTIONS people are living inside right now that this channel can investigate.',
  '',
  'A finding must have all five: (1) a lived contradiction, phrased X-yet-Y, not a topic;',
  '(2) a felt first-person sentence a viewer would recognize as their own 1am thought;',
  '(3) missing language - common experience, under-named; (4) 3-4 branching sub-questions',
  'that could sustain an essay; (5) convergence across at least two independent source types.',
  '',
  'Evidence rules: quote or closely paraphrase the MATERIAL, never invent statistics,',
  'and say "nothing this week" if the material clears no bars.',
  '',
  'Score each finding: evergreen depth /5 and current loudness /5 (quote the evidence of a spike).',
  '',
  'Output 4-6 findings, then THE ONE TO MAKE THIS WEEK with: 3 lowercase-calm titles,',
  '3 thumbnail hooks (2-6 words, ALL CAPS, declarative), and one opening-beat sentence.',
  'Voice: second person, calm. No self-help vocabulary.',
].join('\n');

function scoutLoadPrompt() {
  try { return window.localStorage.getItem(QS_SCOUT_PROMPT_KEY) || ''; } catch (e) { return ''; }
}
function scoutSavePrompt(v) {
  try { window.localStorage.setItem(QS_SCOUT_PROMPT_KEY, v); } catch (e) {}
}

function scoutLoadSources() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(QS_SCOUT_LS_KEY) || 'null');
    if (Array.isArray(raw) && raw.length) return raw.slice(0, QS_SCOUT_MAX_SOURCES);
  } catch (e) {}
  return QS_SCOUT_DEFAULT_SOURCES.slice();
}
function scoutSaveSources(list) {
  try { window.localStorage.setItem(QS_SCOUT_LS_KEY, JSON.stringify(list)); } catch (e) {}
}

function ScoutPage() {
  const DS = window.QuietFightClubDesignSystem_fae847 || {};
  const Icon = DS.Icon || function () { return null; };

  const [sources, setSources] = React.useState(scoutLoadSources);
  const [draft, setDraft] = React.useState('');
  const [seeds, setSeeds] = React.useState(scoutLoadSeeds);
  const [seedDraft, setSeedDraft] = React.useState('');

  function addSeed() {
    const s = seedDraft.trim();
    if (!s) return;
    if (seeds.length >= 4) { setError('Four seed phrases is the cap.'); return; }
    const next = seeds.concat([s]);
    setSeeds(next); scoutSaveSeeds(next); setSeedDraft(''); setError('');
  }
  function removeSeed(i) {
    const next = seeds.filter(function (_, j) { return j !== i; });
    setSeeds(next); scoutSaveSeeds(next);
  }
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState(null);   // {material, word_count, post_count, sources, errors}
  const [copied, setCopied] = React.useState(false);
  const [prompt, setPrompt] = React.useState(scoutLoadPrompt);
  const [synthBusy, setSynthBusy] = React.useState(false);
  const [synth, setSynth] = React.useState(null);      // {result, material_truncated}
  const [synthCopied, setSynthCopied] = React.useState(false);

  function updatePrompt(v) { setPrompt(v); scoutSavePrompt(v); }

  function synthesize() {
    if (!result || !prompt.trim() || synthBusy) return;
    setSynthBusy(true);
    setError('');
    setSynth(null);
    fetch('/api/scout/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material: result.material, prompt: prompt }),
    })
      .then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) throw new Error(qsDetailToText(d.detail) || ('Synthesis failed (' + r.status + ')'));
          return d;
        });
      })
      .then(function (d) { setSynth(d); })
      .catch(function (e) { setError(e.message || 'Synthesis failed.'); })
      .finally(function () { setSynthBusy(false); });
  }

  function copySynth() {
    if (!synth) return;
    navigator.clipboard.writeText(synth.result).then(function () {
      setSynthCopied(true);
      setTimeout(function () { setSynthCopied(false); }, 2000);
    });
  }
  function downloadSynth() {
    if (!synth) return;
    const blob = new Blob([synth.result], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scout-findings.md';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function addSource() {
    const name = draft.trim();
    if (!name) return;
    if (sources.length >= QS_SCOUT_MAX_SOURCES) {
      setError('Six sources is the cap - swap one out.');
      return;
    }
    const next = sources.concat([name]);
    setSources(next);
    scoutSaveSources(next);
    setDraft('');
    setError('');
  }
  function removeSource(i) {
    const next = sources.filter(function (_, j) { return j !== i; });
    setSources(next);
    scoutSaveSources(next);
  }

  function harvest() {
    const haveInput = seeds.length || (QS_SCOUT_REDDIT_ENABLED && sources.length);
    if (!haveInput || busy) return;
    setBusy(true);
    setError('');
    setCopied(false);
    fetch('/api/scout/harvest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sources: QS_SCOUT_REDDIT_ENABLED ? sources : [], seeds: seeds }),
    })
      .then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) throw new Error(qsDetailToText(d.detail) || ('Harvest failed (' + r.status + ')'));
          return d;
        });
      })
      .then(function (d) { setResult(d); })
      .catch(function (e) { setError(e.message || 'Harvest failed.'); })
      .finally(function () { setBusy(false); });
  }

  function copyMaterial() {
    if (!result) return;
    navigator.clipboard.writeText(result.material).then(function () {
      setCopied(true);
      setTimeout(function () { setCopied(false); }, 2000);
    });
  }
  function downloadMaterial() {
    if (!result) return;
    const blob = new Blob([result.material], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scout-material.md';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  return (
    <div className="qs-page">
      <p className="qs-lead">
        What are people actually asking right now? Scout pulls the rising and
        top conversations from your corners of the internet and distills them
        into research material.
      </p>

      {QS_SCOUT_REDDIT_ENABLED ? (
      <div>
      <div className="qs-thumbrow">
        <label className="qs-thumblabel">Sources</label>
        <div className="qs-groundrow" style={{ flexWrap: 'wrap' }}>
          {sources.map(function (s, i) {
            return (
              <span key={i} className="qs-pill qs-pill--on" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                r/{s.replace(/^.*r\//, '').replace(/\/+$/, '')}
                <button type="button" aria-label={'Remove ' + s} onClick={function () { removeSource(i); }}
                  style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex' }}>
                  <Icon name="x" size={12} />
                </button>
              </span>
            );
          })}
        </div>
      </div>
      <div className="qs-thumbrow">
        <label className="qs-thumblabel"></label>
        <input className="qs-input" style={{ maxWidth: '260px' }} value={draft}
          placeholder="add a subreddit"
          onChange={function (e) { setDraft(e.target.value); }}
          onKeyDown={function (e) { if (e.key === 'Enter') addSource(); }} />
        <button type="button" className="qs-payoff__again" onClick={addSource}>Add</button>
      </div>
      </div>
      ) : null}

      <div className="qs-thumbrow">
        <label className="qs-thumblabel">Seeds</label>
        <div className="qs-groundrow" style={{ flexWrap: 'wrap' }}>
          {seeds.map(function (s, i) {
            return (
              <span key={i} className="qs-pill qs-pill--on" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {s}
                <button type="button" aria-label={'Remove ' + s} onClick={function () { removeSeed(i); }}
                  style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex' }}>
                  <Icon name="x" size={12} />
                </button>
              </span>
            );
          })}
          <input className="qs-input" style={{ maxWidth: '220px' }} value={seedDraft}
            placeholder={seeds.length ? 'add another' : 'e.g. feeling stuck'}
            onChange={function (e) { setSeedDraft(e.target.value); }}
            onKeyDown={function (e) { if (e.key === 'Enter') addSeed(); }} />
          <button type="button" className="qs-payoff__again" onClick={addSeed}>Add</button>
        </div>
      </div>
      <p className="qs-quiethint" style={{ margin: '0 0 var(--space-4)' }}>
        Seed phrases pull live autocomplete from Google, YouTube, Bing, Yahoo, and Yandex — what people are typing, not just posting.
      </p>

      <div className="qs-actionrow" style={{ justifyContent: 'flex-start', gap: 'var(--space-3)' }}>
        <button type="button" className="qs-payoff__again" onClick={harvest} disabled={busy || !(seeds.length || (QS_SCOUT_REDDIT_ENABLED && sources.length))}>
          <Icon name="search" size={13} />{busy ? 'Harvesting\u2026' : 'Harvest this week'}
        </button>
      </div>

      {error ? <p className="qs-note"><Icon name="circle-alert" size={16} /><span>{error}</span></p> : null}

      {result ? (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <p className="qs-quiethint">
            {result.post_count ? result.post_count + ' conversations · ' : ''}{result.suggestion_count ? result.suggestion_count + ' search suggestions · ' : ''}{result.word_count} words
            {result.errors && result.errors.length ? ' \u00b7 some sources failed: ' + result.errors.join(', ') : ''}
          </p>
          <div className="qs-actionrow" style={{ justifyContent: 'flex-start', gap: 'var(--space-3)', margin: 'var(--space-3) 0' }}>
            <button type="button" className="qs-payoff__again" onClick={copyMaterial}>
              <Icon name="copy" size={13} />{copied ? 'Copied' : 'Copy material'}
            </button>
            <button type="button" className="qs-payoff__again" onClick={downloadMaterial}>
              <Icon name="download" size={13} />Download .md
            </button>
          </div>
          <div className="qs-thumbrow" style={{ alignItems: 'flex-start', marginTop: 'var(--space-5)' }}>
            <label className="qs-thumblabel" style={{ paddingTop: '10px' }}>Prompt</label>
            <div style={{ flex: 1, minWidth: 0 }}>
              <textarea className="qs-input qs-scout__prompt" rows={7} value={prompt}
                placeholder="Paste your editorial research prompt here. It stays in your browser."
                onChange={function (e) { updatePrompt(e.target.value); }} />
              {!prompt.trim() ? (
                <button type="button" className="qs-payoff__again" style={{ marginTop: 'var(--space-2)' }}
                  onClick={function () { updatePrompt(QS_SCOUT_STARTER_PROMPT); }}>
                  <Icon name="sparkles" size={13} />Load a starter prompt
                </button>
              ) : null}
            </div>
          </div>
          <div className="qs-actionrow" style={{ justifyContent: 'flex-start', gap: 'var(--space-3)' }}>
            <button type="button" className="qs-payoff__again" onClick={synthesize}
              disabled={synthBusy || !prompt.trim()}>
              <Icon name="feather" size={13} />{synthBusy ? 'Thinking\u2026' : 'Find this week\u2019s questions'}
            </button>
          </div>
          {synth ? (
            <div style={{ marginTop: 'var(--space-5)' }}>
              {synth.material_truncated ? (
                <p className="qs-quiethint">Material was trimmed to fit the model — the loudest conversations made the cut.</p>
              ) : null}
              <div className="qs-actionrow" style={{ justifyContent: 'flex-start', gap: 'var(--space-3)', margin: 'var(--space-2) 0' }}>
                <button type="button" className="qs-payoff__again" onClick={copySynth}>
                  <Icon name="copy" size={13} />{synthCopied ? 'Copied' : 'Copy findings'}
                </button>
                <button type="button" className="qs-payoff__again" onClick={downloadSynth}>
                  <Icon name="download" size={13} />Download .md
                </button>
              </div>
              <pre className="qs-scout__material qs-scout__findings">{synth.result}</pre>
            </div>
          ) : null}
          <details style={{ marginTop: 'var(--space-5)' }}>
            <summary className="qs-quiethint" style={{ cursor: 'pointer' }}>Raw material ({result.word_count} words)</summary>
            <pre className="qs-scout__material">{result.material}</pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}

window.ScoutPage = ScoutPage;
