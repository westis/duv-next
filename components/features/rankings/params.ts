// URL state of the rankings pages. Every filter lives in the query string so a
// list can be shared; defaults are left out to keep links short. No
// server-only imports: client selects build their links with this too.

export type SearchParams = Record<string, string | string[] | undefined>;

export type RankingGender = "all" | "M" | "W";
export type RankingView = "best" | "all";

export interface RankingState {
  /** A year ("2026") or "all" for the all-time list. */
  year: string;
  /** API distance value: "100km", "24h", "6d". Ignored by the backyard list. */
  dist: string;
  gender: RankingGender;
  /** Age group ("W35") or "all". */
  cat: string;
  /** IOC code, a region number, or "all". */
  nat: string;
  /** IAU label races only. */
  iau: boolean;
  /** Net time only. */
  net: boolean;
  /** "best": a runner's other performances fold into their best row. */
  view: RankingView;
  page: number;
}

export const DEFAULT_DIST = "100km";

/** Distances DUV ranks, in rail order, when the API sends no list of its own. */
export const FALLBACK_DISTANCES = ["50km", "50mi", "100km", "100mi", "1000km", "1000mi", "6h", "12h", "24h", "48h", "72h", "6d", "10d"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** "F" is what people type for women; the API only knows "W" (it ignores "F" and sends the men's list). */
export function parseGender(value: string | undefined): RankingGender {
  const v = value?.toUpperCase();
  if (v === "M") return "M";
  if (v === "W" || v === "F") return "W";
  return "all";
}

export function parseRankingParams(sp: SearchParams, currentYear: number): RankingState {
  const year = first(sp.year);
  const page = Number(first(sp.page));
  return {
    year: year === "all" || (year && /^\d{4}$/.test(year)) ? year : String(currentYear),
    dist: first(sp.dist) || DEFAULT_DIST,
    gender: parseGender(first(sp.gender)),
    cat: first(sp.cat) || "all",
    nat: first(sp.nat) || "all",
    iau: first(sp.label) === "IAU",
    net: first(sp.tt) === "netto",
    view: first(sp.view) === "all" ? "all" : "best",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/**
 * The query string for a state (with a leading "?", or "" for the defaults).
 * Changing any filter starts again at page 1 unless `page` is in the patch.
 */
export function rankingQuery(
  state: RankingState,
  patch: Partial<RankingState> = {},
  currentYear: number,
  { backyard = false }: { backyard?: boolean } = {}
): string {
  const next = { ...state, ...patch };
  if (!("page" in patch)) next.page = 1;
  const q = new URLSearchParams();
  if (next.year !== String(currentYear)) q.set("year", next.year);
  if (!backyard && next.dist !== DEFAULT_DIST) q.set("dist", next.dist);
  if (next.gender !== "all") q.set("gender", next.gender);
  if (next.cat !== "all") q.set("cat", next.cat);
  if (next.nat !== "all") q.set("nat", next.nat);
  if (!backyard && next.iau) q.set("label", "IAU");
  if (!backyard && next.net) q.set("tt", "netto");
  if (next.view !== "best") q.set("view", next.view);
  if (next.page > 1) q.set("page", String(next.page));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export type DistanceKind = "distance" | "time";

export interface ParsedDistance {
  kind: DistanceKind;
  amount: number;
  /** "km" | "mi" for a distance, "h" | "d" for a time. */
  unit: "km" | "mi" | "h" | "d";
}

/** Reads the API's distance values: "100km", "50mi", "24h", "6d". */
export function parseDistanceValue(value: string): ParsedDistance | null {
  const m = value.trim().match(/^(\d+(?:\.\d+)?)\s*(km|mi|h|d)$/i);
  if (!m) return null;
  const unit = m[2].toLowerCase() as ParsedDistance["unit"];
  return { kind: unit === "km" || unit === "mi" ? "distance" : "time", amount: Number(m[1]), unit };
}

function sizeOf(d: ParsedDistance): number {
  if (d.unit === "mi") return d.amount * 1.609344;
  if (d.unit === "d") return d.amount * 24;
  return d.amount;
}

/** Splits the distances into fixed distances and fixed times, each from short to long. */
export function groupDistances(values: string[]): Record<DistanceKind, string[]> {
  const parsed = values
    .map((value) => ({ value, d: parseDistanceValue(value) }))
    .filter((x): x is { value: string; d: ParsedDistance } => x.d !== null);
  const pick = (kind: DistanceKind) =>
    parsed
      .filter((x) => x.d.kind === kind)
      .sort((a, b) => sizeOf(a.d) - sizeOf(b.d))
      .map((x) => x.value);
  return { distance: pick("distance"), time: pick("time") };
}
