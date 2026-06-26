// App — owns the state machine: empty → working → results (or error).
// All state in memory. No storage, no accounts, no nav.

function App() {
  const [phase, setPhase] = React.useState('empty'); // empty | working | results | error
  const [script, setScript] = React.useState('');
  const [fieldError, setFieldError] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [found, setFound] = React.useState({});
  const [copied, setCopied] = React.useState(false);
  const [confirmingNew, setConfirmingNew] = React.useState(false);
  const [dealt, setDealt] = React.useState(false);
  const timers = React.useRef([]);

  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  function startMapping() {
    const words = window.QFCEngine.countWords(script);
    if (words === 0) {
      setFieldError("There's no script here yet. Paste it in and we'll get to work.");
      return;
    }
    if (words < 100) {
      setFieldError('This looks like a fragment. Paste the full script for a proper shot list.');
      return;
    }
    setFieldError(null);
    setPhase('working');
    later(() => {
      // Demo hook: a script containing [fail] exercises the engine-error state.
      if (/\[fail\]/i.test(script)) { setPhase('error'); return; }
      const r = window.QFCEngine.map(script);
      setResult(r);
      setFound({});
      setDealt(true);
      setPhase('results');
      later(() => setDealt(false), 2400);
    }, 3400);
  }

  function copyForNotion() {
    const md = window.buildMarkdown(result, found);
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = md;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(md).catch(fallback);
    } else {
      fallback();
    }
    setCopied(true);
    later(() => setCopied(false), 2000);
  }

  function resetAll() {
    setScript('');
    setResult(null);
    setFound({});
    setConfirmingNew(false);
    setFieldError(null);
    setPhase('empty');
  }

  if (phase === 'working') return <Working />;

  if (phase === 'error') {
    return (
      <EngineError
        onRetry={startMapping}
        onBack={() => setPhase('empty')}
      />
    );
  }

  if (phase === 'results' && result) {
    const foundCount = result.segments.filter((s) => found[s.id]).length;
    return (
      <div className="qfc-results" data-screen-label="Shot List">
        <SummaryBar
          result={result}
          foundCount={foundCount}
          onCopy={copyForNotion}
          copied={copied}
          onNewScript={() => setConfirmingNew(true)}
          confirmingNew={confirmingNew}
          onConfirmNew={resetAll}
          onCancelNew={() => setConfirmingNew(false)}
        />
        <ShotList
          result={result}
          found={found}
          onFoundChange={(id, v) => setFound((f) => ({ ...f, [id]: v }))}
          onMapRest={() => {}}
          dealt={dealt}
        />
      </div>
    );
  }

  return (
    <EmptyDesk
      script={script}
      onScriptChange={(v) => { setScript(v); if (fieldError) setFieldError(null); }}
      onMap={startMapping}
      onSample={() => { setScript(window.QFCEngine.SAMPLE_SCRIPT); setFieldError(null); }}
      error={fieldError}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
