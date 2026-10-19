import "server-only";

// Fetching and caching for the record engine. Everything is cached in Next's
// data cache for a day: DUV lists through duvFetch, the IAU page and GOMU's
// sheets through fetch + unstable_cache. A source that looks wrong throws
// inside the cached function, so the cache keeps serving its last good copy.
import { unstable_cache } from "next/cache";
import {
  DuvApiError,
  getBackyardRanking,
  getBestPerfCountry,
  getIntBestList,
  getRunnerProfile,
  searchRunners,
} from "@/lib/duv";
import { AREA_NUMBER, AREAS, discipline, WORLD_AGE_BANDS } from "./disciplines";
import { bestFromRanking, bestsFromCountryList, duvDateIso, worldFromAreas } from "./duv-lists";
import { discoverGomuSheets, GOMU_RECORDS_URL, gomuCsvUrl, parseGomuSheets } from "./gomu";
import { IAU_RECORDS_URL, parseIauRecords } from "./iau";
import { applyHolder, matchRuns, pickHolder, unmatchedLine, type HolderCandidate } from "./match";
import { parseDuvPerf } from "./perf";
import { dobIso } from "./text";
import type { RecordBook } from "./evaluate";
import { OVERALL, type DisciplineKey, type DuvBest, type RatifiedMark, type RecordGender } from "./types";

const DAY = 86400;
const TIMEOUT_MS = 15_000;
const GENDERS: RecordGender[] = ["W", "M"];

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

/** DUV answers 404 (or 400) for a list with nothing in it. */
function isEmptyAnswer(error: unknown) {
  return error instanceof DuvApiError && (error.status === 404 || error.status === 400);
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { Accept: "text/html,text/csv,text/plain" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: DAY },
  });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  const body = await res.text();
  if (!body.trim()) throw new Error(`empty body for ${url}`);
  return body;
}

// --- Ratifying bodies ------------------------------------------------------

export interface RatifiedSource {
  records: RatifiedMark[];
  /** ISO date the source says it was updated, when it says. */
  updated: string | null;
  warningCount: number;
}

const cachedIau = unstable_cache(
  async (): Promise<RatifiedSource> => {
    // Throws on a page with too few tables or records: nothing is cached then.
    const parsed = parseIauRecords(await fetchText(IAU_RECORDS_URL));
    for (const warning of parsed.warnings) console.warn(`[records] IAU ${warning}`);
    return { records: parsed.records, updated: parsed.updated, warningCount: parsed.warnings.length };
  },
  ["records-iau-v3"],
  { revalidate: DAY }
);

/** The IAU records page, parsed. Null when it cannot be read and no good copy is cached. */
export async function getIauRecords(): Promise<RatifiedSource | null> {
  try {
    return await cachedIau();
  } catch (error) {
    console.error("[records] IAU records page refused", error);
    return null;
  }
}

/** Below this GOMU's sheets changed shape: refuse them. */
const GOMU_MIN_CURRENT = 40;

const cachedGomu = unstable_cache(
  async (): Promise<RatifiedSource> => {
    const { pubId, gids } = discoverGomuSheets(await fetchText(GOMU_RECORDS_URL));
    const csvs = await mapLimit(gids, 5, async (gid) => {
      try {
        return await fetchText(gomuCsvUrl(pubId, gid));
      } catch (error) {
        console.warn(`[records] GOMU sheet ${gid}`, error);
        return "";
      }
    });
    const parsed = parseGomuSheets(csvs.filter(Boolean));
    for (const warning of parsed.warnings) console.warn(`[records] GOMU ${warning}`);
    const current = parsed.records.filter((r) => r.status === "current").length;
    if (current < GOMU_MIN_CURRENT) {
      throw new Error(`GOMU sheets gave ${current} current records, expected at least ${GOMU_MIN_CURRENT}`);
    }
    return { records: parsed.records, updated: null, warningCount: parsed.warnings.length };
  },
  ["records-gomu-v1"],
  { revalidate: DAY }
);

/** GOMU's world records (72 h, 10 d, 1000 km, 1000 mi). Null when unavailable. */
export async function getGomuRecords(): Promise<RatifiedSource | null> {
  try {
    return await cachedGomu();
  } catch (error) {
    console.error("[records] GOMU records refused", error);
    return null;
  }
}

// --- DUV lists -------------------------------------------------------------

/**
 * World best (rank 1 of the all-time list) for one gender and age band. DUV
 * answers the open all-time list (no category) with nothing, so for the open
 * mark use the book's world entry, which is the best of the six areas.
 */
export async function getWorldBest(dist: DisciplineKey, gender: RecordGender, band: string = OVERALL): Promise<DuvBest | null> {
  try {
    if (dist === "backyard") {
      const data = await getBackyardRanking(
        { year: "all", gender, cat: band === OVERALL ? undefined : `${gender}${band}`, plain: true, perpage: 5 },
        { revalidate: DAY }
      );
      return bestFromRanking(data, dist, gender, band);
    }
    const data = await getIntBestList(
      { year: "all", dist, gender, cat: band === OVERALL ? undefined : `${gender}${band}`, plain: true, perpage: 5 },
      { revalidate: DAY }
    );
    return bestFromRanking(data, dist, gender, band);
  } catch (error) {
    if (isEmptyAnswer(error)) return null;
    throw error;
  }
}

/** A nation's (IOC code) or an area's DUV bests, both genders, every age class. */
export async function getCountryBests(dist: DisciplineKey, scope: "area" | "nation", code: string): Promise<DuvBest[]> {
  if (dist === "backyard") return [];
  const nat = scope === "area" ? String(AREA_NUMBER[code as keyof typeof AREA_NUMBER]) : code.toUpperCase();
  if (!nat || nat === "undefined") return [];
  try {
    const data = await getBestPerfCountry({ nat, dist, cat: "DOB", type: 0 }, { revalidate: DAY });
    return bestsFromCountryList(data, dist, scope, code.toUpperCase());
  } catch (error) {
    if (isEmptyAnswer(error)) return [];
    throw error;
  }
}

/** Nation lists for several nations; a nation that fails is logged and left out. */
export async function getNationBests(dist: DisciplineKey, nations: string[]): Promise<DuvBest[]> {
  const unique = Array.from(new Set(nations.map((n) => n.trim().toUpperCase()).filter((n) => /^[A-Z]{3}$/.test(n))));
  const lists = await mapLimit(unique, 4, async (nat) => {
    try {
      return await getCountryBests(dist, "nation", nat);
    } catch (error) {
      console.error(`[records] national list ${nat} ${dist} failed`, error);
      return [];
    }
  });
  return lists.flat();
}

// --- Holder matching (birth date + name) ----------------------------------

function nameSplits(holder: string): { first: string; last: string }[] {
  const tokens = holder.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return [];
  const splits = [
    { first: tokens[0], last: tokens.slice(1).join(" ") },
    { first: tokens.slice(0, -1).join(" "), last: tokens[tokens.length - 1] },
  ];
  return splits.filter((s, i) => i === 0 || s.last !== splits[0].last);
}

/** DUV runners who could be this holder, with full birth dates and results. */
async function holderCandidates(mark: RatifiedMark): Promise<HolderCandidate[]> {
  const year = dobIso(mark.dob)?.slice(0, 4);
  if (!year) return [];
  const hits = new Map<string, { PersonID: string }>();
  for (const { first, last } of nameSplits(mark.holder)) {
    try {
      const data = await searchRunners({ sname: `${last},${first}`, plain: true, perpage: 50 }, { revalidate: DAY });
      for (const hit of data?.Hitlist ?? []) {
        if (String(hit.YOB) === year && (!mark.nat || !hit.Nationality || hit.Nationality === mark.nat)) {
          hits.set(String(hit.PersonID), hit);
        }
      }
    } catch (error) {
      if (!isEmptyAnswer(error)) console.warn(`[records] runner search for ${mark.holder} failed`, error);
    }
  }
  // More than a handful of same-year namesakes cannot be told apart cheaply.
  if (hits.size === 0 || hits.size > 4) return [];
  const profiles = await mapLimit(Array.from(hits.keys()), 2, async (personId) => {
    try {
      const p = await getRunnerProfile({ runner: personId, plain: true }, { revalidate: DAY });
      if (!p?.PersonHeader) return null;
      const [last, first] = String(p.PersonHeader.PersonName ?? "").split(",").map((s) => s.trim());
      const candidate: HolderCandidate = {
        personId,
        firstName: first ?? "",
        lastName: last ?? "",
        dob: String(p.PersonHeader.DOB ?? ""),
        nat: String(p.PersonHeader.NationalityShort ?? ""),
        perfs: (p.AllPerfs ?? []).flatMap((y) =>
          (y.PerfsPerYear ?? []).map((perf) => ({
            eventId: String(perf.EvtID),
            date: duvDateIso(String(perf.EvtDate ?? "").replace(/^(\d{1,2})\.-\d{1,2}\./, "$1.")),
            value: parseDuvPerf(perf.Perf, mark.dist),
          }))
        ),
      };
      return candidate;
    } catch {
      return null;
    }
  });
  return profiles.filter((p): p is HolderCandidate => p !== null);
}

async function matchHolders(marks: RatifiedMark[]): Promise<RatifiedMark[]> {
  return mapLimit(marks, 3, async (mark) => {
    if (mark.personId || mark.status !== "current") return mark;
    const holder = pickHolder(mark, await holderCandidates(mark));
    if (holder) return applyHolder(mark, holder);
    console.info(unmatchedLine(mark));
    return mark;
  });
}

// --- The record book -------------------------------------------------------

const cachedBook = unstable_cache(
  async (dist: DisciplineKey): Promise<RecordBook> => {
    // DUV's all-time world list answers empty without a category and for the
    // crowded bands; those cells come from the best of the six area lists below.
    const world = await mapLimit(
      GENDERS.flatMap((gender) => (dist === "backyard" ? [OVERALL] : WORLD_AGE_BANDS).map((band) => ({ gender, band }))),
      4,
      ({ gender, band }) =>
        getWorldBest(dist, gender, band).catch((error) => {
          // An open list must be there; a missing age band only loses that band.
          if (band === OVERALL) throw error;
          console.warn(`[records] world ${dist} ${gender}${band} failed`, error);
          return null;
        })
    );
    const areas = dist === "backyard" ? [] : await mapLimit(AREAS, 3, (area) => getCountryBests(dist, "area", area));
    const listed = world.filter((d): d is DuvBest => d !== null);
    const has = new Set(listed.map((d) => `${d.gender}:${d.category}`));
    // Cells the world list left empty come from the best of the six areas.
    const derived = worldFromAreas(areas.flat()).filter((d) => !has.has(`${d.gender}:${d.category}`));
    const duv = [...listed, ...derived, ...areas.flat()];

    const body = discipline(dist).body;
    const source = body === "IAU" ? await getIauRecords() : body === "GOMU" ? await getGomuRecords() : null;
    let ratified = (source?.records ?? []).filter((r) => r.dist === dist);
    ratified = await matchHolders(matchRuns(ratified, duv));
    return { dist, duv, ratified, updated: body ? { [body]: source?.updated ?? null } : {} };
  },
  ["records-book-v5"],
  { revalidate: DAY }
);

/**
 * Everything known about one discipline: DUV's world bests (open and 35+),
 * the six areas, the ratified marks matched to DUV, plus the lists of the
 * given nations. Cached for a day.
 */
export async function getRecordBook(dist: DisciplineKey, nations: string[] = []): Promise<RecordBook> {
  const base = await cachedBook(dist);
  if (!nations.length || dist === "backyard") return base;
  const national = await getNationBests(dist, nations);
  const duv = [...base.duv, ...national];
  // National lists can identify a few more ratified runs.
  return { ...base, duv, ratified: matchRuns(base.ratified, duv) };
}
