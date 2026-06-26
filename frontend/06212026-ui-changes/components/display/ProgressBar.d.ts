/**
 * ProgressBar — 4px quiet progress track with optional mono label.
 */
export interface ProgressBarProps {
  /** Progress from 0 to 1. */
  value: number;
  /** Optional mono uppercase label rendered above the track. */
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}
