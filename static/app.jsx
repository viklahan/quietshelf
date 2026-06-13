// App — owns the state machine: empty → working → results (or error).
// All state in memory. No storage, no accounts, no nav.

function App() {
  const [phase, setPhase] = React.useState('empty'); // empty | working | results | error
  const [script, setScript] = React.useState('');
  const [fieldError, setFieldError] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [found, setFound] = React.useState({});
  const [copied, setCopied] = React.useState(false);
  const [confirmingNew, setConfirmingNew] = React.useState(false);
  const [dealt, setDealt] = React.useState(false);
  const timers = React.useRef([]);
  const abortRef = React.useRef(null);

  React.useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    if (abortRef.current) abortRef.current.abort();
  }, []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  function _errorMessageFor(status, data) {
    if (status === 429) return "The free AI tier needs a breather. Try again in a minute.";
    if (status === 504) return "The mapping engine took too long. Try a shorter script or try again.";
    if (data && data.error === 'mapping_failed') return "The mapping engine returned an unreadable result. Try again.";
    return "The mapping engine didn't answer. Wait a moment and try again.";
  }

  async function startMapping() {
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
    setErrorMessage(null);
    setPhase('working');

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const resp = await fetch('/api/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
        signal: abortRef.current.signal,
      });

      let data = null;
      try { data = await resp.json(); } catch (_) {}

      if (!resp.ok) {
        setErrorMessage(_errorMessageFor(resp.status, data));
        setPhase('error');
        return;
      }

      setResult(data);
      setFound({});
      setDealt(true);
      setPhase('results');
      later(() => setDealt(false), 2400);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setErrorMessage("Couldn't reach the mapping engine. Check your connection and try again.");
      setPhase('error');
    }
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
    setErrorMessage(null);
    setPhase('empty');
  }

  if (phase === 'working') return <Working />;

  if (phase === 'error') {
    return (
      <EngineError
        message={errorMessage}
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
