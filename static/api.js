/* Quiet Shelf — the one place the frontend talks to the backend.
   Same-origin calls to the FastAPI app. Every call returns real data
   from the running services; nothing here is mocked. */
(function () {
  const BASE = '';

  // Turn a non-2xx response into a calm, writer-friendly Error.
  async function friendlyError(resp, fallback) {
    let msg = fallback;
    try {
      const data = await resp.json();
      msg = data.message || data.detail || fallback;
    } catch (e) {
      /* non-JSON body — keep the fallback */
    }
    if (resp.status === 429) {
      msg = 'The free AI tier needs a breather. Try again in a little while.';
    }
    const err = new Error(msg);
    err.status = resp.status;
    return err;
  }

  // GET /api/format/themes -> [{ id, display_name, description }]
  async function fetchThemes() {
    const resp = await fetch(BASE + '/api/format/themes');
    if (!resp.ok) throw await friendlyError(resp, 'Could not load themes just now.');
    const data = await resp.json();
    return data.themes || [];
  }

  // POST /api/format (multipart) -> { blob, filename } for the .epub
  async function formatBook({ file, title, author, theme, cover }) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    fd.append('author', author);
    fd.append('theme', theme);
    if (cover) fd.append('cover_image', cover);

    const resp = await fetch(BASE + '/api/format', { method: 'POST', body: fd });
    if (!resp.ok) {
      throw await friendlyError(resp, 'Something went wrong converting that file. Try a DOCX export.');
    }
    const blob = await resp.blob();
    let filename = ((title || 'book').trim() || 'book') + '.epub';
    const cd = resp.headers.get('Content-Disposition');
    if (cd) {
      const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
      if (m && m[1]) filename = decodeURIComponent(m[1]);
    }
    return { blob, filename };
  }

  // POST /api/blurb (multipart Form) -> { back_cover, taglines[3], short_description, keywords[] }
  async function generateBlurb({ text, file, tone, length }) {
    const fd = new FormData();
    if (file) fd.append('file', file);
    else fd.append('text', text || '');
    fd.append('tone', tone);
    fd.append('length', length);

    const resp = await fetch(BASE + '/api/blurb', { method: 'POST', body: fd });
    if (!resp.ok) {
      throw await friendlyError(resp, 'The copywriter returned an unreadable result. Try again.');
    }
    return await resp.json();
  }

  // POST /api/promote (JSON) -> ShotList
  async function promote(script) {
    const resp = await fetch(BASE + '/api/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script }),
    });
    if (!resp.ok) {
      throw await friendlyError(resp, 'The mapping engine returned an unreadable result. Try again.');
    }
    return await resp.json();
  }

  // GET /api/health -> { status, provider, services[] }
  async function health() {
    const resp = await fetch(BASE + '/api/health');
    if (!resp.ok) throw await friendlyError(resp, 'The service is unavailable.');
    return await resp.json();
  }

  // A small, honest pause so "the becoming" never flashes by. Real work
  // usually takes longer than this; this only matters for very fast calls.
  function calmDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  window.QS_API = { fetchThemes, formatBook, generateBlurb, promote, health, calmDelay };
})();
