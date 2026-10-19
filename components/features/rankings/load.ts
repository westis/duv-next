import "server-only";

import { DuvApiError, getBackyardRanking, getIntBestList, type RankingResponse } from "@/lib/duv";
import type { RankingEntry } from "@/lib/duv/types";
import type { RankingState } from "./params";
import { mergeLists } from "./rows";

export const PER_PAGE = 100;

/** Pages a list put together from parts can show (each part then loads up to this many rows). */
export const MERGED_MAX_PAGES = 5;

const AGE_GROUPS = ["U23", "23", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85", "90"];
const REGIONS = ["1", "2", "3", "4", "5", "6"];

/** How a list was loaded when DUV's server failed on the whole of it. */
export interface PartialList {
  by: "ageGroup" | "region";
  /** Parts DUV could not send: age groups ("W35", "#NA") or region values ("4"). */
  missing: string[];
}

export interface LoadedRanking {
  /** The API's response for the filter lists (from any part that loaded). */
  meta: RankingResponse | null;
  entries: RankingEntry[];
  /** Leader's row, for the gap on later pages. */
  leader: RankingEntry | null;
  page: number;
  pageCount: number;
  partial?: PartialList;
}

type Query = NonNullable<Parameters<typeof getIntBestList>[0]> & NonNullable<Parameters<typeof getBackyardRanking>[0]>;

function apiQuery(state: RankingState, backyard: boolean): Query {
  const q: Query = {
    year: state.year,
    gender: state.gender,
    cat: state.cat,
    nat: state.nat,
  };
  if (!backyard) {
    q.dist = state.dist;
    if (state.iau) q.label = "IAU";
    if (state.net) q.tt = "netto";
  }
  return q;
}

/** Marks a response that is a PHP error page rather than a list (see `isServerFailure`). */
class ServerFailure extends Error {}

async function fetchList(query: Query, backyard: boolean) {
  const data = await (backyard ? getBackyardRanking(query) : getIntBestList(query)).catch((e: unknown) => {
    // DUV answers 404 for a list with nobody in it (an age group without runners).
    if (e instanceof DuvApiError && e.status === 404) return null;
    throw e;
  });
  // The client drops PHP warnings printed before the JSON; after a fatal error
  // nothing is left but "{}". A real list, even an empty one, has RankingList.
  if (data && !("RankingList" in data)) throw new ServerFailure("DUV returned a PHP error instead of a list");
  return data;
}

/**
 * DUV's server answers some lists with a PHP fatal error instead of JSON (a
 * division by zero while it works out age grading for a runner without a usable
 * age): 2026 100 km women, the all-time 100 km list. The body is PHP warnings
 * and a fatal error, which reads as invalid JSON (502) or as an empty object.
 */
function isServerFailure(e: unknown) {
  return e instanceof ServerFailure || (e instanceof DuvApiError && e.status === 502);
}

/** Splits the failing list into parts that DUV can send, then merges them. */
async function loadInParts(state: RankingState, backyard: boolean): Promise<LoadedRanking | null> {
  const page = Math.min(state.page, MERGED_MAX_PAGES);
  const base = { ...apiQuery(state, backyard), page: 1, perpage: page * PER_PAGE };

  const attempt = async (by: PartialList["by"], values: string[], field: "cat" | "nat") => {
    const results = await Promise.all(
      values.map((value) =>
        fetchList({ ...base, [field]: value }, backyard).then(
          (data) => ({ value, data, ok: true as const }),
          (error: unknown) => {
            if (!isServerFailure(error)) throw error;
            return { value, data: null, ok: false as const };
          }
        )
      )
    );
    const loaded = results.filter((r) => r.ok);
    const missing = results.filter((r) => !r.ok).map((r) => r.value);
    return { by, loaded, missing };
  };

  // Age groups first: a whole year usually breaks on one runner without an age (#NA).
  const sexes = state.gender === "all" ? ["M", "W"] : [state.gender];
  const groups = [...sexes.flatMap((s) => AGE_GROUPS.map((g) => s + g)), "#NA"];
  let split = state.cat === "all" ? await attempt("ageGroup", groups, "cat") : null;
  // The all-time lists break in most age groups: fall back to the six regions.
  if ((!split || split.missing.length > 2) && state.nat === "all") {
    split = await attempt("region", REGIONS, "nat");
  }
  if (!split || split.loaded.length === 0) return null;

  const kind = backyard ? "backyard" : "international";
  const merged = mergeLists(
    split.loaded.map((r) => r.data?.RankingList ?? []),
    kind
  );
  const counted = split.loaded.reduce((sum, r) => {
    const p = r.data?.Pagination;
    return sum + (p ? Number(p.MaxPage) * Number(p.PageSize) : r.data?.RankingList?.length ?? 0);
  }, 0);
  const pageCount = Math.max(1, Math.min(MERGED_MAX_PAGES, Math.ceil(counted / PER_PAGE)));
  const current = Math.min(page, pageCount);
  return {
    meta: split.loaded.find((r) => r.data)?.data ?? null,
    entries: merged.slice((current - 1) * PER_PAGE, current * PER_PAGE),
    leader: merged[0] ?? null,
    page: current,
    pageCount,
    partial: { by: split.by, missing: split.missing },
  };
}

/** One page of a ranking, working around DUV's server errors where it can. */
export async function loadRanking(state: RankingState, { backyard = false } = {}): Promise<LoadedRanking> {
  const query = apiQuery(state, backyard);
  try {
    const data = await fetchList({ ...query, page: state.page, perpage: PER_PAGE }, backyard);
    const entries = data?.RankingList ?? [];
    let leader = state.page === 1 ? entries[0] ?? null : null;
    if (state.page > 1 && entries.length) {
      const top = await fetchList({ ...query, page: 1, perpage: 1, plain: true }, backyard).catch(() => null);
      leader = top?.RankingList?.[0] ?? null;
    }
    const pageCount = Math.max(1, Number(data?.Pagination?.MaxPage) || 1);
    // An empty list comes without the filter lists: take them from the plain list.
    const meta =
      data ??
      (await fetchList({ year: query.year, dist: query.dist, page: 1, perpage: 1 }, backyard).catch(() => null));
    return { meta, entries, leader, page: state.page, pageCount };
  } catch (e) {
    if (!isServerFailure(e)) throw e;
    const parts = await loadInParts(state, backyard);
    if (!parts) throw e;
    return parts;
  }
}
