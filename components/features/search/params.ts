// URL query params for /search. Names match the DUV API (sname, fname, nat,
// exact, fuzzy, dist, page) so links stay shareable and map 1:1 to the API.

export type SearchType = "all" | "runner" | "event";

export interface SearchQuery {
  type: SearchType;
  sname: string;
  fname: string;
  nat: string;
  exact: boolean;
  fuzzy: boolean;
  dist: string;
  /** Runner page (DUV pages runners). */
  page: number;
  /** Race page (races are grouped here, then paged). */
  rpage: number;
  /** Races as one row per edition instead of grouped into races. */
  editions: boolean;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function parseSearchQuery(raw: RawParams): SearchQuery {
  const type = first(raw.type);
  const page = Number.parseInt(first(raw.page), 10);
  const rpage = Number.parseInt(first(raw.rpage), 10);
  return {
    type: type === "runner" || type === "event" ? type : "all",
    // `q` is accepted as an alias so `/search?q=...` works too
    sname: first(raw.sname) || first(raw.q),
    fname: first(raw.fname),
    nat: first(raw.nat).toUpperCase(),
    exact: first(raw.exact) === "1",
    fuzzy: first(raw.fuzzy) === "1",
    dist: first(raw.dist),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    rpage: Number.isFinite(rpage) && rpage > 0 ? rpage : 1,
    editions: first(raw.editions) === "1",
  };
}

/** Builds a /search URL, dropping empty and default values. */
export function searchHref(query: Partial<SearchQuery>) {
  const params = new URLSearchParams();
  if (query.type && query.type !== "all") params.set("type", query.type);
  if (query.sname) params.set("sname", query.sname);
  if (query.fname) params.set("fname", query.fname);
  if (query.nat) params.set("nat", query.nat);
  if (query.exact) params.set("exact", "1");
  if (query.fuzzy) params.set("fuzzy", "1");
  if (query.dist) params.set("dist", query.dist);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.rpage && query.rpage > 1) params.set("rpage", String(query.rpage));
  if (query.editions) params.set("editions", "1");
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

/** DUV treats a numeric sname with at least 2 digits as a PersonID/EventID. */
export function isIdQuery(sname: string) {
  return /^\d{2,}$/.test(sname);
}
