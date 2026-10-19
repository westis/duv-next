// DUV's own best lists, normalised to DuvBest. Pure (the responses come in as
// arguments), so it is unit-tested; fetching lives in sources.ts.
//
// - mbestperfcountry.php?nat=<IOC or 1..6>&dist=D&cat=DOB: `Records` keyed by
//   age class ("WOverall", "W40", "MU23"), both genders in one response.
// - mgetintbestlist.php?year=all&dist=D&gender=G[&cat=G50]: the all-time world
//   list; its first row (Rank 1, or CatRank 1 with a category) is the world best.
// - mrankingbackyard.php?year=all&gender=G: the all-time backyard ranking, by laps.
import { isBetter, splitAgeClass } from "./disciplines";
import { parseDuvPerf } from "./perf";
import { OVERALL, WORLD, type DisciplineKey, type DuvBest, type RecordGender, type RecordScope } from "./types";
import type { BestPerfCountryResponse, BestPerfRecord, RankingEntry, RankingResponse } from "../duv/types";

/** "12.09.2015" or "2024-06-02" to ISO; "00.00.0000" and the like to null. */
export function duvDateIso(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] === "0000" ? null : `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m || m[3] === "0000") return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function clean(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).replace(/&nbsp;/g, " ").trim();
}

/** mbestperfcountry.php → one DuvBest per age class present. */
export function bestsFromCountryList(
  response: BestPerfCountryResponse | null | undefined,
  dist: DisciplineKey,
  scope: Exclude<RecordScope, "world">,
  scopeCode: string
): DuvBest[] {
  const records = response?.Records;
  if (!records || typeof records !== "object") return [];
  const entries: BestPerfRecord[] = Array.isArray(records) ? records : Object.values(records);
  const out: DuvBest[] = [];
  for (const r of entries) {
    const ak = splitAgeClass(clean(r?.AK));
    const value = parseDuvPerf(clean(r?.Perf), dist);
    if (!ak || value === null || !clean(r.PersonID) || !clean(r.EventID)) continue;
    out.push({
      dist,
      gender: ak.gender,
      scope,
      scopeCode,
      category: ak.band,
      value,
      perfRaw: clean(r.Perf),
      personId: clean(r.PersonID),
      eventId: clean(r.EventID),
      perfId: clean(r.PerfID),
      firstName: clean(r.FirstName),
      lastName: clean(r.LastName),
      nat: clean(r.Nat),
      dob: clean(r.DOB),
      date: duvDateIso(r.Startdate),
      eventName: clean(r.Eventname),
      city: clean(r.City),
      country: clean(r.Country),
      split: clean(r.Split),
    });
  }
  return out;
}

function fromRankingEntry(
  e: RankingEntry,
  dist: DisciplineKey,
  gender: RecordGender,
  category: string,
  scope: RecordScope,
  scopeCode: string
): DuvBest | null {
  const perfRaw = dist === "backyard" ? clean(e.Laps) : clean(e.Perf);
  const value = parseDuvPerf(perfRaw, dist);
  if (value === null || !clean(e.PersonID) || !clean(e.EventID)) return null;
  const partOf = clean(e.PartOf);
  return {
    dist,
    gender,
    scope,
    scopeCode,
    category,
    value,
    perfRaw,
    personId: clean(e.PersonID),
    eventId: clean(e.EventID),
    perfId: clean(e.PerfID),
    firstName: clean(e.FirstName),
    lastName: clean(e.LastName),
    nat: clean(e.Nationality),
    dob: clean(e.DOB_Display) || clean(e.DOBiso),
    date: duvDateIso(e.Startdate) ?? duvDateIso(e.EvtdateShortIso) ?? duvDateIso(e.EvtdateShort),
    eventName: "",
    city: clean(e.City),
    country: clean(e.Country),
    // A split inside a longer race carries its parent in PartOf.
    split: partOf && partOf !== "0" ? "S" : "",
  };
}

/**
 * The top of an all-time ranking (mgetintbestlist, mrankingbackyard): the row
 * ranked 1 overall, or 1 in its category when `band` is given.
 */
export function bestFromRanking(
  response: RankingResponse | null | undefined,
  dist: DisciplineKey,
  gender: RecordGender,
  band: string = OVERALL,
  scope: RecordScope = "world",
  scopeCode: string = WORLD
): DuvBest | null {
  const list = response?.RankingList ?? [];
  const top = list.find((e) => String(band === OVERALL ? e.Rank : e.CatRank) === "1") ?? list[0];
  if (!top) return null;
  if (band !== OVERALL) {
    // A category filter that DUV ignored would hand back the open list.
    const cat = splitAgeClass(clean(top.CatInt));
    if (cat && cat.band !== band) return null;
  }
  return fromRankingEntry(top, dist, gender, band, scope, scopeCode);
}

/**
 * World bests per gender and age class as the best of the six area lists.
 * DUV's all-time world list answers empty for big cells (no category, or the
 * crowded bands 35 to 65), so the areas are the reliable source.
 */
export function worldFromAreas(areaBests: DuvBest[]): DuvBest[] {
  const best = new Map<string, DuvBest>();
  for (const d of areaBests) {
    if (d.scope !== "area") continue;
    const key = `${d.gender}:${d.category}`;
    const held = best.get(key);
    if (!held || isBetter(d.value, held.value, d.dist)) best.set(key, d);
  }
  return Array.from(best.values()).map((d) => ({ ...d, scope: "world" as const, scopeCode: WORLD }));
}
