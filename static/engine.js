// QFCEngine — fake mapping engine for the UI kit. Deterministic, in-memory.
// Mirrors the real backend's response shape from POST /api/map.
(function () {
  var WPM = 150;

  var STOP = new Set(('a an and are as at be been but by for from had has have he her his i if in into is it its me my of on or our out so than that the their them then there they this to up was we were what when which who will with you your yet not no nor do does did done just only very own same too can could would should about over under again once more most other some such').split(' '));

  var MOOD_LEXICON = [
    [/rain|leaving|window|gone|doubt|empty|alone/i, 'wistful'],
    [/fight|boxer|rounds|blank|cold|bark|deadline/i, 'tense'],
    [/sunrise|begin|method|accumulat|worth|true|strong/i, 'resolute'],
    [/quiet|silence|lamp|snow|hum|night|slow/i, 'quiet'],
    [/city|street|train|harbor|kitchen|shop/i, 'reflective'],
  ];
  var MOOD_CYCLE = ['reflective', 'quiet', 'resolute', 'wistful', 'tense'];
  var MOOD_TERMS = {
    wistful: 'rain on train window',
    tense: 'boxer wrapping hands gym',
    resolute: 'typewriter desk lamp night',
    quiet: 'snow falling streetlight',
    reflective: 'empty city street night',
  };

  function countWords(text) {
    var m = (text || '').trim().match(/\S+/g);
    return m ? m.length : 0;
  }

  function fmtTime(totalSeconds) {
    var s = Math.max(0, Math.round(totalSeconds));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }

  function keywords(text, n) {
    var freq = {};
    (text.toLowerCase().match(/[a-z']{4,}/g) || []).forEach(function (w) {
      w = w.replace(/'s$/, '');
      if (STOP.has(w)) return;
      freq[w] = (freq[w] || 0) + 1;
    });
    return Object.keys(freq)
      .sort(function (a, b) { return freq[b] - freq[a] || b.length - a.length; })
      .slice(0, n);
  }

  function moodFor(text, i) {
    for (var k = 0; k < MOOD_LEXICON.length; k++) {
      if (MOOD_LEXICON[k][0].test(text)) return MOOD_LEXICON[k][1];
    }
    return MOOD_CYCLE[i % MOOD_CYCLE.length];
  }

  function map(script) {
    var sentences = script.replace(/\s+/g, ' ').trim().match(/[^.!?…]+[.!?…]+["']?|[^.!?…]+$/g) || [];
    // Group sentences into ~40-word segments.
    var groups = [];
    var cur = '';
    sentences.forEach(function (s) {
      cur = cur ? cur + ' ' + s.trim() : s.trim();
      if (countWords(cur) >= 38) { groups.push(cur); cur = ''; }
    });
    if (cur) {
      if (groups.length && countWords(cur) < 14) groups[groups.length - 1] += ' ' + cur;
      else groups.push(cur);
    }

    var MAX = 24;
    var partial = groups.length > MAX;
    if (partial) groups = groups.slice(0, MAX);

    var t = 0;
    var segments = groups.map(function (g, i) {
      var words = countWords(g);
      var dur = (words / WPM) * 60;
      var start = t;
      t += dur;
      var kw = keywords(g, 4);
      var mood = moodFor(g, i);
      var terms = [];
      if (kw.length >= 2) terms.push(kw[0] + ' ' + kw[1]);
      else if (kw.length === 1) terms.push(kw[0]);
      if (kw.length >= 4) terms.push(kw[2] + ' ' + kw[3]);
      else if (kw.length >= 3) terms.push(kw[2] + ' close up');
      terms.push(MOOD_TERMS[mood]);
      terms = terms.filter(function (x, j) { return x && terms.indexOf(x) === j; }).slice(0, 3);
      return {
        id: i + 1,
        script_text: g,
        start_time: fmtTime(start),
        end_time: fmtTime(t),
        search_terms: terms,
        clip_duration_seconds: Math.min(15, Math.max(4, Math.round(dur * 0.4))),
        mood: mood,
      };
    });

    var top = keywords(script, 2);
    var title = top.length >= 2
      ? 'The ' + top[0].charAt(0).toUpperCase() + top[0].slice(1) + ' and the ' + top[1].charAt(0).toUpperCase() + top[1].slice(1)
      : 'Untitled Essay';

    return {
      video_title_suggestion: title,
      estimated_runtime_seconds: Math.round(t),
      segments: segments,
      partial: partial,
    };
  }

  var SAMPLE_SCRIPT = [
    'Every city has an hour when it belongs to nobody. The shops are shuttered, the trains run empty, and the streetlights hum their one long note over wet asphalt. This is the hour the essay begins.',
    'I used to think discipline meant noise — alarms, deadlines, a coach barking counts in a cold gym. But the strongest people I ever filmed were quiet. A boxer wrapping his hands in silence. A baker flouring the bench before the ovens wake. Their fight happened long before anyone watched.',
    'Writing is the same kind of fight. You sit at a small desk under a small lamp and you go the full twelve rounds with a blank page. Nobody cheers. The page does not care. You show up anyway, night after night, and the work accumulates like snowfall on a windowsill.',
    'Stock footage gets a bad reputation, and some of it is earned. But choose carefully and the borrowed image becomes confession. Rain on a train window is every leaving you never explained. A kitchen light at three in the morning is every doubt you ever fed.',
    'So this is the method. Write the truest sentence you can. Find the picture that admits it. Cut until only the fight remains — the quiet one, the one worth filming.',
  ].join('\n\n');

  window.QFCEngine = {
    WPM: WPM,
    countWords: countWords,
    fmtTime: fmtTime,
    map: map,
    SAMPLE_SCRIPT: SAMPLE_SCRIPT,
  };
})();
