/* Quiet Shelf — Thumbnail Studio.
   Opens after Promote maps a script. Composites a 1280x720 YouTube thumbnail:
   a person photo (stock search or upload) + a short punchy hook in bold
   all-caps Anton, in one of three layouts modeled on the writer's real
   Quiet Fight Club thumbnails. Exports PNG at exact YouTube spec.

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

function emotionQuery(mood) {
  const m = (mood || '').toLowerCase();
  if (/(hope|warm|joy|tender|uplift|bright|relief|comfort)/.test(m))
    return 'hopeful person soft light portrait looking away';
  if (/(tense|dark|grief|fear|anger|despair|dread|anxious|conflict)/.test(m))
    return 'somber person dramatic low light portrait';
  if (/(quiet|still|somber|reflect|melanchol|wistful|pensive|resigned|bittersweet)/.test(m))
    return 'pensive person looking away window moody portrait';
  return 'contemplative person moody portrait looking away';
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
  const align = opts.align || 'left';
  const accent = opts.accent || null;
  const boxX = opts.boxX;
  const boxW = opts.boxW;
  const anchorY = opts.anchorY;
  const maxLines = opts.maxLines || 3;

  let size = opts.maxSize || 120;
  let lines = [];
  for (; size >= 40; size -= 4) {
    ctx.font = '400 ' + size + 'px Anton, Impact, sans-serif';
    lines = wrapText(ctx, text, boxW);
    if (lines.length <= maxLines) break;
  }
  ctx.font = '400 ' + size + 'px Anton, Impact, sans-serif';
  const lineH = size * 1.04;
  const totalH = lineH * lines.length;
  let y = anchorY - totalH / 2 + size * 0.82;

  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  const drawX = align === 'center' ? boxX + boxW / 2 : boxX;

  lines.forEach(function (ln) {
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#f7f4ef';
    ctx.fillText(ln, drawX, y);
    y += lineH;
  });
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (accent) {
    const lastW = Math.min(boxW, ctx.measureText(lines[lines.length - 1]).width);
    const uy = y - lineH + size * 0.16;
    const ux = align === 'center' ? drawX - lastW / 2 : drawX;
    ctx.fillStyle = accent;
    ctx.fillRect(ux, uy, Math.max(120, lastW * 0.42), Math.max(6, size * 0.06));
  }
}

const QS_THUMB_LAYOUTS = [
  {
    id: 'text-left',
    name: 'Text left',
    paint: function (ctx, img, hook, accent) {
      drawCover(ctx, img, 0.82);
      drawScrim(ctx, 'left');
      drawHeadline(ctx, hook, {
        align: 'left', accent: accent,
        boxX: 70, boxW: QS_THUMB_W * 0.50, anchorY: QS_THUMB_H * 0.5,
        maxSize: 128, maxLines: 3,
      });
    },
  },
  {
    id: 'lower-left',
    name: 'Lower third',
    paint: function (ctx, img, hook, accent) {
      drawCover(ctx, img, 0.5);
      drawScrim(ctx, 'bottom');
      drawHeadline(ctx, hook, {
        align: 'left', accent: accent,
        boxX: 70, boxW: QS_THUMB_W * 0.62, anchorY: QS_THUMB_H * 0.74,
        maxSize: 112, maxLines: 2,
      });
    },
  },
  {
    id: 'center-band',
    name: 'Center band',
    paint: function (ctx, img, hook, accent) {
      drawCover(ctx, img, 0.78);
      drawScrim(ctx, 'center');
      drawHeadline(ctx, hook, {
        align: 'left', accent: accent,
        boxX: 70, boxW: QS_THUMB_W * 0.52, anchorY: QS_THUMB_H * 0.5,
        maxSize: 120, maxLines: 3,
      });
    },
  },
];

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
  const canvasRefs = [React.useRef(null), React.useRef(null), React.useRef(null)];

  const accent = (QS_THUMB_ACCENTS.find(function (a) { return a.id === accentId; }) || {}).hex || null;

  React.useEffect(function () {
    if (!photoImg) return;
    QS_THUMB_LAYOUTS.forEach(function (layout, i) {
      const canvas = canvasRefs[i].current;
      if (!canvas) return;
      canvas.width = QS_THUMB_W;
      canvas.height = QS_THUMB_H;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, QS_THUMB_W, QS_THUMB_H);
      try {
        layout.paint(ctx, photoImg, hook || ' ', accent);
      } catch (e) {}
    });
  }, [photoImg, hook, accentId]);

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
    window.QS_API.thumbnailPeople({ emotion: emotionQuery(mood), n: 6 })
      .then(function (res) {
        const list = (res.suggestions || []).filter(function (s) { return s && (s.thumb_url || s.url); });
        setPeople(list);
        if (!list.length) setError('No photos came back - try uploading your own.');
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

  function download(i) {
    const canvas = canvasRefs[i].current;
    if (!canvas) return;
    canvas.toBlob(function (blob) {
      if (!blob) { setError('Export failed - try a different photo.'); return; }
      const a = document.createElement('a');
      const safe = (hook || 'thumbnail').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
      a.download = 'thumbnail-' + (safe || 'quietshelf') + '-' + QS_THUMB_LAYOUTS[i].id + '.png';
      a.href = URL.createObjectURL(blob);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
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
            <Icon name="search" size={13} />{loadingPeople ? 'Searching...' : 'Find a face'}
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
        <div className="qs-thumbgrid">
          {QS_THUMB_LAYOUTS.map(function (layout, i) {
            return (
              <div key={layout.id} className="qs-thumbcard">
                <div className="qs-thumbcanvas-wrap">
                  <canvas ref={canvasRefs[i]} className="qs-thumbcanvas" />
                </div>
                <div className="qs-thumbcard__foot">
                  <span className="qs-thumbcard__name">{layout.name}</span>
                  <button type="button" className="qs-payoff__again" onClick={function () { download(i); }} disabled={busy}>
                    <Icon name="download" size={13} />PNG
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="qs-thumbempty">
          <Icon name="image" size={40} />
          <p className="qs-quiethint">Find a face or upload a photo to see three thumbnail layouts.</p>
        </div>
      )}
    </div>
  );
}

window.ThumbnailStudio = ThumbnailStudio;
