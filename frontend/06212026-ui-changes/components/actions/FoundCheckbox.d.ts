/**
 * FoundCheckbox — the satisfying "Found it" check used on manuscript cards.
 */
export interface FoundCheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  /** Label text. Default "Found it". */
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}
