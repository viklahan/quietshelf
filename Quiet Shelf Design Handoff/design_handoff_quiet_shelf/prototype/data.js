/* Quiet Shelf — sample content for the prototype.
   Believable stand-ins for what the real backend returns. No storage. */
window.QS_DATA = {
  // The book the writer is formatting in this demo.
  book: {
    title: 'The Lighthouse Keeper',
    author: 'E. M. Hale',
    fileName: 'the-lighthouse-keeper.docx',
  },

  // Tab 1 — Format. Each theme shows a SAMPLE of its real typesetting,
  // so the writer picks by feel.
  themes: [
    {
      id: 'classic',
      name: 'Classic Literary',
      note: 'Old-style serif, a drop cap, justified pages.',
      sample: 'It was the hour the lamp was lit, and the sea, for once, held its breath against the rocks below.',
      face: 'classic',
    },
    {
      id: 'cozy',
      name: 'Cozy',
      note: 'Warm, roomy leading. A fireside read.',
      sample: 'She kept the kettle on past midnight, the way her mother had, listening for the gull that never came.',
      face: 'cozy',
    },
    {
      id: 'modern',
      name: 'Modern Clean',
      note: 'Tight, quiet, plenty of air.',
      sample: 'The map said nothing of the island. He folded it anyway and set it beside the window.',
      face: 'modern',
    },
    {
      id: 'children',
      name: "Children's",
      note: 'Big, gentle, generously spaced.',
      sample: 'And the little boat went out, and out, and out — until the harbour was just a freckle of gold.',
      face: 'children',
    },
  ],

  // Tab 2 — Blurb. What "Find my words" returns.
  blurb: {
    backCover:
      'For forty years, Aldous Finch has kept the light burning over Carrick Sound — and kept his own grief just as faithfully. Then a girl washes ashore with no memory and a name he hasn’t spoken aloud since the night the sea took everything from him.\n\nAs winter closes the harbour and the lamp begins to fail, the keeper must decide what a man owes to the living, and what he can finally let the tide carry away. A luminous, tender novel about the weight we tend and the grace of setting it down.',
    taglines: [
      'Some lights are kept. Some are forgiven.',
      'Forty winters. One lamp. The grief he never let go dark.',
      'The sea gives nothing back — until it does.',
    ],
    storeDescription:
      'A quiet, deeply felt debut about an aging lighthouse keeper, a stranger from the sea, and the long work of letting go. Perfect for readers of Claire Keegan and Robert Seethaler.',
    keywords: [
      'literary fiction',
      'lighthouse',
      'grief and healing',
      'small coastal town',
      'second chances',
      'quiet literary novel',
      'book club fiction',
    ],
  },

  // Tab 3 — Promote. Segment-by-segment visual map of the writer's piece.
  promoteSourceWordCount: 1284,
  segments: [
    {
      index: 1,
      startTime: '0:00',
      endTime: '0:14',
      excerpt:
        'Before the lighthouse, before the town, there was only the rock — black, patient, and waiting for a reason to matter.',
      mood: 'Solemn',
      moodTone: 'paper',
      clipDurationSeconds: 9,
      terms: ['lone rock dark sea', 'storm waves crashing cliff', 'grey ocean horizon'],
    },
    {
      index: 2,
      startTime: '0:14',
      endTime: '0:31',
      excerpt:
        'They built the tower stone by stone, and the keeper climbed it every dusk to light a flame against the dark.',
      mood: 'Hopeful',
      moodTone: 'ember',
      clipDurationSeconds: 11,
      terms: ['lighthouse lamp lit dusk', 'hands lighting old lantern', 'spiral staircase tower'],
    },
    {
      index: 3,
      startTime: '0:31',
      endTime: '0:48',
      excerpt:
        'For forty years the light held. Ships passed safe in the night and never knew the man who kept them so.',
      mood: 'Tender',
      moodTone: 'paper',
      clipDurationSeconds: 10,
      terms: ['ship passing lighthouse night', 'beam sweeping over water', 'calm sea moonlight'],
    },
    {
      index: 4,
      startTime: '0:48',
      endTime: '1:09',
      excerpt:
        'Then one winter the sea returned what it had taken — a girl, half-drowned, with no memory and his daughter’s eyes.',
      mood: 'Turning',
      moodTone: 'oxblood',
      clipDurationSeconds: 12,
      terms: ['figure on stormy beach', 'rescue from cold water', 'winter shoreline grey'],
    },
    {
      index: 5,
      startTime: '1:09',
      endTime: '1:27',
      excerpt:
        'And the keeper learned the last thing the light had to teach him: that some things are kept by letting them go.',
      mood: 'Resolved',
      moodTone: 'ember',
      clipDurationSeconds: 11,
      terms: ['sunrise over calm harbour', 'open hands releasing', 'lighthouse dawn warm'],
    },
  ],
};
