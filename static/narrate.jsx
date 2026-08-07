/* Quiet Shelf — Narrate.
   Turns a mapped piece (≤1000 words) into spoken narration using Kokoro-82M
   running ENTIRELY in the browser via kokoro-js. No server, no API key, no
   quota: the model (~86MB, quantized) downloads once from the CDN/HF hub and
   is cached by the browser thereafter. Generates per-segment audio so the
   shot list gains REAL clip durations, plus a stitched full track. */

const QS_NARRATE_MAX = 1000;          // words — narration is for final copies
const QS_KOKORO_CDN = 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm';
const QS_KOKORO_MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';

const QS_NARRATE_VOICES = [
  { id: 'am_michael', label: 'Michael — calm male' },
  { id: 'af_heart',   label: 'Heart — warm female' },
  { id: 'bf_emma',    label: 'Emma — British female' },
];

// Float32 PCM -> 16-bit WAV blob. Hand-rolled so we depend on nothing.
function floatToWavBlob(float32, sampleRate) {
  const len = float32.length;
  const buf = new ArrayBuffer(44 + len * 2);
  const dv = new DataView(buf);
  function wstr(off, s) { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); }
  wstr(0, 'RIFF'); dv.setUint32(4, 36 + len * 2, true); wstr(8, 'WAVE');
  wstr(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true); dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  wstr(36, 'data'); dv.setUint32(40, len * 2, true);
  let off = 44;
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    dv.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    off += 2;
  }
  return new Blob([buf], { type: 'audio/wav' });
}

// The TTS engine runs in a WEB WORKER: ONNX inference on the main thread
// freezes or OOM-crashes the tab. The worker is built from this string so
// in-browser Babel never processes it; it uses native module import.
const QS_NARRATE_WORKER_SRC = [
  "let tts = null;",
  "self.onmessage = async (e) => {",
  "  const msg = e.data;",
  "  try {",
  "    if (msg.type === 'load') {",
  "      const mod = await import('" + QS_KOKORO_CDN + "');",
  "      const opts = { progress_callback: (p) => {",
  "        if (p && p.status === 'progress' && p.total) {",
  "          self.postMessage({ type: 'progress', pct: Math.round((p.loaded / p.total) * 100) });",
  "        }",
  "      } };",
  "      const attempts = [",
  "        { device: 'webgpu', dtype: 'fp32' },",
  "        { dtype: 'q8' },",
  "      ];",
  "      let ready = null, lastErr = null;",
  "      for (const a of attempts) {",
  "        try { tts = await mod.KokoroTTS.from_pretrained('" + QS_KOKORO_MODEL + "', Object.assign({}, a, opts)); ready = a; break; }",
  "        catch (err) { lastErr = err; }",
  "      }",
  "      if (!ready) throw lastErr;",
  "      self.postMessage({ type: 'ready', device: ready.device || 'wasm', dtype: ready.dtype });",
  "    } else if (msg.type === 'generate') {",
  "      const audio = await tts.generate(msg.text, { voice: msg.voice });",
  "      const data = audio.audio;",
  "      let peak = 0;",
  "      for (let i = 0; i < data.length; i += 50) { const v = Math.abs(data[i]); if (v > peak) peak = v; }",
  "      if (!data.length || !isFinite(peak) || peak < 1e-5) {",
  "        throw new Error('The engine produced silent audio (peak=' + peak + '). Reload the page to retry; if it persists, your GPU driver may not support this model.');",
  "      }",
  "      self.postMessage({ type: 'audio', id: msg.id, sampleRate: audio.sampling_rate || 24000, audio: data, peak: peak }, [data.buffer]);",
  "    }",
  "  } catch (err) {",
  "    self.postMessage({ type: 'error', id: msg.id, message: (err && err.message) || String(err) });",
  "  }",
  "};",
].join('\n');

function qsNarrateCountWords(t) {
  return (t || '').trim().split(/\s+/).filter(Boolean).length;
}

function NarrateStudio(props) {
  const DS = window.QuietFightClubDesignSystem_fae847 || {};
  const Icon = DS.Icon || function () { return null; };
  const segments = props.segments || [];
  const onClose = props.onClose || function () {};
  const onDurations = props.onDurations || null;   // (seconds[]) -> void

  const totalWords = React.useMemo(function () {
    return segments.reduce(function (n, s) { return n + qsNarrateCountWords(s.excerpt); }, 0);
  }, [segments]);

  const [voice, setVoice] = React.useState(QS_NARRATE_VOICES[0].id);
  const [phase, setPhase] = React.useState('idle');   // idle | loading | generating | done | error
  const [progress, setProgress] = React.useState('');
  const [error, setError] = React.useState('');
  const [clips, setClips] = React.useState([]);       // [{url, seconds, index}]
  const [fullUrl, setFullUrl] = React.useState('');
  const [engine, setEngine] = React.useState('');
  const workerRef = React.useRef(null);
  const cancelRef = React.useRef(false);
  const audioElsRef = React.useRef([]);

  // Only one player at a time: when any audio starts, pause the rest.
  function soloPlay(e) {
    audioElsRef.current.forEach(function (el) {
      if (el && el !== e.target) el.pause();
    });
  }
  function regAudio(i) {
    return function (el) { audioElsRef.current[i] = el; };
  }

  React.useEffect(function () {
    return function () {
      clips.forEach(function (c) { URL.revokeObjectURL(c.url); });
      if (fullUrl) URL.revokeObjectURL(fullUrl);
      // NOTE: the worker singleton intentionally survives unmount.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getWorker() {
    // Session-wide singleton: the loaded model survives closing and reopening
    // Narrate, so only the very first use of a session pays the load cost.
    if (window.__qsNarrateWorker) return window.__qsNarrateWorker;
    const blob = new Blob([QS_NARRATE_WORKER_SRC], { type: 'text/javascript' });
    const w = new Worker(URL.createObjectURL(blob), { type: 'module' });
    window.__qsNarrateWorker = w;
    return w;
  }

  // Warm the model the moment the studio opens: by the time a voice is picked
  // and Generate is pressed, most (often all) of the wait is already behind us.
  React.useEffect(function () {
    const w = getWorker();
    if (w.__loaded || w.__warming) return;
    w.__warming = true;
    setProgress('Preparing the voice\u2026');
    workerCall(w, { type: 'load' }, function (pct) {
      setProgress('Downloading voice model\u2026 ' + pct + '%');
    }).then(function (ready) {
      w.__loaded = true;
      setEngine((ready.device || 'wasm') + ' \u00b7 ' + (ready.dtype || ''));
      setProgress('');
    }).catch(function () { w.__warming = false; setProgress(''); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function workerCall(w, msg, onProgress) {
    return new Promise(function (resolve, reject) {
      function handler(e) {
        const d = e.data;
        if (d.type === 'progress' && onProgress) { onProgress(d.pct); return; }
        if (msg.id !== undefined && d.id !== undefined && d.id !== msg.id) return;
        if (d.type === 'error') { w.removeEventListener('message', handler); reject(new Error(d.message)); }
        else if (d.type === 'ready' || d.type === 'audio') { w.removeEventListener('message', handler); resolve(d); }
      }
      w.addEventListener('message', handler);
      w.postMessage(msg);
    });
  }

  async function generate(voiceArg) {
    const useVoice = (typeof voiceArg === 'string') ? voiceArg : voice;
    setError('');
    cancelRef.current = false;
    try {
      const w = getWorker();
      if (!w.__loaded) {
        setPhase('loading');
        setProgress('Loading the voice model (first time only)\u2026');
        const ready = await workerCall(w, { type: 'load' }, function (pct) {
          setProgress('Downloading voice model\u2026 ' + pct + '%');
        });
        w.__loaded = true;
        setEngine((ready.device || 'wasm') + ' \u00b7 ' + (ready.dtype || ''));
      }
      setPhase('generating');
      const outClips = [];
      const buffers = [];
      let sampleRate = 24000;
      for (let i = 0; i < segments.length; i++) {
        if (cancelRef.current) { setPhase('idle'); return; }
        setProgress('Narrating segment ' + (i + 1) + ' of ' + segments.length + '\u2026');
        const text = (segments[i].excerpt || '').trim();
        if (!text) continue;
        const res = await workerCall(w, { type: 'generate', id: i, text: text, voice: useVoice });
        const data = res.audio;                   // Float32Array (transferred)
        sampleRate = res.sampleRate || sampleRate;
        const seconds = data.length / sampleRate;
        buffers.push(data);
        outClips.push({
          url: URL.createObjectURL(floatToWavBlob(data, sampleRate)),
          seconds: seconds,
          index: segments[i].index,
        });
      }
      // Stitch full track with a 0.35s breath between segments
      const gap = new Float32Array(Math.round(sampleRate * 0.35));
      let total = 0;
      buffers.forEach(function (b, i) { total += b.length + (i < buffers.length - 1 ? gap.length : 0); });
      const full = new Float32Array(total);
      let off = 0;
      buffers.forEach(function (b, i) {
        full.set(b, off); off += b.length;
        if (i < buffers.length - 1) { full.set(gap, off); off += gap.length; }
      });
      setClips(outClips);
      setFullUrl(URL.createObjectURL(floatToWavBlob(full, sampleRate)));
      setPhase('done');
      setProgress('');
      if (onDurations) onDurations(outClips.map(function (c) { return { index: c.index, seconds: c.seconds }; }));
    } catch (e) {
      setPhase('error');
      setError((e && e.message) ? e.message : 'Narration failed \u2014 try again.');
    }
  }

  function downloadFull() {
    if (!fullUrl) return;
    const a = document.createElement('a');
    a.href = fullUrl;
    a.download = 'narration-full.wav';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  function downloadClip(c) {
    const a = document.createElement('a');
    a.href = c.url;
    a.download = 'narration-seg-' + String(c.index).padStart(2, '0') + '.wav';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  const overCap = totalWords > QS_NARRATE_MAX;
  const busy = phase === 'loading' || phase === 'generating';

  return (
    <div className="qs-page">
      <div className="qs-thumbhead">
        <button type="button" className="qs-payoff__again" onClick={onClose}>
          <Icon name="arrow-left" size={13} />Back to shot list
        </button>
        <p className="qs-lead" style={{ margin: 0 }}>
          Narrate your piece. The voice runs in your browser — nothing is uploaded, nothing is paid.
        </p>
      </div>

      <div className="qs-thumbrow">
        <label className="qs-thumblabel">Voice</label>
        <div className="qs-groundrow" role="radiogroup" aria-label="Narration voice">
          {QS_NARRATE_VOICES.map(function (v) {
            return (
              <button key={v.id} type="button" role="radio" aria-checked={voice === v.id}
                className={'qs-pill' + (voice === v.id ? ' qs-pill--on' : '')}
                disabled={busy}
                onClick={function () {
                  setVoice(v.id);
                  // Already narrated? Switch voices and re-generate right away
                  // — the model is cached, so this is quick.
                  if (phase === 'done') generate(v.id);
                }}>
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="qs-quiethint" style={{ margin: '0 0 var(--space-4)' }}>
        {totalWords} words {overCap ? '\u2014 over the ' + QS_NARRATE_MAX + '-word narration limit. Narration is for final copies; trim the piece or narrate a shorter cut.' : '\u00b7 roughly ' + Math.round(totalWords / 2.6) + 's of speech'}
      </p>

      {engine ? <p className="qs-quiethint" style={{ margin: '0 0 var(--space-3)' }}>Engine: {engine}{engine.indexOf('q8') !== -1 ? ' \u2014 reduced quality; a WebGPU-capable browser sounds much better' : ''}</p> : null}
      {error ? <p className="qs-note"><Icon name="circle-alert" size={16} /><span>{error}</span></p> : null}

      {phase !== 'done' ? (
        <div className="qs-actionrow" style={{ justifyContent: 'flex-start', gap: 'var(--space-3)' }}>
          <button type="button" className="qs-payoff__again" onClick={function () { generate(); }} disabled={busy || overCap || !segments.length}>
            <Icon name="mic" size={13} />{busy ? (progress || 'Working\u2026') : 'Generate narration'}
          </button>
          {busy ? (
            <span className="qs-wave" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
            </span>
          ) : null}
          {busy ? (
            <button type="button" className="qs-payoff__again" onClick={function () { cancelRef.current = true; }}>
              Cancel
            </button>
          ) : null}
        </div>
      ) : (
        <div>
          <div className="qs-narrate__full">
            <audio controls src={fullUrl} style={{ width: '100%' }} ref={regAudio(0)} onPlay={soloPlay}></audio>
            <div className="qs-actionrow" style={{ justifyContent: 'flex-start', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <button type="button" className="qs-payoff__again" onClick={downloadFull}>
                <Icon name="download" size={13} />Full track (.wav)
              </button>
              <button type="button" className="qs-payoff__again" onClick={function () { setPhase('idle'); }}>
                <Icon name="rotate-ccw" size={13} />Re-generate
              </button>
            </div>
          </div>
          <div className="qs-narrate__clips">
            {clips.map(function (c) {
              return (
                <div key={c.index} className="qs-narrate__clip">
                  <span className="qs-thumbcard__name">{String(c.index).padStart(2, '0')} · {c.seconds.toFixed(1)}s</span>
                  <audio controls src={c.url} ref={regAudio(c.index)} onPlay={soloPlay}></audio>
                  <button type="button" className="qs-payoff__again" onClick={function () { downloadClip(c); }}>
                    <Icon name="download" size={13} />WAV
                  </button>
                </div>
              );
            })}
          </div>
          <p className="qs-quiethint">Segment timings on your shot list now reflect the real narration.</p>
        </div>
      )}
    </div>
  );
}

window.NarrateStudio = NarrateStudio;
