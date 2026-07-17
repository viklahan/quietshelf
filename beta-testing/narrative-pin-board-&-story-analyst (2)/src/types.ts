export interface CorkboardItem {
  id: string;
  type: 'character' | 'note' | 'document' | 'title' | 'storyboard';
  title: string;
  subtitle?: string;
  content: string;
  x: number;
  y: number;
  color: string;
  image_path?: string;
  tags?: string[];
  meta?: {
    role?: string;
    traits?: string[];
    motivation?: string;
    eyeColor?: string;
    handedness?: string;
    backstory?: string;
    customImage?: string;
  };
}

export interface CorkboardThread {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  color: string;
  thickness?: number;
}

export interface TimelineMilestone {
  id: string;
  chapter: string;
  character: string;
  description: string;
  developmentType: 'positive' | 'negative' | 'neutral' | 'stable';
  emotionalState: string;
  sentimentScore: number;
}

export interface ChapterSentiment {
  id: string;
  chapterName: string;
  score: number; // -1.0 to +1.0
  dominantEmotion: string;
  keywords: string[];
  summary: string;
}

export interface ConsistencyFact {
  fact: string;
  establishedIn: string;
  isConsistent: boolean;
  warningMessage?: string;
}

export interface ConsistencyProfile {
  id: string;
  characterName: string;
  facts: ConsistencyFact[];
  overallScore: number; // 0 to 100
  warnings: string[];
}

export interface DialogueExample {
  quote: string;
  subtext: string;
  recommendation: string;
}

export interface DialogueReview {
  id: string;
  characterName: string;
  naturalnessScore: number; // 0 to 100
  pacingScore: number; // 0 to 100
  feedback: string;
  examples: DialogueExample[];
}

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  cursorX: number;
  cursorY: number;
  lastActive: string;
}

export interface CollabLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

export interface AnalysisResponse {
  title: string;
  description: string;
  items: CorkboardItem[];
  threads: CorkboardThread[];
  timeline: TimelineMilestone[];
  sentiments: ChapterSentiment[];
  consistency: ConsistencyProfile[];
  dialogue: DialogueReview[];
}
