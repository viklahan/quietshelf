/**
 * ScriptTextarea — a manuscript-page textarea for pasting a full script.
 * @startingPoint section="Components" subtitle="Manuscript-page script input" viewport="700x360"
 */
export interface ScriptTextareaProps {
  value: string;
  onChange?: (value: string) => void;
  /** Default: "Paste your script. Every word of it." */
  placeholder?: string;
  /** Minimum height in px. Default 280. */
  minHeight?: number;
  /** Default "Your script". */
  ariaLabel?: string;
  style?: React.CSSProperties;
  className?: string;
}
