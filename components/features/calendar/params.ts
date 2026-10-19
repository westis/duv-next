// URL query string <-> calendar filter state. Param names match mcalendar.php
// so a /events link maps one-to-one onto the API call. No server-only imports:
// the filter bar uses this on the client too.

export type CalendarSearchParams = Record<
  string,
  string | string[] | undefined
>;

export interface CalendarFilterState {
  /** ISO dates. Both set, or neither: then the calendar runs from today onward. */
  from?: string;
  to?: string;
  dist: string;
  country: string;
  cups: string;
  order: "asc" | "desc";
  rproof: boolean;
  norslt: boolean;
  /** Hide splits and stages of multi-day events. */
  splits: boolean;
  /** IAU label events only. */
  iau: boolean;
  page: number;
  perpage: number;
}

export const PER_PAGE_OPTIONS = [25, 50, 100, 200];
const DEFAULT_PER_PAGE = 50;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInt(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/** Today as yyyy-mm-dd (UTC, like DUV's own "futur"). */
export function isoToday(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function shiftYears(iso: string, years: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y + years, m - 1, d));
  // 29 Feb into a common year rolls to 1 Mar; keep 28 Feb instead.
  if (date.getUTCMonth() !== m - 1) date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
}

/**
 * Old `?year=` links (the year selector is gone) as a date range: "past1" is
 * the last 12 months up to today, "2024" the whole year, "all" everything.
 * "futur" and anything unknown give null: the default, today onward.
 */
export function yearToRange(year: string | undefined, now: Date = new Date()): { from: string; to: string } | null {
  const today = isoToday(now);
  if (year === "past1") return { from: shiftYears(today, -1), to: today };
  if (year === "all") return { from: "1800-01-01", to: shiftYears(today, 10) };
  if (year && /^\d{4}$/.test(year)) return { from: `${year}-01-01`, to: `${year}-12-31` };
  return null;
}

/** A range starting before today reads newest first; one from today on, soonest first. */
export function defaultOrder(from?: string, now: Date = new Date()): "asc" | "desc" {
  return from && from < isoToday(now) ? "desc" : "asc";
}

export function parseCalendarParams(sp: CalendarSearchParams, now: Date = new Date()): CalendarFilterState {
  const fromParam = first(sp.from);
  const toParam = first(sp.to);
  const range =
    fromParam && toParam && ISO_DATE.test(fromParam) && ISO_DATE.test(toParam) && fromParam <= toParam
      ? { from: fromParam, to: toParam }
      : yearToRange(first(sp.year), now);
  const order = first(sp.order);
  const perpage = positiveInt(first(sp.perpage), DEFAULT_PER_PAGE);

  return {
    from: range?.from,
    to: range?.to,
    dist: first(sp.dist) || "all",
    country: first(sp.country) || "all",
    cups: first(sp.cups) || "all",
    order: order === "asc" || order === "desc" ? order : defaultOrder(range?.from, now),
    rproof: first(sp.rproof) === "1",
    norslt: first(sp.norslt) === "1",
    splits: first(sp.splits) === "1",
    iau: first(sp.label) === "IAU",
    page: positiveInt(first(sp.page), 1),
    perpage: Math.min(perpage, 400),
  };
}

/** Builds a /events query string, leaving out defaults to keep links short. */
export function calendarQuery(state: CalendarFilterState, now: Date = new Date()): string {
  const q = new URLSearchParams();
  if (state.from && state.to) {
    q.set("from", state.from);
    q.set("to", state.to);
  }
  if (state.dist !== "all") q.set("dist", state.dist);
  if (state.country !== "all") q.set("country", state.country);
  if (state.cups !== "all") q.set("cups", state.cups);
  if (state.order !== defaultOrder(state.from, now)) {
    q.set("order", state.order);
  }
  if (state.rproof) q.set("rproof", "1");
  if (state.norslt) q.set("norslt", "1");
  if (state.splits) q.set("splits", "1");
  if (state.iau) q.set("label", "IAU");
  if (state.perpage !== DEFAULT_PER_PAGE)
    q.set("perpage", String(state.perpage));
  if (state.page > 1) q.set("page", String(state.page));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function calendarHref(state: CalendarFilterState) {
  return `/events${calendarQuery(state)}`;
}

export interface Option {
  value: string;
  label: string;
}

export interface OptionGroup {
  options: Option[];
}

/**
 * The API sends distances as parallel value/label arrays with "" values
 * (labelled "----------") as group separators.
 */
export function groupDistances(
  values: string[],
  labels: string[],
): OptionGroup[] {
  const groups: OptionGroup[] = [{ options: [] }];
  values.forEach((value, i) => {
    if (value === "all") return;
    if (value === "") {
      if (groups[groups.length - 1].options.length)
        groups.push({ options: [] });
      return;
    }
    groups[groups.length - 1].options.push({
      value,
      label: labels[i] ?? value,
    });
  });
  return groups.filter((g) => g.options.length);
}

export function zipOptions(values: string[], labels: string[]): Option[] {
  return values
    .filter((v) => v !== "all" && v !== "")
    .map((value) => ({ value, label: labels[values.indexOf(value)] ?? value }));
}
