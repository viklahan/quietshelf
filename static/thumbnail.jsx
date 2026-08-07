/* Quiet Shelf — Thumbnail Studio.
   Opens after Promote maps a script. Composites a 1280x720 YouTube thumbnail:
   a person photo (stock search or upload) + a short punchy hook in bold
   all-caps Anton that the writer can DRAG anywhere on the image. Exports PNG
   at exact YouTube spec.

   Everything is canvas-local: uploaded photos never leave the browser, and
   stock photos are fetched as Blobs through the app's own proxy
   (QS_API.fetchCoverImage) so the canvas is never cross-origin "tainted" and
   toBlob()/toDataURL() export always works. */

const QS_THUMB_W = 1280;
const QS_THUMB_H = 720;

// Hook extraction: short punchy lines from the script body, 2-6 words.
function extractHooks(segments, max) {
  max = max || 5;
  const seen = new Set();
  const candidates = [];
  (segments || []).forEach(function (s) {
    const raw = (s.excerpt || '').trim();
    raw.split(/\n|(?<=[.!?\u2026])\s+/).forEach(function (line) {
      let t = line.trim().replace(/[\u201c\u201d\u2018\u2019]/g, '');
      if (!t) return;
      const words = t.split(/\s+/);
      if (words.length < 2 || words.length > 6) return;
      const cleaned = t.replace(/[.\u2026]+$/, '').trim();
      if (cleaned.split(/\s+/).length < 2) return;
      const key = cleaned.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push(cleaned.toUpperCase());
    });
  });
  candidates.sort(function (a, b) { return a.split(/\s+/).length - b.split(/\s+/).length; });
  return candidates.slice(0, max);
}

// Mood -> a POOL of person-and-emotion stock searches. We rotate through the
// pool (and shuffle within it) on each "find a face" click so the writer gets
// fresh options every time instead of the same top hits.
const QS_EMOTION_POOLS = {
  warm: [
    'hopeful person soft light portrait looking away',
    'woman gentle smile warm window light',
    'man quiet contentment golden hour portrait',
    'person peaceful expression soft daylight',
    'candid portrait warm tender mood looking up',
    'person calm serene face natural light',
  ],
  dark: [
    'somber person dramatic low light portrait',
    'man serious shadowed face moody',
    'woman intense gaze dark background portrait',
    'person troubled expression dim light',
    'brooding portrait harsh shadow close up',
    'person distressed face dark cinematic',
  ],
  quiet: [
    'pensive person looking away window moody portrait',
    'woman thoughtful gaze soft shadow',
    'man reflective expression muted light portrait',
    'person melancholy looking out window',
    'wistful portrait subdued tone looking down',
    'person contemplative face grey light',
  ],
  neutral: [
    'contemplative person moody portrait looking away',
    'person candid expression natural portrait',
    'thoughtful face soft studio light',
    'person quiet mood cinematic portrait',
    'introspective portrait muted background',
    'person calm gaze editorial photo',
  ],
};

// Visual modifiers crossed with the pools give ~48 distinct queries before
// any repeat — the API's same-top-hits problem needs different WORDS, not
// just different clicks.
const QS_QUERY_MODIFIERS = [
  '', 'cinematic', 'black and white', 'golden hour', 'close up',
  'side profile', 'over shoulder', 'natural light',
];

function emotionPool(mood) {
  const m = (mood || '').toLowerCase();
  if (/(hope|warm|joy|tender|uplift|bright|relief|comfort)/.test(m)) return QS_EMOTION_POOLS.warm;
  if (/(tense|dark|grief|fear|anger|despair|dread|anxious|conflict)/.test(m)) return QS_EMOTION_POOLS.dark;
  if (/(quiet|still|somber|reflect|melanchol|wistful|pensive|resigned|bittersweet)/.test(m)) return QS_EMOTION_POOLS.quiet;
  return QS_EMOTION_POOLS.neutral;
}

function dominantMood(segments) {
  const counts = {};
  (segments || []).forEach(function (s) {
    const m = (s.mood || 'reflective').toLowerCase();
    counts[m] = (counts[m] || 0) + 1;
  });
  let best = 'reflective', bestN = 0;
  Object.keys(counts).forEach(function (m) {
    if (counts[m] > bestN) { best = m; bestN = counts[m]; }
  });
  return best;
}

function loadImageFromBlob(blob) {
  return new Promise(function (resolve, reject) {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Image failed to load')); };
    img.src = url;
  });
}

function drawCover(ctx, img, offsetX) {
  offsetX = offsetX == null ? 0.5 : offsetX;
  const cw = QS_THUMB_W, ch = QS_THUMB_H;
  const scale = Math.max(cw / img.width, ch / img.height);
  const w = img.width * scale, h = img.height * scale;
  const x = (cw - w) * offsetX;
  const y = (ch - h) * 0.5;
  ctx.drawImage(img, x, y, w, h);
}

function drawScrim(ctx, side) {
  const cw = QS_THUMB_W, ch = QS_THUMB_H;
  let grad;
  if (side === 'left') {
    grad = ctx.createLinearGradient(0, 0, cw * 0.72, 0);
    grad.addColorStop(0, 'rgba(8,7,6,0.92)');
    grad.addColorStop(0.55, 'rgba(8,7,6,0.62)');
    grad.addColorStop(1, 'rgba(8,7,6,0)');
  } else if (side === 'bottom') {
    grad = ctx.createLinearGradient(0, ch, 0, ch * 0.32);
    grad.addColorStop(0, 'rgba(8,7,6,0.94)');
    grad.addColorStop(0.6, 'rgba(8,7,6,0.55)');
    grad.addColorStop(1, 'rgba(8,7,6,0)');
  } else {
    grad = ctx.createLinearGradient(0, ch * 0.30, 0, ch * 0.72);
    grad.addColorStop(0, 'rgba(8,7,6,0)');
    grad.addColorStop(0.5, 'rgba(8,7,6,0.82)');
    grad.addColorStop(1, 'rgba(8,7,6,0)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = 'rgba(10,8,7,0.18)';
  ctx.fillRect(0, 0, cw, ch);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawHeadline(ctx, text, opts) {
  const accent = opts.accent || null;
  // Position as fractions of the frame; the text block CENTERS vertically on
  // ty and starts horizontally at tx.
  const tx = opts.tx * QS_THUMB_W;
  const ty = opts.ty * QS_THUMB_H;
  const boxW = Math.max(280, Math.min(QS_THUMB_W * 0.60, QS_THUMB_W - tx - 48));
  const maxLines = 3;

  const scale = opts.scale || 1;
  let size = Math.round(120 * scale);
  let lines = [];
  const minSize = Math.max(28, Math.round(40 * scale * 0.6));
  for (; size >= minSize; size -= 4) {
    ctx.font = '400 ' + size + 'px Anton, Impact, sans-serif';
    lines = wrapText(ctx, text, boxW);
    if (lines.length <= maxLines) break;
  }
  ctx.font = '400 ' + size + 'px Anton, Impact, sans-serif';
  const lineH = size * 1.04;
  const totalH = lineH * lines.length;
  let widest = 0;
  lines.forEach(function (ln) { widest = Math.max(widest, ctx.measureText(ln).width); });

  // Local legibility scrim: a soft dark panel behind the text, wherever it is
  // dragged — so the hook never fights the face for contrast.
  // roundRect shipped ~2023; square-corner fallback for older browsers.
  if (!ctx.roundRect) { ctx.roundRect = function (x, y, w, h) { ctx.rect(x, y, w, h); }; }
  const pad = size * 0.35;
  const bx = tx - pad, by = ty - totalH / 2 - pad;
  const bw = Math.min(widest, boxW) + pad * 2, bh = totalH + pad * 1.6;
  ctx.save();
  ctx.fillStyle = 'rgba(8,7,6,0.34)';
  ctx.filter = 'blur(0px)';
  ctx.beginPath();
  const r = 14;
  ctx.roundRect(bx - 8, by - 8, bw + 16, bh + 16, r + 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(8,7,6,0.30)';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, r);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let y = ty - totalH / 2 + size * 0.82;
  lines.forEach(function (ln) {
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#f7f4ef';
    ctx.fillText(ln, tx, y);
    y += lineH;
  });
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (accent) {
    const lastW = Math.min(boxW, ctx.measureText(lines[lines.length - 1]).width);
    const uy = y - lineH + size * 0.16;
    ctx.fillStyle = accent;
    ctx.fillRect(tx, uy, Math.max(120, lastW * 0.42), Math.max(6, size * 0.06));
  }

  // Report the hit box (canvas pixels) for dragging.
  return { x: bx, y: by, w: bw, h: bh };
}

function paintThumb(ctx, img, hook, accent, tx, ty, scale, withHandle) {
  drawCover(ctx, img, 0.78);
  drawScrim(ctx, ty > 0.62 ? 'bottom' : 'left');
  const bbox = drawHeadline(ctx, hook || ' ', { accent: accent, tx: tx, ty: ty, scale: scale || 1 });
  if (withHandle && bbox) {
    // Corner grip: preview-only affordance for resizing. The export path
    // repaints WITHOUT it, so it can never leak into the PNG.
    const hx = bbox.x + bbox.w, hy = bbox.y + bbox.h;
    ctx.save();
    ctx.fillStyle = 'rgba(197,137,59,0.95)';
    ctx.strokeStyle = 'rgba(8,7,6,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx, hy, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  return bbox;
}

const QS_THUMB_ACCENTS = [
  { id: 'oxblood', label: 'Red', hex: '#c0392b' },
  { id: 'ember', label: 'Ember', hex: '#c5893b' },
  { id: 'none', label: 'None', hex: null },
];

function ThumbnailStudio(props) {
  const DS = window.QuietFightClubDesignSystem_fae847 || {};
  const Icon = DS.Icon || function () { return null; };
  const segments = props.segments || [];
  const detectedTitle = props.title || '';
  const onClose = props.onClose || function () {};

  const hookOptions = React.useMemo(function () {
    const hooks = extractHooks(segments, 5);
    if (detectedTitle) hooks.unshift(detectedTitle.toUpperCase());
    return hooks.length ? hooks : ['YOUR HOOK HERE'];
  }, [segments, detectedTitle]);

  const mood = React.useMemo(function () { return dominantMood(segments); }, [segments]);

  const [hook, setHook] = React.useState(hookOptions[0]);
  const [accentId, setAccentId] = React.useState('oxblood');
  const [photoImg, setPhotoImg] = React.useState(null);
  const [photoLabel, setPhotoLabel] = React.useState('');
  const [people, setPeople] = React.useState([]);
  const [loadingPeople, setLoadingPeople] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const uploadRef = React.useRef(null);
  const queryIdxRef = React.useRef(0);           // which pool phrasing to use next
  const shownCountRef = React.useRef({});        // url -> times displayed (cap: 2 per mapping)
  const canvasRef = React.useRef(null);          // the single preview canvas
  const bboxRef = React.useRef(null);            // last drawn text hit-box (canvas px)
  const dragRef = React.useRef(null);            // {mode, ...} while dragging/resizing
  const [textPos, setTextPos] = React.useState({ tx: 0.055, ty: 0.5 });
  const [textScale, setTextScale] = React.useState(1);

  const accent = (QS_THUMB_ACCENTS.find(function (a) { return a.id === accentId; }) || {}).hex || null;

  React.useEffect(function () {
    if (!photoImg) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = QS_THUMB_W;
    canvas.height = QS_THUMB_H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, QS_THUMB_W, QS_THUMB_H);
    try {
      bboxRef.current = paintThumb(ctx, photoImg, hook, accent, textPos.tx, textPos.ty, textScale, true);
    } catch (e) {}
  }, [photoImg, hook, accentId, textPos, textScale]);

  // Drag the hook anywhere on the image. Pointer events cover mouse + touch.
  function canvasPoint(e) {
    const canvas = canvasRef.current;
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (QS_THUMB_W / r.width),
      y: (e.clientY - r.top) * (QS_THUMB_H / r.height),
    };
  }
  function onCanvasPointerDown(e) {
    const b = bboxRef.current;
    if (!b) return;
    const pt = canvasPoint(e);
    const hx = b.x + b.w, hy = b.y + b.h;
    const nearHandle = Math.hypot(pt.x - hx, pt.y - hy) <= 30;
    if (nearHandle) {
      dragRef.current = {
        mode: 'resize',
        startScale: textScale,
        anchorX: textPos.tx * QS_THUMB_W,
        anchorY: textPos.ty * QS_THUMB_H,
        startDist: Math.max(40, Math.hypot(pt.x - textPos.tx * QS_THUMB_W, pt.y - textPos.ty * QS_THUMB_H)),
      };
    } else if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) {
      dragRef.current = {
        mode: 'move',
        dx: pt.x - textPos.tx * QS_THUMB_W,
        dy: pt.y - textPos.ty * QS_THUMB_H,
      };
    } else {
      return;
    }
    e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function onCanvasPointerMove(e) {
    const d = dragRef.current;
    if (!d) return;
    const pt = canvasPoint(e);
    if (d.mode === 'resize') {
      const dist = Math.max(40, Math.hypot(pt.x - d.anchorX, pt.y - d.anchorY));
      const next = d.startScale * (dist / d.startDist);
      setTextScale(Math.min(1.7, Math.max(0.45, next)));
    } else {
      setTextPos({
        tx: Math.min(0.85, Math.max(0.02, (pt.x - d.dx) / QS_THUMB_W)),
        ty: Math.min(0.92, Math.max(0.08, (pt.y - d.dy) / QS_THUMB_H)),
      });
    }
  }
  function onCanvasPointerUp() { dragRef.current = null; }

  React.useEffect(function () {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (photoImg) setHook(function (h) { return h; });
      });
    }
  }, [photoImg]);

  function searchPeople() {
    setLoadingPeople(true);
    setError('');
    const pool = emotionPool(mood);
    // Cross pool phrasing with a visual modifier: ~48 distinct queries before
    // any wording repeats, so the API keeps surfacing different photos.
    const i = queryIdxRef.current;
    queryIdxRef.current += 1;
    const base = pool[i % pool.length];
    const modifier = QS_QUERY_MODIFIERS[Math.floor(i / pool.length) % QS_QUERY_MODIFIERS.length];
    const query = (base + ' ' + modifier).trim();
    window.QS_API.thumbnailPeople({ emotion: query, n: 12 })
      .then(function (res) {
        const all = (res.suggestions || []).filter(function (s) { return s && (s.thumb_url || s.url); });
        const counts = shownCountRef.current;
        const keyOf = function (s) { return s.url || s.thumb_url; };
        // Hard rule: no photo appears more than TWICE per mapping session.
        // Prefer never-shown, then once-shown; twice-shown are excluded.
        const never = all.filter(function (s) { return !(counts[keyOf(s)] > 0); });
        const once = all.filter(function (s) { return counts[keyOf(s)] === 1; });
        let list = never.concat(once).slice(0, 6);
        if (!list.length && all.length) {
          // Genuinely out of photos under the cap: start a fresh session count
          // rather than showing an empty grid.
          shownCountRef.current = {};
          list = all.slice(0, 6);
        }
        list.forEach(function (s) {
          const k = keyOf(s);
          shownCountRef.current[k] = (shownCountRef.current[k] || 0) + 1;
        });
        setPeople(list);
        if (!list.length) setError('No photos came back - try again or upload your own.');
      })
      .catch(function (err) { setError((err && err.message) || 'Photo search failed.'); })
      .finally(function () { setLoadingPeople(false); });
  }

  function pickStock(s) {
    setBusy(true);
    setError('');
    window.QS_API.fetchCoverImage(s.url || s.thumb_url)
      .then(loadImageFromBlob)
      .then(function (img) { setPhotoImg(img); setPhotoLabel(s.photographer ? ('Photo: ' + s.photographer) : 'Stock photo'); })
      .catch(function (err) { setError((err && err.message) || 'Could not load that photo.'); })
      .finally(function () { setBusy(false); });
  }

  function onUpload(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) { setError('That is not an image file.'); return; }
    setBusy(true);
    setError('');
    loadImageFromBlob(f)
      .then(function (img) { setPhotoImg(img); setPhotoLabel('Your photo'); })
      .catch(function () { setError('Could not read that image.'); })
      .finally(function () { setBusy(false); });
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !photoImg) return;
    // Repaint WITHOUT the resize handle so it never ships in the PNG.
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, QS_THUMB_W, QS_THUMB_H);
    paintThumb(ctx, photoImg, hook, accent, textPos.tx, textPos.ty, textScale, false);
    canvas.toBlob(function (blob) {
      if (!blob) { setError('Export failed - try a different photo.'); return; }
      const a = document.createElement('a');
      const safe = (hook || 'thumbnail').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
      a.download = 'thumbnail-' + (safe || 'quietshelf') + '.png';
      a.href = URL.createObjectURL(blob);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      // Restore the preview (with handle) after export.
      const ctx2 = canvas.getContext('2d');
      ctx2.clearRect(0, 0, QS_THUMB_W, QS_THUMB_H);
      bboxRef.current = paintThumb(ctx2, photoImg, hook, accent, textPos.tx, textPos.ty, textScale, true);
    }, 'image/png');
  }

  return (
    <div className="qs-page">
      <div className="qs-thumbhead">
        <button type="button" className="qs-payoff__again" onClick={onClose}>
          <Icon name="arrow-left" size={13} />Back to shot list
        </button>
        <p className="qs-lead" style={{ margin: 0 }}>Build a thumbnail. Pick a face, set the hook, download.</p>
      </div>

      <div className="qs-thumbrow">
        <label className="qs-thumblabel">Hook</label>
        <input
          className="qs-input"
          value={hook}
          maxLength={48}
          onChange={function (e) { setHook(e.target.value.toUpperCase()); }}
          placeholder="SHORT PUNCHY LINE"
          aria-label="Thumbnail hook text"
        />
      </div>
      {hookOptions.length > 1 ? (
        <div className="qs-thumbchips">
          {hookOptions.map(function (h, i) {
            return (
              <button key={i} type="button"
                className={'qs-thumbchip' + (h === hook ? ' qs-thumbchip--on' : '')}
                onClick={function () { setHook(h); }}>
                {h}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="qs-thumbrow">
        <label className="qs-thumblabel">Accent</label>
        <div className="qs-groundrow" role="radiogroup" aria-label="Accent color">
          {QS_THUMB_ACCENTS.map(function (a) {
            return (
              <button key={a.id} type="button" role="radio" aria-checked={accentId === a.id}
                className={'qs-pill' + (accentId === a.id ? ' qs-pill--on' : '')}
                onClick={function () { setAccentId(a.id); }}>
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="qs-thumbrow">
        <label className="qs-thumblabel">Face</label>
        <div className="qs-actionrow" style={{ margin: 0, gap: 'var(--space-3)', justifyContent: 'flex-start' }}>
          <button type="button" className="qs-payoff__again" onClick={searchPeople} disabled={loadingPeople}>
            <Icon name={people.length ? 'shuffle' : 'search'} size={13} />{loadingPeople ? 'Searching...' : (people.length ? 'Show me different faces' : 'Find a face')}
          </button>
          <button type="button" className="qs-payoff__again" onClick={function () { uploadRef.current && uploadRef.current.click(); }}>
            <Icon name="upload" size={13} />Upload your own
          </button>
          <input ref={uploadRef} type="file" accept="image/*" onChange={onUpload}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }} tabIndex={-1} />
        </div>
      </div>

      {photoLabel ? <p className="qs-quiethint" style={{ margin: '0 0 var(--space-4)' }}>{photoLabel}</p> : null}
      {error ? <p className="qs-note"><Icon name="circle-alert" size={16} /><span>{error}</span></p> : null}

      {people.length ? (
        <div className="qs-thumbstock">
          {people.map(function (s, i) {
            return (
              <button key={i} type="button" className="qs-thumbstock__item" onClick={function () { pickStock(s); }}
                title={s.photographer ? ('Photo: ' + s.photographer) : 'Stock photo'}>
                <img src={s.thumb_url || s.url} alt="" loading="lazy" />
              </button>
            );
          })}
        </div>
      ) : null}

      {photoImg ? (
        <div className="qs-thumbcard qs-thumbcard--single">
          <div className="qs-thumbcanvas-wrap">
            <canvas
              ref={canvasRef}
              className="qs-thumbcanvas qs-thumbcanvas--drag"
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onPointerCancel={onCanvasPointerUp}
            />
          </div>
          <div className="qs-thumbcard__foot">
            <span className="qs-thumbcard__name">Drag the text to move it · drag the amber dot to resize</span>
            <button type="button" className="qs-payoff__again" onClick={download} disabled={busy}>
              <Icon name="download" size={13} />Download PNG
            </button>
          </div>
        </div>
      ) : (
        <div className="qs-thumbempty">
          <Icon name="image" size={40} />
          <p className="qs-quiethint">Find a face or upload a photo to build your thumbnail.</p>
        </div>
      )}
    </div>
  );
}

window.ThumbnailStudio = ThumbnailStudio;
