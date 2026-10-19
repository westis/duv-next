// Turns the API's ranking list into rows: a result, the gap to the leader,
// and (in the "best per runner" view) a runner's other performances folded
// into their best row. Pure functions, no React, no server-only imports.

// Relative path: vitest runs without the "@/" alias.
import {
  formatCount,
  formatDistance,
  parseDecimal,
  parsePerformance,
  type ParsedPerformance,
} from "../../../lib/format/numbers";
import type { RankingEntry } from "@/lib/duv/types";
import type { RankingView } from "./params";

export type ListKind = "international" | "backyard";

export interface RankRow {
  entry: RankingEntry;
  /** "12", or "(2)" for a runner's second performance in the list. */
  rank: string;
  /** A runner's second, third ... performance (rank in brackets). */
  repeat: boolean;
  result: ParsedPerformance | null;
  /** How far behind the leader: seconds, km or laps. 0 for the leader, null when unknown. */
  gap: number | null;
  /** Folded repeats of this runner on this page (best-per-runner view). */
  also: RankingEntry[];
}

/** DUV marks a runner's later performances with the rank in brackets: "(2)". */
export function isRepeat(rank: RankingEntry["Rank"]): boolean {
  return /^\s*\(/.test(String(rank ?? ""));
}

/** A standard backyard lap (4 1/6 miles) as DUV counts it: 114 laps are 764.484 km. */
export const BACKYARD_LAP_KM = 6.706;

/**
 * Laps of a backyard row. Some rows carry 0 laps in DUV with a distance that is
 * a whole number of standard laps (Kijimadaira, Adelaide): those laps are
 * worked out from the distance. Null when neither gives a lap count.
 */
export function backyardLaps(entry: RankingEntry): number | null {
  const laps = parseDecimal(entry.Laps);
  if (laps !== null && laps > 0) return laps;
  const km = parseDecimal(entry.Distance);
  if (km === null || km <= 0) return null;
  const n = Math.round(km / BACKYARD_LAP_KM);
  return n > 0 && Math.abs(n * BACKYARD_LAP_KM - km) < 0.002 ? n : null;
}

/**
 * The result a row is ranked by. Backyard: laps, or the distance when there is
 * no lap count. International: the performance.
 */
export function resultOf(entry: RankingEntry, kind: ListKind): ParsedPerformance | null {
  if (kind === "backyard") {
    const laps = backyardLaps(entry);
    if (laps !== null) return { kind: "laps", value: laps };
    const km = parseDecimal(entry.Distance) ?? parsePerformance(entry.Perf)?.value ?? null;
    return km !== null && km > 0 ? { kind: "distance", value: km } : null;
  }
  return parsePerformance(entry.Perf);
}

/** Behind the leader: later for a time, shorter for a distance or fewer laps. */
export function gapTo(leader: ParsedPerformance | null, result: ParsedPerformance | null): number | null {
  if (!leader || !result || leader.kind !== result.kind) return null;
  const gap = result.kind === "time" ? result.value - leader.value : leader.value - result.value;
  // Distances carry three decimals; keep the gap clean of float noise.
  return Math.max(0, Math.round(gap * 1000) / 1000);
}

/**
 * Rows for one page. `leader` is the list's first result (from page 1 when
 * this is a later page). In the "best" view a repeat folds into its runner's
 * row on this page; a repeat whose best is on an earlier page is left out.
 */
export function buildRows(
  entries: RankingEntry[],
  { kind, view, leader }: { kind: ListKind; view: RankingView; leader: ParsedPerformance | null }
): RankRow[] {
  const rows: RankRow[] = [];
  const byRunner = new Map<string, RankRow>();
  for (const entry of entries) {
    const repeat = isRepeat(entry.Rank);
    const owner = byRunner.get(entry.PersonID);
    if (view === "best" && repeat) {
      owner?.also.push(entry);
      continue;
    }
    const result = resultOf(entry, kind);
    const row: RankRow = {
      entry,
      rank: String(entry.Rank ?? "").trim(),
      repeat,
      result,
      gap: gapTo(leader, result),
      also: [],
    };
    if (!owner) byRunner.set(entry.PersonID, row);
    rows.push(row);
  }
  return rows;
}

export interface GapScale {
  /** Left end of the bar (0 on the first page). */
  lo: number;
  hi: number;
}

/**
 * The bars run from 0 (the leader) to the largest gap on page 1; on later
 * pages from the smallest to the largest gap shown, so they still spread out.
 */
export function gapScale(rows: RankRow[], page: number): GapScale | null {
  const gaps = rows.map((r) => r.gap).filter((g): g is number => g !== null);
  if (gaps.length < 2) return null;
  const hi = Math.max(...gaps);
  const lo = page > 1 ? Math.min(...gaps) : 0;
  return hi > lo ? { lo, hi } : null;
}

/** Bar length in percent, 0 to 100. */
export function gapPercent(gap: number, scale: GapScale): number {
  const pct = ((gap - scale.lo) / (scale.hi - scale.lo)) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

function better(a: ParsedPerformance | null, b: ParsedPerformance | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  if (a.kind !== b.kind) return 0;
  return a.kind === "time" ? a.value - b.value : b.value - a.value;
}

/**
 * Merges partial lists (the same ranking split by region or age group, when
 * DUV's server fails on the whole list) into one list in DUV's own form:
 * ranks count runners, a runner's later performances get "(2)", "(3)", and
 * the age group rank counts every performance in that age group, as DUV does.
 * Equal results share a rank.
 */
export function mergeLists(lists: RankingEntry[][], kind: ListKind): RankingEntry[] {
  const seen = new Set<string>();
  const all = lists
    .flat()
    .filter((e) => (seen.has(e.PerfID) ? false : (seen.add(e.PerfID), true)))
    .map((entry, i) => ({ entry, result: resultOf(entry, kind), i }))
    .sort((a, b) => better(a.result, b.result) || a.i - b.i);

  const times = new Map<string, number>();
  const catCount = new Map<string, number>();
  let runners = 0;
  let lastRank = 0;
  let lastResult: ParsedPerformance | null = null;
  return all.map(({ entry, result }) => {
    const n = (times.get(entry.PersonID) ?? 0) + 1;
    times.set(entry.PersonID, n);
    const cat = entry.CatInt || "";
    const catRank = (catCount.get(cat) ?? 0) + 1;
    catCount.set(cat, catRank);
    let rank: string | number;
    if (n > 1) {
      rank = `(${n})`;
    } else {
      runners += 1;
      const tie = lastResult && result && better(lastResult, result) === 0 && lastResult.kind === result.kind;
      lastRank = tie ? lastRank : runners;
      lastResult = result;
      rank = lastRank;
    }
    return { ...entry, Rank: rank, CatRank: cat && cat !== "#NA" ? catRank : "" };
  });
}

const MINUS = "−";

/**
 * A gap as text: "+0:57" or "+1:02:03" behind in time, "−5.111" km short,
 * "−4" laps. The unit (km, laps) is left to the caller. Empty for the leader.
 */
export function formatGap(gap: number | null, kind: ParsedPerformance["kind"], locale: string): string {
  if (gap === null || gap <= 0) return "";
  if (kind === "time") {
    const s = Math.round(gap);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = String(s % 60).padStart(2, "0");
    return h > 0 ? `+${h}:${String(m).padStart(2, "0")}:${sec}` : `+${m}:${sec}`;
  }
  if (kind === "laps") return `${MINUS}${formatCount(gap, locale) ?? gap}`;
  return `${MINUS}${formatDistance(gap, locale)?.number ?? gap}`;
}
