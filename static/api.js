/* Quiet Shelf — the one place the frontend talks to the backend.
   Same-origin calls to the FastAPI app. Every call returns real data
   from the running services; nothing here is mocked. */
(function () {
  const BASE = '';

  // Turn a non-2xx response into a calm, writer-friendly Error.
  async function friendlyError(resp, fallback) {
    let msg = fallback;
    let data = null;
    try {
      data = await resp.json();
      msg = data.message || data.detail || fallback;
    } catch (e) {
      /* non-JSON body — keep the fallback */
    }
    if (resp.status === 429) {
      // Two different 429s share this status: the upstream free AI tier
      // (body has error:"rate_limited") and this app's OWN per-IP hourly cap.
      // Blaming the AI tier for our own cap sends self-hosters chasing the
      // wrong knob - name the right one.
      msg = (data && data.error === 'rate_limited')
        ? 'The free AI tier needs a breather. Try again in a little while.'
        : 'You’ve reached this app’s own hourly request cap. If you’re self-hosting, raise RATE_LIMIT in your .env and restart.';
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
  // mapJson (optional): the writer's saved Story Map, as a JSON string — the
  // backend turns it into a cast sheet that grounds the copy.
  async function generateBlurb({ text, file, tone, length, mapJson }) {
    const fd = new FormData();
    if (file) fd.append('file', file);
    else fd.append('text', text || '');
    fd.append('tone', tone);
    fd.append('length', length);
    if (mapJson) fd.append('map_json', mapJson);

    const resp = await fetch(BASE + '/api/blurb', { method: 'POST', body: fd });
    if (!resp.ok) {
      throw await friendlyError(resp, 'Something went wrong reaching the copywriter. Try again in a moment.');
    }
    return await resp.json();
  }

  // POST /api/promote (JSON) -> ShotList
  // storyMap (optional): the writer's saved Story Map object — grounds every
  // chunk's search terms in the same confirmed cast.
  async function promote(script, storyMap) {
    const body = { script };
    if (storyMap) body.story_map = storyMap;
    const resp = await fetch(BASE + '/api/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      throw await friendlyError(resp, 'Something went wrong reaching the mapping engine. Try again in a moment.');
    }
    return await resp.json();
  }

  // Build the multipart body Story Map endpoints share (pasted text or file).
  function storyForm({ text, file }) {
    const fd = new FormData();
    if (file) fd.append('file', file);
    else fd.append('text', text || '');
    return fd;
  }

  // POST /api/storymap/scan -> { characters[], places[] } — Pass 1, best-effort
  // names for the live loader. A failure here must never block the real map.
  async function storymapScan({ text, file }) {
    const resp = await fetch(BASE + '/api/storymap/scan', { method: 'POST', body: storyForm({ text, file }) });
    if (!resp.ok) return { characters: [], places: [] };
    return await resp.json();
  }

  // POST /api/storymap/map -> StoryMap (the mirror; fabricated is always false)
  async function storymapMap({ text, file }) {
    const resp = await fetch(BASE + '/api/storymap/map', { method: 'POST', body: storyForm({ text, file }) });
    if (!resp.ok) {
      throw await friendlyError(resp, 'Couldn’t read the story map. Try again in a moment.');
    }
    return await resp.json();
  }

  // POST /api/storymap/imagine -> StoryMap (seed|full) or StoryPrompts (prompts).
  // The opt-in door: results are always stamped fabricated=true by the engine.
  async function storymapImagine({ text, file, mode, nudge, existing, reroll }) {
    const fd = storyForm({ text, file });
    fd.append('mode', mode || 'seed');
    if (nudge) fd.append('nudge', nudge);
    if (existing && existing.length) fd.append('existing', existing.join(','));
    if (reroll) fd.append('reroll', 'true');
    const resp = await fetch(BASE + '/api/storymap/imagine', { method: 'POST', body: fd });
    if (!resp.ok) {
      throw await friendlyError(resp, 'Couldn’t imagine a story this time. Try again in a moment.');
    }
    return await resp.json();
  }

  // GET /api/health -> { status, provider, services[] }
  async function health() {
    const resp = await fetch(BASE + '/api/health');
    if (!resp.ok) throw await friendlyError(resp, 'The service is unavailable.');
    return await resp.json();
  }

  // POST /api/feedback (JSON {message}) -> {ok:true}
  async function sendFeedback(message) {
    const resp = await fetch(BASE + '/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!resp.ok) throw await friendlyError(resp, 'Could not send that just now.');
    return await resp.json();
  }

  // A small, honest pause so "the becoming" never flashes by. Real work
  // usually takes longer than this; this only matters for very fast calls.
  function calmDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  window.QS_API = {
    fetchThemes, formatBook, generateBlurb, promote,
    storymapScan, storymapMap, storymapImagine,
    health, sendFeedback, calmDelay,
  };
})();
