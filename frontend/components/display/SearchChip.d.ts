/**
 * SearchChip — clickable search-term tab that opens a stock-footage search in a new tab.
 * @startingPoint section="Components" subtitle="Search-term chip with best-bet variant" viewport="700x150"
 */
export interface SearchChipProps {
  /** The search term, e.g. "rain on window night" */
  term: string;
  /** Mark this chip as the top-ranked suggestion. Default false. */
  best?: boolean;
  /** Override target URL. Defaults to a Pexels video search for the term. */
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  className?: string;
}
