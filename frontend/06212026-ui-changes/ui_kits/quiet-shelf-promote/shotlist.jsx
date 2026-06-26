// Shot list: sticky SummaryBar + the manuscript-card board.
const { Button, ManuscriptCard, ProgressBar } = window.QuietFightClubDesignSystem_fae847;
const Eng = window.ShelfEngine;

const MOOD_TONES = { tense: 'oxblood', wistful: 'neutral', quiet: 'neutral', resolute: 'ember', reflective: 'neutral', hopeful: 'ember' };

function SummaryBar({ result, foundCount, onCopy, copied, onNewScript, confirmingNew, onConfirmNew, onCancelNew }) {
  const total = result.segments.length;
  return (
    <div className="qs-summary" data-comment-anchor="summary-bar">
      <div className="qs-summary__inner">
        <div className="qs-summary__facts">
          <span className="qs-summary__title">{result.video_title_suggestion}</span>
          <span className="qs-summary__meta">
            {total} segments · ≈{Eng.fmtTime(result.estimated_runtime_seconds)} runtime
          </span>
        </div>
        <div className="qs-summary__progress">
          <ProgressBar value={total ? foundCount / total : 0} label={`${foundCount} of ${total} segments clipped`} />
        </div>
        <div className="qs-summary__actions">
          {confirmingNew ? (
            <span className="qs-summary__confirm">
              <span className="qs-summary__confirmtext">Clear this map?</span>
              <Button variant="danger" size="sm" onClick={onConfirmNew}>Clear it</Button>
              <Button variant="ghost" size="sm" onClick={onCancelNew}>Keep it</Button>
            </span>
          ) : (
            <span className="qs-summary__btns">
              <Button variant="secondary" size="sm" icon={copied ? 'check' : 'copy'} onClick={onCopy}>
                {copied ? 'Copied' : 'Copy for Notion'}
              </Button>
              <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={onNewScript}>
                Start a new script
              </Button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ShotList({ result, found, onFoundChange, onMapRest, dealt }) {
  return (
    <div className="qs-board" data-screen-label="Shot List">
      <div className="qs-board__cards">
        {result.segments.map((seg, i) => (
          <ManuscriptCard
            key={seg.id}
            index={seg.id}
            startTime={seg.start_time}
            endTime={seg.end_time}
            excerpt={seg.script_text}
            mood={seg.mood}
            moodTone={MOOD_TONES[seg.mood] || 'neutral'}
            clipDurationSeconds={seg.clip_duration_seconds}
            terms={seg.search_terms}
            found={!!found[seg.id]}
            onFoundChange={(v) => onFoundChange(seg.id, v)}
            className={dealt ? 'qs-deal' : ''}
            style={dealt ? { animationDelay: Math.min(i, 12) * 60 + 'ms' } : null}
          />
        ))}
      </div>
      {result.partial ? (
        <div className="qs-board__partial">
          <p>The map came back unfinished — this is everything that arrived.</p>
          <Button variant="secondary" icon="arrow-right" onClick={onMapRest}>Map the rest</Button>
        </div>
      ) : null}
    </div>
  );
}

function buildMarkdown(result, found) {
  const lines = [
    '# ' + result.video_title_suggestion,
    '',
    `Total: ${result.segments.length} segments · ≈${Eng.fmtTime(result.estimated_runtime_seconds)} runtime`,
    '',
    '| # | Time | Script | Mood | Clip | Search terms | Found |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  result.segments.forEach((s) => {
    lines.push(
      `| ${String(s.id).padStart(2, '0')} | ${s.start_time}–${s.end_time} | ${s.script_text.replace(/\|/g, '\\|')} | ${s.mood} | ~${s.clip_duration_seconds}s | ${s.search_terms.join(' · ')} | ${found[s.id] ? '✓' : ''} |`
    );
  });
  return lines.join('\n');
}

Object.assign(window, { SummaryBar, ShotList, buildMarkdown, MOOD_TONES });
