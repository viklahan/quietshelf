/**
 * Icon — Quiet Shelf's inlined lucide subset (2px stroke, quiet and consistent).
 */
export interface IconProps {
  /** Icon name, e.g. "feather", "search", "clock", "circle-check", "copy" */
  name:
    | 'feather' | 'pen-line' | 'film' | 'clapperboard' | 'search' | 'clock'
    | 'sparkles' | 'circle-check' | 'check' | 'copy' | 'rotate-ccw' | 'x'
    | 'circle-alert' | 'external-link' | 'list-checks' | 'book-open'
    | 'file-text' | 'arrow-right';
  /** Pixel size. Default 16 — icons stay small and quiet. */
  size?: number;
  /** Stroke width. Default 2. */
  strokeWidth?: number;
  /** Stroke color. Default 'currentColor'. */
  color?: string;
  /** Accessible title; omit for decorative icons. */
  title?: string;
  style?: React.CSSProperties;
  className?: string;
}
