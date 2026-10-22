// DUV Swiss Grid — component types (documentation; the bundle assigns window.DUV).
import type { ReactNode, ButtonHTMLAttributes } from "react";

export interface NavItem { label: string; href?: string }

/** Navy (light) / near-black (dark) header band with the white DUV logo, uppercase nav and search. */
export interface SiteHeaderProps {
  /** Uploaded white logo (`duv_logo_with_name_white.png`). Without it the name is set in type. */
  logoSrc?: string;
  /** Defaults to Calendar, Results, Rankings, Records, Countries. */
  items?: NavItem[];
  /** Label of the current section; gets aria-current and the red underline. */
  active?: string;
  homeHref?: string;
  /** false hides the search field. */
  search?: boolean;
  className?: string;
}

/** Underlined search input; `onHeader` for use on the header band. */
export interface SearchFieldProps {
  id?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  onHeader?: boolean;
  onChange?: (e: unknown) => void;
  className?: string;
}

/** Square, uppercase condensed button. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = DUV red fill; ink = solid ink; secondary = outline; ghost = text only. Default primary. */
  variant?: "primary" | "ink" | "secondary" | "ghost";
  /** md = 44px tall (default), sm = 36px. */
  size?: "md" | "sm";
  children?: ReactNode;
}

export interface ChipOption { value: string; label: string }
/** Single-select row of square filter chips; the active one is filled with ink. */
export interface FilterChipsProps {
  options: Array<string | ChipOption>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Accessible name of the group. */
  label?: string;
  className?: string;
}

/** Uppercase condensed label: race type, IAU label, status. */
export interface TagProps {
  /** default = ink, muted = steel, brand = red text, solid = red fill (DUV-Cup). */
  tone?: "default" | "muted" | "brand" | "solid";
  /** Adds a 6px status dot before the word. */
  status?: "success" | "warning";
  children: ReactNode;
  className?: string;
}

/** Compact record marker placed after a performance. */
export interface RecordMarkerProps {
  kind: "WR" | "AR" | "NR" | "CR" | "PB";
  /** Age class: "M50" gives "NR M50". */
  category?: string;
  /** Ratifying body when a better unratified mark exists: outlined. */
  body?: "IAU" | "GOMU";
  title?: string;
  className?: string;
}

/** Page header on the 12-column grid: kicker + title over 8 columns, meta right-aligned over 4. */
export interface PageHeaderProps {
  kicker?: ReactNode;
  title: ReactNode;
  /** Lines of meta (date, place, finishers); an array becomes one line each. */
  meta?: ReactNode | ReactNode[];
  className?: string;
}

/** Uppercase section heading on a 3px ink rule, with an optional muted aside. */
export interface SectionHeadingProps {
  children: ReactNode;
  aside?: ReactNode;
  id?: string;
  as?: "h2" | "h3";
  className?: string;
}

export interface StatItem { label: ReactNode; value: ReactNode; unit?: string; detail?: ReactNode }
/** Key facts / podium: big figures between a 6px ink rule and hairline dividers. */
export interface StatStripProps {
  items: StatItem[];
  /** Defaults to the number of items. */
  columns?: number;
  className?: string;
}

export interface ResultRow {
  id?: string;
  rank: string | number;
  perf: string;
  name: string;
  href?: string;
  club?: string;
  nat: string;
  yob?: string;
  cat?: string;
  catRank?: string | number;
  speed?: string;
  marker?: RecordMarkerProps;
}
/** Event results table: two-digit condensed rank (winner in red), tabular figures, 3px ink head rule. */
export interface ResultsTableProps {
  rows: ResultRow[];
  /** Unit after each performance; default "km" ("" for times). */
  unit?: string;
  /** Row id (or rank) to paint in `highlight`. */
  highlight?: string | number;
  caption?: string;
  className?: string;
}

export interface CalendarItem {
  id?: string;
  day: string;
  weekday: string;
  name: string;
  href?: string;
  edition?: string;
  place: string;
  nat?: string;
  distance: string;
  type: string;
  cup?: string;
}
/** Race calendar rows under a 6px ink rule: big day number, race, distance, type. */
export interface CalendarListProps {
  items: CalendarItem[];
  className?: string;
}

/** A `surface` block with a hairline outline and panel padding. */
export interface PanelProps {
  label?: string;
  children: ReactNode;
  className?: string;
}
