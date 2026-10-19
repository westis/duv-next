import "server-only";

// The record engine's public API (design spec, "Record markers"). Server-only.
//
//   const markers = await getRecordMarkers(rows);          // WR / AR / NR (+ age groups)
//   const markers = await getRaceMarkers(eventId, rows);   // the same plus CR
//   markers.get(markerKey(row.EventID, row.PersonID))      // RecordMarkerInfo[] | undefined
//
// Popover texts are built by the caller from the structured fields (status,
// ratifiedBy, ratified, best, pending, sourceUpdated, previous); see the
// report of track C for the wording per status.
import { getEventDetail } from "@/lib/duv";
import { courseRecordsOfEdition, type EditionRow } from "./course";
import { disciplineOfRace, isSameMark } from "./disciplines";
import { evaluateRows, markerKey, type MarkerRow, type RecordMarkerInfo } from "./evaluate";
import { parseKmValue, parseTimeValue } from "./perf";
import { getRecordBook } from "./sources";
import type { DisciplineKey, DuvBest, RatifiedMark, RecordGender } from "./types";
import type { CourseRecordInfo, EditionWinner } from "./course";

export * from "./types";
export { DISCIPLINES, LIST_DISCIPLINES, WORLD_AGE_BANDS, AREAS, discipline, disciplineOfRace, isBetter, isSameMark } from "./disciplines";
export { markerKey, markerLabel, bodyForCell, evaluateRow, evaluateRows } from "./evaluate";
export type { RecordBook, MarkerRow, RecordMarkerInfo, MarkRef, MarkerStatus } from "./evaluate";
export { courseProgression, courseWinners, courseRecordsOfEdition, sameCourse } from "./course";
export type { CourseRecordInfo, EditionWinner, EditionRow } from "./course";
export { areaOfNation } from "./areas";
export { IAU_RECORDS_URL } from "./iau";
export { GOMU_RECORDS_URL } from "./gomu";
export { getRecordBook, getIauRecords, getGomuRecords, getWorldBest, getCountryBests, getNationBests } from "./sources";

/** A row for the marker lookup: ids, plus what the outlined tier and CR need. */
export interface MarkerQuery extends MarkerRow {
  /** The race's discipline when the caller knows it; otherwise it is looked up from the event. */
  dist?: DisciplineKey | null;
}

/** The record discipline of an event (cached with the event detail), or null. */
export async function eventDiscipline(eventId: string | number): Promise<DisciplineKey | null> {
  try {
    const data = await getEventDetail({ event: eventId });
    return data?.raceDetails ? disciplineOfRace(data.raceDetails) : null;
  } catch {
    return null;
  }
}

/**
 * Record markers (WR, AR, NR and their age groups) for result rows. Rows
 * may come from several events; each event's discipline is looked up once
 * unless `dist` is given. Returns a map keyed by `markerKey(eventId, personId)`
 * holding only rows that have a marker.
 */
export async function getRecordMarkers(rows: MarkerQuery[]): Promise<Map<string, RecordMarkerInfo[]>> {
  const distOf = new Map<string, DisciplineKey | null>();
  for (const row of rows) {
    const id = String(row.eventId);
    if (row.dist !== undefined && !distOf.has(id)) distOf.set(id, row.dist);
  }
  await Promise.all(
    Array.from(new Set(rows.map((r) => String(r.eventId))))
      .filter((id) => !distOf.has(id))
      .map(async (id) => distOf.set(id, await eventDiscipline(id)))
  );

  const byDist = new Map<DisciplineKey, MarkerRow[]>();
  for (const row of rows) {
    const dist = row.dist ?? distOf.get(String(row.eventId));
    if (!dist) continue;
    byDist.set(dist, [...(byDist.get(dist) ?? []), row]);
  }

  const out = new Map<string, RecordMarkerInfo[]>();
  await Promise.all(
    Array.from(byDist).map(async ([dist, distRows]) => {
      try {
        const nations = distRows.map((r) => String(r.nat ?? "")).filter(Boolean);
        const book = await getRecordBook(dist, nations);
        for (const [key, markers] of Array.from(evaluateRows(book, distRows))) out.set(key, markers);
      } catch (error) {
        console.error(`[records] markers for ${dist} failed`, error);
      }
    })
  );
  return out;
}

export interface RaceMarkers {
  records: Map<string, RecordMarkerInfo[]>;
  /** CR per row key: the gender winner of this edition beat every earlier edition on the course. */
  course: Map<string, CourseRecordInfo>;
}

/**
 * Markers for the result rows of one race: records plus course records.
 * Rows need `gender` and `perf` for the CR (it is decided from the
 * editions' winning marks in meventdetail's winnerList).
 */
export async function getRaceMarkers(eventId: string | number, rows: MarkerRow[]): Promise<RaceMarkers> {
  const detail = await getEventDetail({ event: eventId }).catch(() => null);
  const race = detail?.raceDetails;
  const dist = race ? disciplineOfRace(race) : null;
  const records = dist ? await getRecordMarkers(rows.map((r) => ({ ...r, dist }))) : new Map<string, RecordMarkerInfo[]>();
  const course = new Map<string, CourseRecordInfo>();
  if (race && detail?.winnerList?.length) {
    const crs = courseRecordsOfEdition(race, detail.winnerList as EditionRow[]);
    for (const row of rows) {
      const g = String(row.gender ?? "").toUpperCase();
      const gender: RecordGender | null = g === "M" ? "M" : g === "W" || g === "F" ? "W" : null;
      const cr = gender ? crs[gender] : undefined;
      if (!cr) continue;
      const value = winnerValue(row.perf, cr.winner);
      if (value !== null && Math.abs(value - cr.winner.value) <= (cr.winner.perf.includes(":") ? 1 : 0.0105)) {
        course.set(markerKey(row.eventId, row.personId), { kind: "CR", gender: cr.gender, eventId: cr.eventId, previous: cr.previous });
      }
    }
  }
  return { records, course };
}

/** The row's performance read the way the winner's mark was (time or km). */
function winnerValue(perf: MarkerRow["perf"], winner: EditionWinner): number | null {
  if (perf === null || perf === undefined) return null;
  if (typeof perf === "number") return perf;
  return winner.perf.includes(":") ? parseTimeValue(perf) : parseKmValue(perf);
}

export interface RecordSetAtRace {
  /** DUV's current best set at one of these events. */
  entry: DuvBest;
  /** The ratified record of the same run, when there is one. */
  ratified: RatifiedMark | null;
}

/**
 * Current records (DUV's lists: world, areas, the given nations; open and
 * age groups) whose run was at one of `eventIds` (e.g. every edition of a
 * race). The lists hold only standing marks, so beaten records are not here.
 */
export async function getRecordsSetAt(
  eventIds: (string | number)[],
  dist: DisciplineKey,
  nations: string[] = []
): Promise<RecordSetAtRace[]> {
  const ids = new Set(eventIds.map(String));
  const book = await getRecordBook(dist, nations);
  return book.duv
    .filter((d) => ids.has(d.eventId))
    .map((entry) => ({
      entry,
      ratified:
        book.ratified.find(
          (r) =>
            r.status === "current" &&
            r.personId === entry.personId &&
            (r.eventId ? r.eventId === entry.eventId : r.date === entry.date && isSameMark(r.value, entry.value, dist))
        ) ?? null,
    }));
}
