import "server-only";

import { searchEvents, searchRunners } from "@/lib/duv";
import {
  groupRaces,
  sortByRelevance,
  toEdition,
  toRunnerRow,
  todayIso,
  type RaceEdition,
  type RaceGroup,
  type RunnerRow,
} from "./races";
import { isIdQuery } from "./params";

/** msearchevent.php needs at least 3 characters; runners work with 2. */
export const MIN_EVENT_CHARS = 3;
export const MIN_RUNNER_CHARS = 2;

export interface RunnerSearchOptions {
  fname?: string;
  nat?: string;
  exact?: boolean;
  fuzzy?: boolean;
  page?: number;
  perpage?: number;
}

export interface RunnerResult {
  rows: RunnerRow[];
  total: number;
  /** Last page the API serves (it stops after a few hundred rows). */
  maxPage: number;
  error: boolean;
}

export async function findRunners(sname: string, options: RunnerSearchOptions = {}): Promise<RunnerResult | null> {
  if (sname.length < MIN_RUNNER_CHARS) return null;
  try {
    const data = await searchRunners({
      sname,
      fname: options.fname || undefined,
      nat: options.nat || undefined,
      exact: options.exact || undefined,
      fuzzy: options.fuzzy || undefined,
      page: options.page,
      perpage: options.perpage,
    });
    return {
      rows: (data?.Hitlist ?? []).map(toRunnerRow),
      total: data?.HitCnt ?? 0,
      maxPage: data?.Pagination?.MaxPage ?? 1,
      error: false,
    };
  } catch (error) {
    console.error("Runner search failed:", error);
    return { rows: [], total: 0, maxPage: 1, error: true };
  }
}

export interface RaceResult {
  groups: RaceGroup[];
  /** Every edition, newest first (the "every edition as a row" view). */
  editions: (RaceEdition & { city: string; country: string })[];
  error: boolean;
}

export async function findRaces(sname: string, options: { dist?: string; nat?: string } = {}): Promise<RaceResult | null> {
  if (sname.length < MIN_EVENT_CHARS && !isIdQuery(sname)) return null;
  try {
    const data = await searchEvents({ sname, dist: options.dist || undefined, nat: options.nat || undefined });
    const hits = data?.Hitlist ?? [];
    const today = todayIso();
    const editions = hits
      .map((hit) => {
        const edition = toEdition(hit, today);
        return edition ? { ...edition, city: hit.City ?? "", country: hit.Country ?? "" } : null;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => b.date.localeCompare(a.date));
    return { groups: groupRaces(hits, today), editions, error: false };
  } catch (error) {
    console.error("Race search failed:", error);
    return { groups: [], editions: [], error: true };
  }
}

/** What the header's quick search shows; the browser gets it from `/search/quick`. */
export interface QuickResult {
  query: string;
  runners: RunnerRow[];
  runnerTotal: number;
  races: QuickRace[];
  raceTotal: number;
  editionTotal: number;
  /** A number typed alone: the runner and the race with that id, when they exist. */
  ids: { runner: RunnerRow | null; race: QuickRace | null };
  error: boolean;
}

/** A race group trimmed for the browser: no full edition list. */
export type QuickRace = Omit<RaceGroup, "editions">;

export const QUICK_RUNNERS = 6;
export const QUICK_RACES = 6;

/** A race group without its edition list, for the browser. */
export function withoutEditions(group: RaceGroup): QuickRace {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { editions, ...rest } = group;
  return rest;
}

export async function quickSearch(raw: string): Promise<QuickResult> {
  const query = raw.trim();
  if (isIdQuery(query)) {
    const [runners, races] = await Promise.all([findRunners(query, { perpage: 1 }), findRaces(query)]);
    const runner = runners?.rows.find((r) => r.id === query) ?? null;
    const raceGroup = races?.groups.find((g) => g.editions.some((e) => e.id === query)) ?? null;
    // An id names one edition: show that edition, not the series' latest.
    const edition = raceGroup?.editions.find((e) => e.id === query);
    const race = raceGroup && edition ? withoutEditions({ ...raceGroup, shown: edition, distances: [edition], key: query }) : null;
    return {
      query,
      runners: [],
      runnerTotal: 0,
      races: [],
      raceTotal: 0,
      editionTotal: 0,
      ids: { runner, race },
      error: Boolean(runners?.error || races?.error),
    };
  }

  const [runners, races] = await Promise.all([findRunners(query, { perpage: QUICK_RUNNERS }), findRaces(query)]);
  const groups = sortByRelevance(races?.groups ?? [], query);
  return {
    query,
    runners: runners?.rows.slice(0, QUICK_RUNNERS) ?? [],
    runnerTotal: runners?.total ?? 0,
    races: groups.slice(0, QUICK_RACES).map(withoutEditions),
    raceTotal: groups.length,
    editionTotal: races?.editions.length ?? 0,
    ids: { runner: null, race: null },
    error: Boolean(runners?.error || races?.error),
  };
}
