// URL query params for the race results page. Names match the DUV API
// (mgetresultevent.php) so links are shareable and map 1:1 to the request.

export const PER_PAGE_OPTIONS = [50, 100, 250, 500] as const;
export const DEFAULT_PER_PAGE = 100;

export interface ResultsQuery {
  cat?: string;
  country?: string;
  /** 1 = km/h, 2 = min/km */
  speed?: number;
  /** 1 = German categories, 2 = international, 3 = event-specific */
  aktype?: number;
  page: number;
  perpage: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function code(value: string | string[] | undefined) {
  const v = first(value)?.trim();
  if (!v || v.toLowerCase() === "all") return undefined;
  return /^[\w-]{1,12}$/.test(v) ? v : undefined;
}

function int(value: string | string[] | undefined, allowed?: readonly number[]) {
  const n = Number(first(value));
  if (!Number.isInteger(n) || n < 1) return undefined;
  if (allowed && !allowed.includes(n)) return undefined;
  return n;
}

export function parseResultsQuery(params: RawParams): ResultsQuery {
  return {
    cat: code(params.cat),
    country: code(params.country),
    speed: int(params.speed, [1, 2]),
    aktype: int(params.aktype, [1, 2, 3]),
    page: int(params.page) ?? 1,
    perpage: int(params.perpage, PER_PAGE_OPTIONS) ?? DEFAULT_PER_PAGE,
  };
}

export function hasActiveFilters(query: ResultsQuery) {
  return Boolean(query.cat || query.country);
}

/** Builds a query string, dropping defaults so URLs stay short. */
export function resultsQueryString(query: Partial<ResultsQuery>) {
  const params = new URLSearchParams();
  if (query.cat) params.set("cat", query.cat);
  if (query.country) params.set("country", query.country);
  if (query.aktype) params.set("aktype", String(query.aktype));
  if (query.speed) params.set("speed", String(query.speed));
  if (query.perpage && query.perpage !== DEFAULT_PER_PAGE)
    params.set("perpage", String(query.perpage));
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const str = params.toString();
  return str ? `?${str}` : "";
}

export interface FilterOption {
  value: string;
  label: string;
}

/** Zips the API's parallel Flt*Values / Flt*Labels arrays. */
export function zipOptions(
  values?: (string | number)[],
  labels?: string[]
): FilterOption[] {
  return (values ?? []).map((value, i) => ({
    value: String(value),
    label: labels?.[i] ?? String(value),
  }));
}
