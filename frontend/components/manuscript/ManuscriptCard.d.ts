/**
 * ManuscriptCard — the signature element: one shot-list segment styled like an
 * index card from a writer's desk. Found ⇒ faded with an ember "found" stamp.
 * @startingPoint section="Components" subtitle="The signature shot-list segment card" viewport="700x340"
 */
export interface ManuscriptCardProps {
  /** Segment number (1-based; rendered zero-padded, e.g. "03"). */
  index: number;
  /** e.g. "0:42" */
  startTime: string;
  /** e.g. "1:05" */
  endTime: string;
  /** The script passage, typeset like a pull-quote. */
  excerpt: string;
  /** Mood tag, e.g. "hopeful", "tense". */
  mood?: string;
  /** Stamp tone for the mood. Default 'neutral'. */
  moodTone?: 'neutral' | 'ember' | 'oxblood' | 'paper';
  /** Suggested clip length in seconds. */
  clipDurationSeconds?: number;
  /** Search terms, ranked — the first renders as "best bet". */
  terms: string[];
  /** Whether the user has found a clip for this segment. */
  found?: boolean;
  onFoundChange?: (found: boolean) => void;
  style?: React.CSSProperties;
  className?: string;
}
