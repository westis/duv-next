// The runner page's data model ("career ledger"): DUV's runner profile turned
// into seasons of races with their splits folded under them, the personal-best
// ladder with yearly bests, and the trail group. Pure functions, no fetching.
// Relative imports: vitest has no "@/" alias.
import { cleanDuv, parseDecimal, parsePerformance } from "../../../lib/format";
import type { PersonPBsForDistance, PersonPerformance, PersonYear } from "../../../lib/duv/types";

/** Fields the live mgetresultperson.php sends beyond the typed ones. */
export type LivePerformance = PersonPerformance &
  Partial<{
    EvtDateIso: string;
    EvtCity: string;
    EvtCountryCode: string;
    /** DUV EventType: "2" is trail (see `lib/tags.ts`). */
    EvtType: string;
    /** Race series id (the editions' ParentID). */
    EvtParent: string;
    /** The EventID this result is a split or parallel scoring of, "0" when none. */
    EvtPartOf: string;
    PerfNum: string;
  }>;

export type Championship = "world" | "continental";

export interface LedgerRow {
  id: string;
  name: string;
  /** DUV date ("17.-18.09.2022"). */
  date: string;
  /** ISO start ("2022-09-17 10:00:00"), for sorting. */
  iso: string;
  /** "24h", "100km", "83.7km" as DUV sends it. */
  dist: string;
  perf: string;
  series: string;
  partOf: string;
  type: string;
  trail: boolean;
  overall: string;
  gender: string;
  genderRank: string;
  cat: string;
  catRank: string;
  championship?: Championship;
  /** Equals the runner's PB at this standard distance (DUV profile). */
  pb: boolean;
}

export interface LedgerGroup {
  /** The row shown: the race, or its championship scoring when the same run was scored twice. */
  main: LedgerRow;
  /** The same run scored in another classification (open race, combined, EC as well as WC). */
  also: LedgerRow[];
  /** Intermediate results (100 km split of a 24 h), longest first. */
  splits: LedgerRow[];
}

export interface LedgerYear {
  year: string;
  /** DUV's own count and sum for the season. */
  events: number | null;
  km: number | null;
  groups: LedgerGroup[];
}

export function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (m, n: string) => {
      const code = Number(n);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    })
    .replace(/&#x([0-9a-f]+);/gi, (m, n: string) => {
      const code = parseInt(n, 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    })
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** "24h" / "24 h" / "6d" → true. */
export function isTimedDistance(dist: string): boolean {
  return /^\d+(?:[.,]\d+)?\s*[hd]$/i.test(cleanDuv(dist));
}

/** Distance key for filters and PB lookups: "100 km" → "100km". */
export function distKey(dist: string): string {
  return cleanDuv(dist).replace(/\s+/g, "").toLowerCase();
}

/** Hours of a timed distance ("24h" → 24, "6d" → 144); km of a fixed one ("50mi" → 80.47). */
function distSize(dist: string): { timed: boolean; value: number } | null {
  const m = distKey(dist).match(/^(\d+(?:[.,]\d+)?)(km|mi|h|d)$/);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  switch (m[2]) {
    case "h":
      return { timed: true, value: n };
    case "d":
      return { timed: true, value: n * 24 };
    case "mi":
      return { timed: false, value: n * 1.609344 };
    default:
      return { timed: false, value: n };
  }
}

/** Ladder order: timed events longest first, then distances longest first. */
export function compareDistances(a: string, b: string): number {
  const sa = distSize(a);
  const sb = distSize(b);
  if (!sa || !sb) return sa ? -1 : sb ? 1 : a.localeCompare(b);
  if (sa.timed !== sb.timed) return sa.timed ? -1 : 1;
  return sb.value - sa.value;
}

/** Championship scorings named the IAU way ("IAU 24h WC Taipei", "IAU 100km European Championship"). */
export function championshipOf(name: string): Championship | undefined {
  if (!/\bIAU\b/.test(name)) return undefined;
  if (/\b(WC|World\s+Ch(ampionships?)?)\b/i.test(name)) return "world";
  if (/\b(EC|European\s+Ch(ampionships?)?|AC|Asian\s+Ch|PAC|Oceania\s+Ch)\b/i.test(name)) return "continental";
  return undefined;
}

/** Whether two DUV performances are the same mark ("6:50:34 h" and "6:50:34"). */
export function sameMark(a: string, b: string): boolean {
  const pa = parsePerformance(a);
  const pb = parsePerformance(b);
  if (!pa || !pb) return cleanDuv(a) === cleanDuv(b);
  return pa.kind === pb.kind && Math.abs(pa.value - pb.value) < 0.0005;
}

/** Km covered: the perf for a timed split, the distance for a fixed one. */
function coveredKm(row: LedgerRow): number {
  const size = distSize(row.dist);
  if (size && !size.timed) return size.value;
  const perf = parsePerformance(row.perf);
  return perf?.kind === "distance" ? perf.value : 0;
}

/** The runner's PB per distance key, from AllPBs. */
export function pbByDistance(pbs: Record<string, PersonPBsForDistance>[] | null | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of pbs ?? []) {
    for (const [dist, data] of Object.entries(entry)) {
      const pb = cleanDuv(data?.PB);
      if (pb) map.set(distKey(dist), pb);
    }
  }
  return map;
}

function toRow(perf: LivePerformance, pbs: Map<string, string>): LedgerRow {
  const name = decodeEntities(cleanDuv(perf.EvtName));
  const trail = cleanDuv(perf.EvtType) === "2";
  const dist = cleanDuv(perf.EvtDist);
  const pb = pbs.get(distKey(dist));
  return {
    id: cleanDuv(perf.EvtID),
    name,
    date: cleanDuv(perf.EvtDate),
    iso: cleanDuv(perf.EvtDateIso),
    dist,
    perf: cleanDuv(perf.Perf),
    series: cleanDuv(perf.EvtParent),
    partOf: cleanDuv(perf.EvtPartOf) || "0",
    type: cleanDuv(perf.EvtType),
    trail,
    overall: cleanDuv(perf.RankOverall),
    gender: cleanDuv(perf.Gender),
    genderRank: cleanDuv(perf.RankMW),
    cat: cleanDuv(perf.Cat),
    catRank: cleanDuv(perf.RankCat),
    championship: championshipOf(name),
    // Trail results never count toward a standard-distance PB.
    pb: !trail && !!pb && sameMark(perf.Perf, pb),
  };
}

/**
 * Seasons newest first, each with its races newest first. A result whose
 * EvtPartOf names another result of this runner folds under it: as a split
 * when it is an intermediate mark, as "also scored as" when it is the same run
 * in another classification. The championship scoring leads such a group.
 */
export function buildLedger(
  years: PersonYear[] | null | undefined,
  pbs: Record<string, PersonPBsForDistance>[] | null | undefined
): LedgerYear[] {
  const pbMap = pbByDistance(pbs);
  const all: { year: PersonYear; row: LedgerRow; index: number }[] = [];
  let index = 0;
  for (const year of years ?? []) {
    for (const perf of year.PerfsPerYear ?? []) {
      all.push({ year, row: toRow(perf as LivePerformance, pbMap), index: index++ });
    }
  }
  const byId = new Map(all.map((entry) => [entry.row.id, entry.row]));

  const rootOf = (row: LedgerRow): LedgerRow => {
    let current = row;
    const seen = new Set<string>();
    while (current.partOf !== "0" && byId.has(current.partOf) && !seen.has(current.id)) {
      seen.add(current.id);
      const parent = byId.get(current.partOf)!;
      if (parent.id === current.id) break;
      current = parent;
    }
    return current;
  };

  const rootId = new Map(all.map(({ row }) => [row.id, rootOf(row).id]));
  // Splits whose race is missing from the profile (the runner has no result in
  // the full race) still belong together: the longest one leads them.
  const orphans = new Map<string, LedgerRow[]>();
  for (const { row } of all) {
    if (rootId.get(row.id) !== row.id || row.partOf === "0") continue;
    orphans.set(row.partOf, [...(orphans.get(row.partOf) ?? []), row]);
  }
  for (const set of Array.from(orphans.values())) {
    if (set.length < 2) continue;
    const lead = set.reduce((best, r) => (coveredKm(r) > coveredKm(best) ? r : best), set[0]);
    const others = new Set(set.filter((r) => r !== lead).map((r) => r.id));
    for (const [id, root] of Array.from(rootId.entries())) if (others.has(root)) rootId.set(id, lead.id);
  }

  const members = new Map<string, LedgerRow[]>();
  for (const { row } of all) {
    const root = rootId.get(row.id)!;
    if (root === row.id) continue;
    const list = members.get(root) ?? [];
    list.push(row);
    members.set(root, list);
  }

  const out: LedgerYear[] = [];
  for (const year of years ?? []) {
    const groups: LedgerGroup[] = [];
    for (const perf of year.PerfsPerYear ?? []) {
      const row = byId.get(cleanDuv(perf.EvtID));
      if (!row || rootId.get(row.id) !== row.id) continue;
      if (groups.some((g) => g.main.id === row.id || g.also.some((a) => a.id === row.id))) continue;
      const children = members.get(row.id) ?? [];
      const parallel = [row, ...children.filter((c) => c.dist === row.dist && sameMark(c.perf, row.perf))];
      const splits = children
        .filter((c) => !parallel.includes(c))
        .sort((a, b) => coveredKm(b) - coveredKm(a));
      // The championship's own scoring leads, not "all races combined" or the open race.
      const plain = (r: LedgerRow) => !/combined|open race|all races/i.test(r.name);
      const lead =
        parallel.find((r) => r.championship === "world" && plain(r)) ??
        parallel.find((r) => r.championship === "continental" && plain(r)) ??
        parallel.find((r) => r.championship) ??
        row;
      const main = { ...lead, pb: parallel.some((r) => r.pb) };
      groups.push({ main, also: parallel.filter((r) => r !== lead), splits });
    }
    groups.sort((a, b) => (b.main.iso && a.main.iso ? b.main.iso.localeCompare(a.main.iso) : 0));
    out.push({
      year: cleanDuv(year.Year),
      events: parseDecimal(year.EvtCnt),
      km: parseDecimal(year.KmSum),
      groups,
    });
  }
  return out.filter((y) => y.groups.length > 0);
}

export type LedgerFilter = { kind: "all" } | { kind: "trail" } | { kind: "other" } | { kind: "dist"; key: string };

export function parseLedgerFilter(value: string | undefined): LedgerFilter {
  const v = (value ?? "").trim().toLowerCase();
  if (!v || v === "all") return { kind: "all" };
  if (v === "trail") return { kind: "trail" };
  if (v === "other") return { kind: "other" };
  return { kind: "dist", key: distKey(v) };
}

/** Not trail and not one of the runner's PB distances (Spartathlon, Comrades). */
export function isOtherDistance(row: LedgerRow, pbKeys: Set<string>): boolean {
  return !row.trail && !pbKeys.has(distKey(row.dist));
}

/**
 * Keeps the groups that match: by the race itself or, for a distance, by one
 * of its splits too (the 100 mi PB inside a 24 h). `open` marks groups whose
 * match is a split, so the page can show it unfolded.
 */
export function filterLedger(
  years: LedgerYear[],
  filter: LedgerFilter,
  pbKeys: Set<string>
): { years: LedgerYear[]; open: Set<string> } {
  const open = new Set<string>();
  if (filter.kind === "all") return { years, open };
  const matches = (row: LedgerRow) =>
    filter.kind === "trail"
      ? row.trail
      : filter.kind === "other"
        ? isOtherDistance(row, pbKeys)
        : !row.trail && distKey(row.dist) === filter.key;
  const kept = years
    .map((year) => ({
      ...year,
      groups: year.groups.filter((g) => {
        if (matches(g.main)) return true;
        if (filter.kind === "dist" && g.splits.some(matches)) {
          open.add(g.main.id);
          return true;
        }
        return false;
      }),
    }))
    .filter((year) => year.groups.length > 0);
  return { years: kept, open };
}

export interface SeasonBar {
  year: string;
  km: number;
  events: number;
  /** Has results this season (gap years are kept as empty bars). */
  raced: boolean;
}

/** One bar per calendar year from the first season to the last, gaps included. */
export function seasonBars(years: PersonYear[] | null | undefined): SeasonBar[] {
  const known = new Map<number, { km: number; events: number }>();
  for (const y of years ?? []) {
    const year = Number(cleanDuv(y.Year));
    if (!Number.isInteger(year)) continue;
    known.set(year, { km: parseDecimal(y.KmSum) ?? 0, events: parseDecimal(y.EvtCnt) ?? 0 });
  }
  if (!known.size) return [];
  const list = Array.from(known.keys());
  const first = Math.min(...list);
  const last = Math.max(...list);
  const bars: SeasonBar[] = [];
  for (let year = first; year <= last; year++) {
    const k = known.get(year);
    bars.push({ year: String(year), km: k?.km ?? 0, events: k?.events ?? 0, raced: !!k });
  }
  return bars;
}

export interface YearBest {
  year: number;
  perf: string;
  /** Seconds or km. */
  value: number;
  /** DUV's "(rank international/national)" text without the brackets: "32/1". */
  rank: string;
}

export interface PbLine {
  dist: string;
  pb: string;
  /** The season the PB was set (first season with that mark). */
  pbYear: number | null;
  kind: "time" | "distance";
  bests: YearBest[];
}

/** The personal-best ladder: one line per standard distance, timed events first. */
export function pbLadder(pbs: Record<string, PersonPBsForDistance>[] | null | undefined): PbLine[] {
  const lines: PbLine[] = [];
  for (const entry of pbs ?? []) {
    for (const [dist, data] of Object.entries(entry)) {
      const pb = cleanDuv(data?.PB);
      if (!pb) continue;
      const bests: YearBest[] = [];
      for (const [key, value] of Object.entries(data)) {
        if (!/^\d{4}$/.test(key) || !value || typeof value !== "object") continue;
        const parsed = parsePerformance(value.Perf);
        if (!parsed || parsed.kind === "laps") continue;
        bests.push({
          year: Number(key),
          perf: cleanDuv(value.Perf),
          value: parsed.value,
          rank: cleanDuv(value.RankIntNat).replace(/^\(|\)$/g, "").trim(),
        });
      }
      bests.sort((a, b) => a.year - b.year);
      const kind = parsePerformance(pb)?.kind === "time" ? "time" : "distance";
      lines.push({
        dist,
        pb,
        pbYear: bests.find((b) => sameMark(b.perf, pb))?.year ?? null,
        kind,
        bests,
      });
    }
  }
  return lines.sort((a, b) => compareDistances(a.dist, b.dist));
}

/** Gender wins among the races (each run counted once, splits not counted). */
export function countWins(years: LedgerYear[]): number {
  return years.reduce((sum, y) => sum + y.groups.filter((g) => g.main.genderRank === "1").length, 0);
}

/**
 * A split's own part of its name: "IAU 24h WC Taipei - 12h Split" under
 * "IAU 24h WC Taipei" gives "12h Split". `parents` are the names of the race's
 * scorings; the full name comes back when none is a prefix.
 */
export function splitLabel(split: string, parents: string[]): string {
  const s = split.trim();
  for (const parent of [...parents].sort((a, b) => b.length - a.length)) {
    const p = parent.trim();
    if (p && s.toLowerCase().startsWith(p.toLowerCase())) {
      const rest = s.slice(p.length).replace(/^[\s\-–—:,(]+/, "").replace(/\)$/, "").trim();
      if (rest) return rest;
    }
  }
  // Siblings named "<race> - 6h Split" and "<race> - 100km Split": the part after the shared race name.
  for (const parent of parents) {
    let n = 0;
    while (n < s.length && n < parent.length && s[n].toLowerCase() === parent[n].toLowerCase()) n++;
    const cut = s.slice(0, n).lastIndexOf(" - ");
    if (cut > 0 && s.slice(cut + 3).trim()) return s.slice(cut + 3).trim();
  }
  return s;
}
