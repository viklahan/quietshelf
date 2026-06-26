// Screens: EmptyDesk (landing), Working (loading), EngineError.
const { Button, ScriptTextarea, Icon, ProgressBar } = window.QuietFightClubDesignSystem_fae847;
const E = window.QFCEngine;

function Wordmark() {
  return (
    <header className="qfc-page__header">
      <h1 className="qfc-wordmark">Quiet Fight Club</h1>
      <p className="qfc-tagline">Turn your script into a shot list.</p>
    </header>
  );
}

function EmptyDesk({ script, onScriptChange, onMap, onSample, error }) {
  const words = E.countWords(script);
  const runtime = E.fmtTime((words / E.WPM) * 60);
  return (
    <div className="qfc-page" data-screen-label="Empty Desk">
      <Wordmark />
      <ScriptTextarea value={script} onChange={onScriptChange} minHeight={300} />
      <div className="qfc-deskmeta">
        <span className="qfc-deskmeta__counts">
          <Icon name="file-text" size={13} />
          {words.toLocaleString()} {words === 1 ? 'word' : 'words'} · ≈{runtime} narration
        </span>
        <button type="button" className="qfc-textlink" onClick={onSample}>
          Try a sample script
        </button>
      </div>
      {error ? (
        <p className="qfc-fieldnote" role="alert">
          <Icon name="circle-alert" size={14} />
          {error}
        </p>
      ) : null}
      <div className="qfc-deskaction">
        <Button size="lg" icon="sparkles" onClick={onMap}>Map My Visuals</Button>
      </div>
    </div>
  );
}

const WORKING_LINES = [
  'Reading your script…',
  'Breaking it into scenes…',
  'Finding your footage…',
];

function Working() {
  const [lineIdx, setLineIdx] = React.useState(0);
  const [progress, setProgress] = React.useState(0.06);
  React.useEffect(() => {
    const lineTimer = setInterval(() => {
      setLineIdx((i) => Math.min(i + 1, WORKING_LINES.length - 1));
    }, 1300);
    const progTimer = setInterval(() => {
      setProgress((p) => Math.min(0.92, p + (0.92 - p) * 0.18));
    }, 220);
    return () => { clearInterval(lineTimer); clearInterval(progTimer); };
  }, []);
  return (
    <div className="qfc-page qfc-page--center" data-screen-label="Working">
      <Wordmark />
      <div className="qfc-working" role="status">
        <p className="qfc-working__line" key={lineIdx}>{WORKING_LINES[lineIdx]}</p>
        <div className="qfc-working__bar">
          <ProgressBar value={progress} />
        </div>
      </div>
    </div>
  );
}

function EngineError({ onRetry, onBack }) {
  return (
    <div className="qfc-page qfc-page--center" data-screen-label="Engine Error">
      <Wordmark />
      <div className="qfc-enginerror" role="alert">
        <Icon name="circle-alert" size={20} color="var(--danger-text)" />
        <p className="qfc-enginerror__msg">The mapping engine didn't answer. Wait a moment and try again.</p>
        <div className="qfc-enginerror__actions">
          <Button icon="rotate-ccw" onClick={onRetry}>Retry</Button>
          <Button variant="ghost" onClick={onBack}>Back to the script</Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Wordmark, EmptyDesk, Working, EngineError, WORKING_LINES });
