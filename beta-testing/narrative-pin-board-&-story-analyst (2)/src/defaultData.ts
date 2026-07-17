import { AnalysisResponse } from './types';

export const defaultGodfatherData: AnalysisResponse = {
  title: "VISUAL CHARACTER MAP: THE GODFATHER (1972)",
  description: "An interactive visualization of the Corleone Family structure, rival families, and their complex relationships during the events of the film.",
  items: [
    {
      id: "vito",
      type: "character",
      title: "DON VITO CORLEONE",
      subtitle: "The Patriarch & Founder",
      content: "The supreme Don of the Corleone family. A man of quiet strength, traditional values, and strict code of honor, who rules with a mixture of generosity and deadly violence.",
      x: 480,
      y: 350,
      color: "#1E1E1E",
      tags: ["Corleone Family", "Don"],
      meta: {
        role: "The Patriarch & Founder",
        traits: ["Calculating", "Quiet", "Traditional", "Protective"],
        motivation: "Protect the family legacy, secure the future of his children, and maintain honor.",
        eyeColor: "Brown",
        handedness: "Right-handed",
        backstory: "Born in Corleone, Sicily, fled to New York as an orphan after his family was killed by Don Ciccio. Built an olive oil import empire as a front for organized crime."
      }
    },
    {
      id: "sonny",
      type: "character",
      title: "SONNY CORLEONE",
      subtitle: "\"Santino\" Hot-Headed Eldest Son",
      content: "First-born son of Vito. Extremely hot-tempered, passionate, and aggressive. Appointed as underboss but lacks his father's cool-headed strategic patience.",
      x: 350,
      y: 200,
      color: "#991B1B",
      tags: ["Corleone Family", "Underboss"],
      meta: {
        role: "Hot-Headed Eldest Son",
        traits: ["Hot-tempered", "Protective", "Aggressive", "Passionate"],
        motivation: "Avenge disrespect to his family and destroy rivals through raw force.",
        eyeColor: "Brown",
        handedness: "Right-handed",
        backstory: "Vito's eldest son. Brought Tom Hagen home as a child. Witnessed his father's rise and eagerly joined the family enterprise."
      }
    },
    {
      id: "michael",
      type: "character",
      title: "MICHAEL CORLEONE",
      subtitle: "The Soldier & Reluctant Heir",
      content: "Vito's youngest son. A decorated WWII Marine who initially wanted nothing to do with the family business. Destined to become the most ruthless Don.",
      x: 640,
      y: 200,
      color: "#1E3A8A",
      tags: ["Corleone Family", "Successor"],
      meta: {
        role: "The Soldier & Reluctant Heir",
        traits: ["Cold", "Brilliant", "Surgical", "Reluctant"],
        motivation: "Protect his father and family, eventually fully embracing his destiny as ruler.",
        eyeColor: "Brown",
        handedness: "Right-handed",
        backstory: "A quiet college student and war hero. Becomes drawn into the cycle of violence after Don Vito is shot, executing Sollozzo and Captain McCluskey."
      }
    },
    {
      id: "fredo",
      type: "character",
      title: "FREDO CORLEONE",
      subtitle: "Weak Link Middle Son",
      content: "Vito's second son. Weak-willed, easily intimidated, and incompetent in high-stakes family business. Sent to Las Vegas and ends up feeling sidelined and resentful.",
      x: 640,
      y: 520,
      color: "#D97706",
      tags: ["Corleone Family", "Middle Son"],
      meta: {
        role: "Weak Link Middle Son",
        traits: ["Insecure", "Weak", "Affectionate", "Resentful"],
        motivation: "Gain respect and recognition from his brothers, showing he isn't useless.",
        eyeColor: "Brown",
        handedness: "Right-handed",
        backstory: "Always lived in the shadow of Sonny's bravery and Michael's intelligence. Sent to Las Vegas under the protection of Moe Greene."
      }
    },
    {
      id: "connie",
      type: "character",
      title: "CONNIE CORLEONE",
      subtitle: "The Daughter",
      content: "Vito's only daughter. Her wedding to Carlo Rizzi opens the story. Suffers domestic abuse from Carlo, who is used as a pawn to bait Sonny.",
      x: 750,
      y: 380,
      color: "#701A75",
      tags: ["Corleone Family"],
      meta: {
        role: "The Daughter",
        traits: ["Naive", "Vulnerable", "Suffering", "Emotional"],
        motivation: "Find marital happiness, but gets caught in the tragic crossfire of her family's war.",
        eyeColor: "Brown",
        handedness: "Right-handed",
        backstory: "Spoiled only daughter of the Corleone household. Marries Carlo Rizzi, a small-time crook associated with Sonny."
      }
    },
    {
      id: "tom_hagen",
      type: "character",
      title: "TOM HAGEN",
      subtitle: "Consigliere / Adopted Son",
      content: "The family lawyer and Consigliere. Adopted by Vito from the streets. Calm, logical, and deeply loyal, though not a Sicilian, which causes friction.",
      x: 350,
      y: 500,
      color: "#065F46",
      tags: ["Corleone Family", "Consigliere"],
      meta: {
        role: "Consigliere / Adopted Son",
        traits: ["Analytical", "Loyal", "Diplomatic", "Professional"],
        motivation: "Serve the Corleone family faithfully and manage legal/political affairs safely.",
        eyeColor: "Blue",
        handedness: "Right-handed",
        backstory: "Orphaned child with an eye infection, found by Sonny on the street. Raised by Vito and Carmela as their own. Graduated law school."
      }
    },
    {
      id: "lucy",
      type: "character",
      title: "LUCY MANCINI",
      subtitle: "Sonny's Mistress",
      content: "Connie's bridesmaid who engages in a passionate affair with Sonny Corleone. Later relocated to Las Vegas after Sonny's death.",
      x: 250,
      y: 280,
      color: "#BE185D",
      tags: ["Affiliates"],
      meta: {
        role: "Sonny's Mistress",
        traits: ["Passionate", "Independent", "Seductive"],
        motivation: "Live life on her own terms, attracted to Sonny's wild energy.",
        eyeColor: "Hazel",
        handedness: "Right-handed",
        backstory: "Connie's close friend. Becomes Sonny's primary mistress, causing gossip within the inner circle."
      }
    },
    {
      id: "sandra",
      type: "character",
      title: "SANDRA CORLEONE",
      subtitle: "Sonny's Wife",
      content: "Sonny's long-suffering wife and mother of his children. Tolerates Sonny's notorious infidelity for the sake of the family.",
      x: 350,
      y: 70,
      color: "#6B7280",
      tags: ["Corleone Family"],
      meta: {
        role: "Sonny's Wife",
        traits: ["Dignified", "Patient", "Long-suffering"],
        motivation: "Maintain her household and protect her children from the family violence.",
        eyeColor: "Brown",
        handedness: "Right-handed",
        backstory: "Marries Sonny Corleone, fully aware of the family's underworld status and Sonny's rampant cheating."
      }
    },
    {
      id: "apollonia",
      type: "character",
      title: "APOLLONIA VITELLI",
      subtitle: "Michael's Sicilian Wife",
      content: "The beautiful Sicilian girl Michael falls in love with and marries while in exile. Tragically killed by a car bomb intended for Michael.",
      x: 640,
      y: 70,
      color: "#0D9488",
      tags: ["Sicily Exile"],
      meta: {
        role: "Michael's Sicilian Wife",
        traits: ["Pure", "Traditional", "Enchanting", "Innocent"],
        motivation: "Love Michael and learn English to start a new life with him.",
        eyeColor: "Dark Brown",
        handedness: "Right-handed",
        backstory: "Local village beauty in Corleone, Sicily. Her father initially objects to Michael but is won over by his respect."
      }
    },
    {
      id: "clemenza",
      type: "character",
      title: "PETER CLEMENZA",
      subtitle: "Caporegime",
      content: "Loyal Capo of the Corleone family. A jovial but lethal veteran. Famously instructs Rocco to 'leave the gun, take the cannoli' after executing Paulie.",
      x: 220,
      y: 450,
      color: "#374151",
      tags: ["Corleone Family", "Capo"],
      meta: {
        role: "Caporegime",
        traits: ["Loyal", "Cheerful", "Ruthless", "Experienced"],
        motivation: "Execute Vito's orders blindly and train the next generation of soldiers.",
        eyeColor: "Brown",
        handedness: "Right-handed",
        backstory: "Old friend of Vito since his youth in Little Italy. Together with Tessio, they formed the early nucleus of the family business."
      }
    },
    {
      id: "tessio",
      type: "character",
      title: "SALVATORE TESSIO",
      subtitle: "Caporegime / The Traitor",
      content: "Sly Capo of the Corleone family. Believing the family is doomed under Michael, he conspires with Barzini but is caught and executed.",
      x: 780,
      y: 280,
      color: "#4B5563",
      tags: ["Corleone Family", "Capo"],
      meta: {
        role: "Caporegime / The Traitor",
        traits: ["Shrewd", "Practical", "Betrayer"],
        motivation: "Ensure his own regime's survival by aligning with the winning side.",
        eyeColor: "Grey",
        handedness: "Right-handed",
        backstory: "Partnered with Vito alongside Clemenza. Ran the Brooklyn territory, which was highly profitable."
      }
    },
    {
      id: "barzini",
      type: "character",
      title: "EMILIO BARZINI",
      subtitle: "The Mastermind Rival",
      content: "Don of the Barzini family. The cold, highly sophisticated mastermind behind the Five Families war. Orchestrates Sollozzo's drug trade.",
      x: 850,
      y: 120,
      color: "#1F2937",
      tags: ["Rivals", "Don"],
      meta: {
        role: "The Mastermind Rival",
        traits: ["Calculating", "Ruthless", "Polished", "Predatory"],
        motivation: "Dethrone the Corleones, dominate NY narcotics traffic, and consolidate control.",
        eyeColor: "Black",
        handedness: "Right-handed",
        backstory: "Rules the most powerful rival syndicate in New York. Subtly backed Sollozzo and Tattaglia while remaining in the shadows."
      }
    },
    {
      id: "carlo_rizzi",
      type: "character",
      title: "CARLO RIZZI",
      subtitle: "Connie's Husband / Traitor",
      content: "Connie's abusive husband. Recruited by Barzini to abuse Connie to draw Sonny out into an ambush. Later executed by Clemenza under Michael's order.",
      x: 820,
      y: 480,
      color: "#7C2D12",
      tags: ["Affiliates", "Traitor"],
      meta: {
        role: "Connie's Husband / Traitor",
        traits: ["Cowardly", "Violent", "Opportunistic"],
        motivation: "Get rich, get respect, and get out of the shadow of his brother-in-law Sonny.",
        eyeColor: "Brown",
        handedness: "Right-handed",
        backstory: "Small-time hood from northern Italy, marries Connie but is denied entry into high-level crime by Don Vito."
      }
    },
    {
      id: "meeting_sticky",
      type: "note",
      title: "The Sollozzo Meeting",
      content: "Sollozzo requests Corleone's political and legal backing for importing heroin in exchange for a 30% cut. Vito declines, saying narcotics is a dirty business that would alienate judges.",
      x: 480,
      y: 100,
      color: "#FEF08A"
    },
    {
      id: "hospital_attack",
      type: "document",
      title: "Hospital Security Report",
      content: "CONFIDENTIAL:\nDon Vito Corleone lies unguarded in a local hospital room after his bodyguards are dismissed by corrupt Captain McCluskey. Michael arrives alone, senses the trap, and relocates his father's bed just as Sollozzo's hitmen drive by.",
      x: 180,
      y: 120,
      color: "#F3F4F6"
    }
  ],
  threads: [
    { id: "t1", sourceId: "sonny", targetId: "vito", label: "Sons", color: "#EF4444" },
    { id: "t2", sourceId: "michael", targetId: "vito", label: "Sons", color: "#3B82F6" },
    { id: "t3", sourceId: "fredo", targetId: "vito", label: "Sons", color: "#F59E0B" },
    { id: "t4", sourceId: "connie", targetId: "vito", label: "Daughter", color: "#EC4899" },
    { id: "t5", sourceId: "tom_hagen", targetId: "vito", label: "Consigliere", color: "#10B981" },
    { id: "t6", sourceId: "clemenza", targetId: "vito", label: "Loyal Capo", color: "#6B7280" },
    { id: "t7", sourceId: "tessio", targetId: "vito", label: "Capo", color: "#6B7280" },
    { id: "t8", sourceId: "sonny", targetId: "lucy", label: "Mistress", color: "#EC4899" },
    { id: "t9", sourceId: "sonny", targetId: "sandra", label: "Wife", color: "#374151" },
    { id: "t10", sourceId: "michael", targetId: "apollonia", label: "Marriage", color: "#10B981" },
    { id: "t11", sourceId: "carlo_rizzi", targetId: "connie", label: "Abusive Husband", color: "#EF4444" },
    { id: "t12", sourceId: "tessio", targetId: "barzini", label: "Secret Deal / Betrayal", color: "#EF4444" },
    { id: "t13", sourceId: "carlo_rizzi", targetId: "barzini", label: "Co-Conspirator", color: "#EF4444" },
    { id: "t14", sourceId: "sonny", targetId: "hospital_attack", label: "Response", color: "#EF4444" },
    { id: "t15", sourceId: "vito", targetId: "meeting_sticky", label: "Declines", color: "#F59E0B" }
  ],
  timeline: [
    {
      id: "m1",
      chapter: "Chapter 1: The Wedding",
      character: "DON VITO CORLEONE",
      description: "Holds court in his private office during Connie's wedding, granting favors as a matter of respect and honor.",
      developmentType: "stable",
      emotionalState: "Noble & Authoritative",
      sentimentScore: 0.8
    },
    {
      id: "m2",
      chapter: "Chapter 1: The Wedding",
      character: "MICHAEL CORLEONE",
      description: "Arrives in military uniform with Kay Adams, reassuring her that 'that's my family, Kay, it's not me.' Wants no part in the syndicate.",
      developmentType: "neutral",
      emotionalState: "Reluctant & Detached",
      sentimentScore: 0.2
    },
    {
      id: "m3",
      chapter: "Chapter 2: The Shooting",
      character: "DON VITO CORLEONE",
      description: "Ambushed on the street while buying oranges; shot five times by Sollozzo's assassins. Left in critical condition.",
      developmentType: "negative",
      emotionalState: "Vulnerable & Dying",
      sentimentScore: -0.9
    },
    {
      id: "m4",
      chapter: "Chapter 2: The Shooting",
      character: "SONNY CORLEONE",
      description: "Takes charge as acting boss, launching hot-headed retaliatory strikes, heating up a deadly turf war.",
      developmentType: "negative",
      emotionalState: "Furious & Reckless",
      sentimentScore: -0.6
    },
    {
      id: "m5",
      chapter: "Chapter 3: The Hospital",
      character: "MICHAEL CORLEONE",
      description: "Saves his unguarded father at the hospital. Stays by Vito's bedside, swearing, 'I'm with you now.' His hands do not shake.",
      developmentType: "positive",
      emotionalState: "Calm & Resolute",
      sentimentScore: 0.6
    },
    {
      id: "m6",
      chapter: "Chapter 4: The Execution",
      character: "MICHAEL CORLEONE",
      description: "Shoots Sollozzo and Captain McCluskey point-blank in a Bronx diner to protect his father, marking his point of no return.",
      developmentType: "negative",
      emotionalState: "Ruthless & Hardened",
      sentimentScore: -0.8
    },
    {
      id: "m7",
      chapter: "Chapter 5: Sicily Exile",
      character: "MICHAEL CORLEONE",
      description: "Flees to Sicily, experiencing peace. Marries Apollonia but loses her in a tragic car bombing intended for him.",
      developmentType: "negative",
      emotionalState: "Tragic & Heartbroken",
      sentimentScore: -0.7
    },
    {
      id: "m8",
      chapter: "Chapter 6: Sonny's Fate",
      character: "SONNY CORLEONE",
      description: "Lured into a tollbooth trap on the Jones Beach Causeway while rushing to save Connie; gunned down in a hail of bullets.",
      developmentType: "negative",
      emotionalState: "Doomed",
      sentimentScore: -1.0
    },
    {
      id: "m9",
      chapter: "Chapter 7: The Succession",
      character: "DON VITO CORLEONE",
      description: "Convenes the Five Families commission to negotiate peace and guarantee Michael's safe return from Sicily.",
      developmentType: "stable",
      emotionalState: "Weary & Peace-seeking",
      sentimentScore: 0.4
    },
    {
      id: "m10",
      chapter: "Chapter 8: The Baptism",
      character: "MICHAEL CORLEONE",
      description: "Stands as godfather to Connie's child while his capos systematically execute the other four Dons, consolidating total control.",
      developmentType: "negative",
      emotionalState: "Machiavellian & Supreme",
      sentimentScore: -0.5
    }
  ],
  sentiments: [
    {
      id: "s1",
      chapterName: "Chapter 1: The Wedding",
      score: 0.7,
      dominantEmotion: "Celebration & Respect",
      keywords: ["wedding", "honor", "respect", "family", "loyalty"],
      summary: "Starts with positive, celebratory energy during the grand wedding, interspersed with tense back-office crime negotiations."
    },
    {
      id: "s2",
      chapterName: "Chapter 2: The Shooting",
      score: -0.8,
      dominantEmotion: "Dread & Betrayal",
      keywords: ["shooting", "ambush", "emergency", "fear", "traitor"],
      summary: "An incredibly dark chapter where Sollozzo shoots the Don, casting a shadow of absolute dread and vulnerability over the family."
    },
    {
      id: "s3",
      chapterName: "Chapter 3: The Hospital",
      score: -0.3,
      dominantEmotion: "Suspense & Vigilance",
      keywords: ["silent", "empty", "danger", "resolve", "guardian"],
      summary: "High suspense as Michael finds the hospital empty and acts as a lone guardian. Tension peaks when McCluskey beats him."
    },
    {
      id: "s4",
      chapterName: "Chapter 4: The Diner Execution",
      score: -0.9,
      dominantEmotion: "Cold Revenge",
      keywords: ["assassination", "diner", "revenge", "homicide", "escape"],
      summary: "Cold, clinical tension. The quiet humming of the Bronx diner culminates in a sudden, brutal double-killing, breaking all civil ties."
    },
    {
      id: "s5",
      chapterName: "Chapter 5: Sicily Exile",
      score: -0.2,
      dominantEmotion: "Bittersweet Solitude",
      keywords: ["countryside", "marriage", "explosion", "betrayal", "grief"],
      summary: "A beautiful, sweeping romantic peace in Sicily is utterly shattered by an explosive betrayal, reinforcing the inevitability of grief."
    },
    {
      id: "s6",
      chapterName: "Chapter 6: Sonny's Fate",
      score: -1.0,
      dominantEmotion: "Devastating Loss",
      keywords: ["ambush", "bullets", "tragedy", "brother", "death"],
      summary: "The emotional nadir. Sonny's aggressive attempt to defend his sister leads directly to his devastating, violent death at the tollbooth."
    },
    {
      id: "s7",
      chapterName: "Chapter 7: Peace Commission",
      score: 0.3,
      dominantEmotion: "Weary Truce",
      keywords: ["summit", "treaty", "pardon", "compromise", "retirement"],
      summary: "Vito seeks a weary truce to bring Michael home. Emotional tone shifts to quiet political plotting and strategic retirement."
    },
    {
      id: "s8",
      chapterName: "Chapter 8: The Baptism",
      score: -0.5,
      dominantEmotion: "Supreme Irony",
      keywords: ["baptism", "faith", "massacre", "purge", "supreme"],
      summary: "A masterful counterpoint of sacred holy vows of faith alongside cold, synchronised bloodshed. Michael achieves ultimate power."
    }
  ],
  consistency: [
    {
      id: "cp1",
      characterName: "MICHAEL CORLEONE",
      overallScore: 95,
      warnings: [],
      facts: [
        { fact: "Left-handed war wound", establishedIn: "Chapter 1", isConsistent: true },
        { fact: "Avoids hard liquor, prefers water/wine", establishedIn: "Chapter 1", isConsistent: true },
        { fact: "Has a noticeable facial bruise from McCluskey's punch", establishedIn: "Chapter 3", isConsistent: true },
        { fact: "Maintains a quiet, low speaking register after Diner incident", establishedIn: "Chapter 4", isConsistent: true }
      ]
    },
    {
      id: "cp2",
      characterName: "DON VITO CORLEONE",
      overallScore: 88,
      warnings: ["Voice hoarseness continuity flag in Chapter 7 after hospital recovery"],
      facts: [
        { fact: "Never makes an empty threat", establishedIn: "Chapter 1", isConsistent: true },
        { fact: "Suffers from severe coronary heart disease", establishedIn: "Chapter 3", isConsistent: true },
        { fact: "Hoarse raspy voice due to throat strain", establishedIn: "Chapter 7", isConsistent: false, warningMessage: "Voice is described as boomingly resonant in Chapter 7, contradicting his established raspy throat condition." }
      ]
    },
    {
      id: "cp3",
      characterName: "SONNY CORLEONE",
      overallScore: 100,
      warnings: [],
      facts: [
        { fact: "Habit of biting his knuckles when thinking", establishedIn: "Chapter 1", isConsistent: true },
        { fact: "Can never resist Connie's tears", establishedIn: "Chapter 2", isConsistent: true }
      ]
    }
  ],
  dialogue: [
    {
      id: "dr1",
      characterName: "DON VITO CORLEONE",
      naturalnessScore: 98,
      pacingScore: 95,
      feedback: "Dialogue is exceptionally powerful, relying on quiet authority, implied weight, and structured pleasantries. Sentences are deliberate, avoiding frantic interjections.",
      examples: [
        {
          quote: "I’m going to make him an offer he can’t refuse.",
          subtext: "Total control over the target's life and choices, masked under a polite business transaction offer.",
          recommendation: "Perfect. Keep the calm delivery. Do not raise the voice."
        },
        {
          quote: "A man who doesn't spend time with his family can never be a real man.",
          subtext: "Rebuking Johnny Fontane's crying and loose living, enforcing family loyalty as a metric of character.",
          recommendation: "Excellent thematic reinforcement."
        }
      ]
    },
    {
      id: "dr2",
      characterName: "SONNY CORLEONE",
      naturalnessScore: 92,
      pacingScore: 90,
      feedback: "Speech is fast, interrupted, aggressive, and highly colloquial. Frequently cuts off other speakers, representing his lack of impulse control.",
      examples: [
        {
          quote: "What's the matter with you? I think your brain is going soft with all that comedy you play with that girl.",
          subtext: "Mocking Fredo's incompetence and lack of seriousness.",
          recommendation: "Authentic, shows sibling hierarchy and dominance."
        }
      ]
    },
    {
      id: "dr3",
      characterName: "MICHAEL CORLEONE",
      naturalnessScore: 96,
      pacingScore: 94,
      feedback: "Dialogue transitions from hesitant, explanatory civilian remarks in Chapter 1 to short, highly chilling, authoritative commands in later stages.",
      examples: [
        {
          quote: "It's not personal, Sonny. It's strictly business.",
          subtext: "Justifying the murder of McCluskey and Sollozzo as a cold tactical operation rather than a emotional blood feud.",
          recommendation: "Chilling and central to his transformation."
        }
      ]
    }
  ]
};
