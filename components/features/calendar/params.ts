// URL query string <-> calendar filter state. Param names match mcalendar.php
// so a /events link maps one-to-one onto the API call. No server-only imports:
// the filter bar uses this on the client too.

export type CalendarSearchParams = Record<
  string,
  string | string[] | undefined
>;

export interface CalendarFilterState {
  /** "futur", "past1", "all" or a year. Ignored when from/to are set. */
  year: string;
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

/** Past lists read newest first, future lists soonest first. */
export function defaultOrder(year: string, to?: string): "asc" | "desc" {
  if (to) return to < new Date().toISOString().slice(0, 10) ? "desc" : "asc";
  return year === "futur" ? "asc" : "desc";
}

export function parseCalendarParams(
  sp: CalendarSearchParams,
): CalendarFilterState {
  const from = first(sp.from);
  const to = first(sp.to);
  const hasRange = !!from && !!to && ISO_DATE.test(from) && ISO_DATE.test(to);
  const year = first(sp.year) || "futur";
  const order = first(sp.order);
  const perpage = positiveInt(first(sp.perpage), DEFAULT_PER_PAGE);

  return {
    year,
    from: hasRange ? from : undefined,
    to: hasRange ? to : undefined,
    dist: first(sp.dist) || "all",
    country: first(sp.country) || "all",
    cups: first(sp.cups) || "all",
    order:
      order === "asc" || order === "desc"
        ? order
        : defaultOrder(year, hasRange ? to : undefined),
    rproof: first(sp.rproof) === "1",
    norslt: first(sp.norslt) === "1",
    splits: first(sp.splits) === "1",
    iau: first(sp.label) === "IAU",
    page: positiveInt(first(sp.page), 1),
    perpage: Math.min(perpage, 400),
  };
}

/** Builds a /events query string, leaving out defaults to keep links short. */
export function calendarQuery(state: CalendarFilterState): string {
  const q = new URLSearchParams();
  if (state.from && state.to) {
    q.set("from", state.from);
    q.set("to", state.to);
  } else if (state.year !== "futur") {
    q.set("year", state.year);
  }
  if (state.dist !== "all") q.set("dist", state.dist);
  if (state.country !== "all") q.set("country", state.country);
  if (state.cups !== "all") q.set("cups", state.cups);
  if (state.order !== defaultOrder(state.year, state.to)) {
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

export function yearLabel(year: string) {
  if (year === "futur") return "Upcoming";
  if (year === "past1") return "Past 12 months";
  if (year === "all") return "All years";
  return year;
}
