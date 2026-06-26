// Screens: EmptyDesk (landing), Working (loading), EngineError.
const { Button, ScriptTextarea, Icon, ProgressBar } = window.QuietFightClubDesignSystem_fae847;
const E = window.ShelfEngine;

function Wordmark() {
  return (
    <header className="qs-page__header">
      <h1 className="qs-wordmark">Quiet Shelf</h1>
      <p className="qs-tagline">Turn your writing into a video plan.</p>
    </header>
  );
}

function EmptyDesk({ script, onScriptChange, onMap, onSample, error }) {
  const words = E.countWords(script);
  const runtime = E.fmtTime((words / E.WPM) * 60);
  return (
    <div className="qs-page" data-screen-label="Empty Desk">
      <Wordmark />
      <ScriptTextarea value={script} onChange={onScriptChange} minHeight={300} />
      <div className="qs-deskmeta">
        <span className="qs-deskmeta__counts">
          <Icon name="file-text" size={13} />
          {words.toLocaleString()} {words === 1 ? 'word' : 'words'} · ≈{runtime} narration
        </span>
        <button type="button" className="qs-textlink" onClick={onSample}>
          Try a sample script
        </button>
      </div>
      {error ? (
        <p className="qs-fieldnote" role="alert">
          <Icon name="circle-alert" size={14} />
          {error}
        </p>
      ) : null}
      <div className="qs-deskaction">
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
    <div className="qs-page qs-page--center" data-screen-label="Working">
      <Wordmark />
      <div className="qs-working" role="status">
        <p className="qs-working__line" key={lineIdx}>{WORKING_LINES[lineIdx]}</p>
        <div className="qs-working__bar">
          <ProgressBar value={progress} />
        </div>
      </div>
    </div>
  );
}

function EngineError({ onRetry, onBack }) {
  return (
    <div className="qs-page qs-page--center" data-screen-label="Engine Error">
      <Wordmark />
      <div className="qs-enginerror" role="alert">
        <Icon name="circle-alert" size={20} color="var(--danger-text)" />
        <p className="qs-enginerror__msg">The mapping engine didn't answer. Wait a moment and try again.</p>
        <div className="qs-enginerror__actions">
          <Button icon="rotate-ccw" onClick={onRetry}>Retry</Button>
          <Button variant="ghost" onClick={onBack}>Back to the script</Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Wordmark, EmptyDesk, Working, EngineError, WORKING_LINES });
