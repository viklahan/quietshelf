/**
 * Stamp — small rubber-stamp badge for mood tags and statuses.
 */
export interface StampProps {
  /** Stamp text, e.g. "hopeful", "tense", "found" */
  children: React.ReactNode;
  /** Color tone. Default 'neutral' (muted paper outline). */
  tone?: 'neutral' | 'ember' | 'oxblood' | 'paper';
  style?: React.CSSProperties;
  className?: string;
}
