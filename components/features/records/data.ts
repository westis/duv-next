import "server-only";

// Data for the record board (records.html, direction A): one cell per
// discipline and gender for a scope (world, a continent, a nation), and the
// age classes of one discipline. Everything comes from `@/lib/records`, which
// caches DUV's lists and the IAU / GOMU pages for a day.
import { getBackyardRanking, getBestPerfCountry, DuvApiError } from "@/lib/duv";
import {
  AREAS,
  OVERALL,
  WORLD,
  WORLD_AGE_BANDS,
  areaOfNation,
  bodyForCell,
  getCountryBests,
  getGomuRecords,
  getIauRecords,
  getWorldBest,
  isBetter,
  isSameMark,
  type AreaCode,
  type DisciplineKey,
  type DuvBest,
  type RatifiedMark,
  type RatifyingBody,
  type RecordGender,
} from "@/lib/records";
import { bestFromRanking, bestsFromCountryList } from "@/lib/records/duv-lists";
import { resolveCell, type BoardCell } from "./cells";

const DAY = 86400;

/** The board's rows, in the order of the mockup: fixed distances, fixed times, backyard. */
export const BOARD_DISCIPLINES: DisciplineKey[] = [
  "50km",
  "50mi",
  "100km",
  "100mi",
  "1000km",
  "1000mi",
  "6h",
  "12h",
  "24h",
  "48h",
  "72h",
  "6d",
  "10d",
  "backyard",
];

export type RecordScopeRef =
  | { kind: "world" }
  | { kind: "area"; code: AreaCode }
  | { kind: "nation"; code: string };

/** Filters DUV's national lists take (mbestperfcountry `type` and `cat`). */
export interface NationFilters {
  /** "" all, "1" road, "2" track, "3" indoor. */
  type: string;
  /** "DOB" age on race day, "YOB" age by year of birth. */
  cat: "DOB" | "YOB";
}

export interface BoardRow {
  dist: DisciplineKey;
  W: BoardCell | null;
  M: BoardCell | null;
  /** The lists for this discipline could not be read. */
  failed: boolean;
}

export interface AgeRow {
  /** "U23", "23", "35" ... as DUV names the band. */
  band: string;
  W: BoardCell | null;
  M: BoardCell | null;
  /** The gender whose open record this age class holds. */
  holds: RecordGender[];
}

export interface DistanceDetail {
  dist: DisciplineKey;
  open: { W: BoardCell | null; M: BoardCell | null };
  ages: AgeRow[];
  failed: boolean;
}

const GENDERS: RecordGender[] = ["W", "M"];

function isEmptyAnswer(error: unknown) {
  return error instanceof DuvApiError && (error.status === 404 || error.status === 400);
}

/** Run `task` over `items`, at most `limit` at a time, keeping the order. */
async function mapLimit<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await task(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

interface Ratified {
  records: RatifiedMark[];
  updated: Partial<Record<RatifyingBody, string | null>>;
}

async function ratifiedSources(): Promise<Ratified> {
  const [iau, gomu] = await Promise.all([getIauRecords(), getGomuRecords()]);
  return {
    records: [...(iau?.records ?? []), ...(gomu?.records ?? [])],
    updated: { IAU: iau?.updated ?? null, GOMU: gomu?.updated ?? null },
  };
}

/** Backyard has no country lists: the top of the all-time ranking for the nation or continent. */
async function backyardBests(scope: RecordScopeRef): Promise<DuvBest[]> {
  const out: DuvBest[] = [];
  for (const gender of GENDERS) {
    try {
      if (scope.kind === "world") {
        const best = await getWorldBest("backyard", gender);
        if (best) out.push(best);
        continue;
      }
      const nat = scope.kind === "area" ? String(AREAS.indexOf(scope.code) + 1) : scope.code;
      const data = await getBackyardRanking({ year: "all", gender, nat, plain: true, perpage: 5 }, { revalidate: DAY });
      const best = bestFromRanking(data, "backyard", gender, OVERALL, scope.kind, scope.code);
      // Only keep it when DUV really filtered by the scope.
      const fits = best && (scope.kind === "area" ? areaOfNation(best.nat) === scope.code : best.nat === scope.code);
      if (best && fits) out.push(best);
    } catch (error) {
      if (!isEmptyAnswer(error)) throw error;
    }
  }
  return out;
}

/** World bests per gender and class as the best of the six continent lists (as the engine does). */
function worldOf(areaBests: DuvBest[]): DuvBest[] {
  const best = new Map<string, DuvBest>();
  for (const d of areaBests) {
    const key = `${d.gender}:${d.category}`;
    const held = best.get(key);
    if (!held || isBetter(d.value, held.value, d.dist)) best.set(key, d);
  }
  return Array.from(best.values()).map((d) => ({ ...d, scope: "world" as const, scopeCode: WORLD }));
}

async function nationList(dist: DisciplineKey, nat: string, filters: NationFilters): Promise<DuvBest[]> {
  if (dist === "backyard") return filters.type || filters.cat === "YOB" ? [] : backyardBests({ kind: "nation", code: nat });
  if (!filters.type && filters.cat === "DOB") return getCountryBests(dist, "nation", nat);
  try {
    const data = await getBestPerfCountry(
      { nat, dist, cat: filters.cat, type: filters.type || 0 },
      { revalidate: DAY }
    );
    return bestsFromCountryList(data, dist, "nation", nat);
  } catch (error) {
    if (isEmptyAnswer(error)) return [];
    throw error;
  }
}

/** DUV's bests of one discipline for the scope, every age class DUV lists. */
async function scopeBests(dist: DisciplineKey, scope: RecordScopeRef, filters: NationFilters): Promise<DuvBest[]> {
  if (scope.kind === "nation") return nationList(dist, scope.code, filters);
  if (dist === "backyard") return backyardBests(scope);
  if (scope.kind === "area") return getCountryBests(dist, "area", scope.code);
  const areas = await mapLimit(AREAS, 3, (area) => getCountryBests(dist, "area", area));
  return worldOf(areas.flat());
}

function scopeCodeOf(scope: RecordScopeRef): string {
  return scope.kind === "world" ? WORLD : scope.code;
}

function cellFor(
  dist: DisciplineKey,
  scope: RecordScopeRef,
  gender: RecordGender,
  category: string,
  bests: DuvBest[],
  ratified: Ratified
): BoardCell | null {
  const scopeKind = scope.kind === "nation" ? "nation" : scope.kind;
  const code = scopeCodeOf(scope);
  const best = bests.find((d) => d.gender === gender && d.category === category) ?? null;
  // The IAU keeps world age records from 35 up; nobody ratifies U23 or the senior class.
  const body = scope.kind === "world" && category !== OVERALL && !WORLD_AGE_BANDS.includes(category) ? null : bodyForCell(dist, scopeKind, category);
  const marks = body
    ? ratified.records.filter(
        (r) =>
          r.body === body &&
          r.dist === dist &&
          r.gender === gender &&
          r.scope === scopeKind &&
          r.scopeCode === code &&
          r.category === category
      )
    : [];
  return resolveCell({
    dist,
    scope: scopeKind,
    gender,
    category,
    best,
    ratified: marks.find((r) => r.status === "current") ?? null,
    pending: marks.filter((r) => r.status === "pending"),
    body,
    sourceUpdated: body ? ratified.updated[body] ?? null : null,
  });
}

/** One row per discipline: the open record of each gender. */
export async function loadBoard(scope: RecordScopeRef, filters: NationFilters): Promise<BoardRow[]> {
  const ratified = scope.kind === "nation" ? { records: [], updated: {} } : await ratifiedSources();
  return mapLimit(BOARD_DISCIPLINES, 4, async (dist) => {
    try {
      const bests = await scopeBests(dist, scope, filters);
      return {
        dist,
        W: cellFor(dist, scope, "W", OVERALL, bests, ratified),
        M: cellFor(dist, scope, "M", OVERALL, bests, ratified),
        failed: false,
      };
    } catch (error) {
      console.error(`[records] board ${scope.kind} ${scopeCodeOf(scope)} ${dist} failed`, error);
      return { dist, W: null, M: null, failed: true };
    }
  });
}

/** Age bands in reading order: under 23, 23 (seniors), then 35, 40 ... */
function bandOrder(band: string): number {
  if (band === OVERALL) return -2;
  if (/^U\d+$/.test(band)) return -1 + Number(band.slice(1)) / 1000;
  return Number(band) || 0;
}

/** A discipline's age classes for the scope, women and men paired per band. */
export async function loadDetail(scope: RecordScopeRef, dist: DisciplineKey, filters: NationFilters): Promise<DistanceDetail> {
  try {
    // The world's age classes come from the six continent lists, like its open marks:
    // DUV's all-time world list answers empty for most cells, and the lists are cached.
    const [bests, ratified] = await Promise.all([
      scopeBests(dist, scope, filters),
      scope.kind === "nation" ? Promise.resolve<Ratified>({ records: [], updated: {} }) : ratifiedSources(),
    ]);
    const open = {
      W: cellFor(dist, scope, "W", OVERALL, bests, ratified),
      M: cellFor(dist, scope, "M", OVERALL, bests, ratified),
    };
    const bandSet = new Set<string>();
    for (const d of bests) if (d.category !== OVERALL) bandSet.add(d.category);
    for (const r of ratified.records) {
      if (r.dist === dist && r.scope === (scope.kind === "nation" ? "nation" : scope.kind) && r.scopeCode === scopeCodeOf(scope) && r.category !== OVERALL) {
        bandSet.add(r.category);
      }
    }
    const ages: AgeRow[] = Array.from(bandSet)
      .sort((a, b) => bandOrder(a) - bandOrder(b))
      .map((band) => {
        const W = cellFor(dist, scope, "W", band, bests, ratified);
        const M = cellFor(dist, scope, "M", band, bests, ratified);
        const cells = { W, M };
        const holds = GENDERS.filter((g) => {
          const cell = cells[g];
          const rec = open[g];
          return !!cell && !!rec && isSameMark(cell.value, rec.value, dist) && (!cell.personId || !rec.personId || cell.personId === rec.personId);
        });
        // The class holding the open record shows the open record's standing.
        for (const g of holds) cells[g] = { ...open[g]!, category: band };
        return { band, W: cells.W, M: cells.M, holds };
      });
    return { dist, open, ages, failed: false };
  } catch (error) {
    console.error(`[records] detail ${scope.kind} ${scopeCodeOf(scope)} ${dist} failed`, error);
    return { dist, open: { W: null, M: null }, ages: [], failed: true };
  }
}
