// Course records from a race's own editions (meventdetail.php `winnerList`).
//
// Editions count as one course when they have the same duration, or the same
// length within 1%. A result is a course record (CR) when it is the best of its
// gender in its edition and beats the best winning mark of every earlier
// edition on the course; never in a first edition. Pure.
import { raceSize, type RaceShape } from "./disciplines";
import { parseKmValue, parseTimeValue } from "./perf";
import { duvDateIso } from "./duv-lists";
import type { RecordGender } from "./types";

/** The parts of a winnerList row (EventWinnerRow) this module reads. */
export interface EditionRow extends RaceShape {
  EventID: string;
  Year?: string;
  SDate?: string;
  Results?: string;
  /** "<rank>#<name> <performance>", e.g. "1#Ondrej Pouc 187.207". */
  Winner_M?: string | null;
  Winner_W?: string | null;
}

export interface EditionWinner {
  eventId: string;
  /** ISO start date. */
  date: string | null;
  year: string | null;
  gender: RecordGender;
  /** Overall place of the winner. */
  rank: number | null;
  /** "Ondrej Pouc" as DUV writes it in the list (first name first). */
  name: string;
  perf: string;
  value: number;
}

export type CourseKind = "time" | "distance";

/** Fixed time (duration) races compare km, fixed distances compare seconds. */
export function courseKind(race: RaceShape): CourseKind | null {
  const size = raceSize(race);
  return size ? (size.unit === "h" ? "distance" : "time") : null;
}

export function sameCourse(a: RaceShape, b: RaceShape): boolean {
  const x = raceSize(a);
  const y = raceSize(b);
  if (!x || !y || x.unit !== y.unit) return false;
  if (x.unit === "h") return Math.abs(x.value - y.value) < 1e-6;
  return Math.abs(x.value - y.value) <= 0.01 * Math.max(x.value, y.value);
}

/** "1#Ondrej Pouc 187.207" or "3#Anna Smith 7:12:44 h" → winner. */
export function parseWinner(raw: string | null | undefined, kind: CourseKind): Omit<EditionWinner, "eventId" | "date" | "year" | "gender"> | null {
  const s = String(raw ?? "").replace(/&nbsp;/g, " ").trim();
  const m = s.match(/^(?:(\d+)#)?(.+?)\s+(\d[\d:.,]*)(?:\s*(?:h|km))?$/);
  if (!m) return null;
  const value = kind === "time" ? parseTimeValue(m[3]) : parseKmValue(m[3]);
  if (value === null) return null;
  return { rank: m[1] ? Number(m[1]) : null, name: m[2].trim(), perf: m[3], value };
}

/** The winners of every edition on the same course as `race`, oldest first. */
export function courseWinners(race: RaceShape, editions: EditionRow[]): EditionWinner[] {
  const kind = courseKind(race);
  if (!kind) return [];
  const out: EditionWinner[] = [];
  for (const e of editions) {
    if (!sameCourse(race, e)) continue;
    const date = duvDateIso(e.SDate) ?? null;
    for (const gender of ["M", "W"] as const) {
      const w = parseWinner(gender === "M" ? e.Winner_M : e.Winner_W, kind);
      if (w) out.push({ ...w, eventId: String(e.EventID), date, year: e.Year ?? date?.slice(0, 4) ?? null, gender });
    }
  }
  return out.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
}

const better = (a: number, b: number, kind: CourseKind) => (kind === "time" ? a < b : a > b);

/**
 * Course record progression per gender: each winning mark that beat every
 * earlier one, oldest first (the last is the standing course record).
 */
export function courseProgression(race: RaceShape, editions: EditionRow[]): Record<RecordGender, EditionWinner[]> {
  const kind = courseKind(race);
  const result: Record<RecordGender, EditionWinner[]> = { M: [], W: [] };
  if (!kind) return result;
  for (const w of courseWinners(race, editions)) {
    const list = result[w.gender];
    const last = list[list.length - 1];
    if (!last || better(w.value, last.value, kind)) list.push(w);
  }
  return result;
}

export interface CourseRecordInfo {
  kind: "CR";
  gender: RecordGender;
  eventId: string;
  /** The best earlier winning mark: "Previous: 165.405 km, Sona Mihulova (2024)". */
  previous: EditionWinner;
}

/**
 * The CR of one edition per gender: its winner beats every earlier edition's
 * winner on the course. Keyed by gender; a gender without a CR is missing.
 */
export function courseRecordsOfEdition(
  race: RaceShape & { EventID: string },
  editions: EditionRow[]
): Partial<Record<RecordGender, CourseRecordInfo & { winner: EditionWinner }>> {
  const kind = courseKind(race);
  if (!kind) return {};
  const winners = courseWinners(race, editions);
  const out: Partial<Record<RecordGender, CourseRecordInfo & { winner: EditionWinner }>> = {};
  for (const gender of ["M", "W"] as const) {
    const own = winners.find((w) => w.eventId === String(race.EventID) && w.gender === gender);
    if (!own || !own.date) continue;
    const earlier = winners.filter((w) => w.gender === gender && w.date !== null && w.date < own.date!);
    if (!earlier.length) continue; // never in a first edition
    const previous = earlier.reduce((a, b) => (better(b.value, a.value, kind) ? b : a));
    if (better(own.value, previous.value, kind)) {
      out[gender] = { kind: "CR", gender, eventId: own.eventId, previous, winner: own };
    }
  }
  return out;
}
