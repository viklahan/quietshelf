/**
 * Button — mono, letterspaced, typewriter-stamp button. One primary per view.
 * @startingPoint section="Components" subtitle="Primary, secondary, ghost and danger buttons" viewport="700x180"
 */
export interface ButtonProps {
  children: React.ReactNode;
  /** Visual weight. Default 'primary' — use it once per view. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Default 'md'. 'lg' is for the single main call to action. */
  size?: 'sm' | 'md' | 'lg';
  /** Leading icon name (see Icon). */
  icon?: string;
  /** Trailing icon name. */
  iconAfter?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  /** Accessible label when the visible text isn't sufficient. */
  ariaLabel?: string;
  style?: React.CSSProperties;
  className?: string;
}
