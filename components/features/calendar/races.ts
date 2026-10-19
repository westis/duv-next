// Calendar rows: the format a race is (48 h, 100 mi, 117 km · 6 500 m+, Backyard),
// sibling distances on one row, and multi-day races still running. Pure functions,
// safe on server and client.

import type { CalendarRace } from "@/lib/duv/types";
// Relative imports: vitest runs this file without the "@/" alias.
import { raceTypeOf } from "../../../lib/tags";
import { formatCourseLength, formatLengthAndClimb } from "../../../lib/format/course";
import { KM_PER_MILE } from "../../../lib/format/numbers";
import type { Surface } from "./params";

/** One distance of a row: its own DUV event. */
export interface RowFormat {
  eventId: string;
  /** "100 mi", "24 h", "117 km · 6 500 m+"; "" for a backyard ultra (label from messages). */
  text: string;
  backyard: boolean;
  hasResults: boolean;
  partial: boolean;
}

/** One ledger row: one race, or several distances sharing name, place and day. */
export interface CalendarRow {
  key: string;
  /** The event the name links to (the first distance). */
  eventId: string;
  name: string;
  city: string;
  country: string;
  startdate: string;
  enddate: string | null;
  surface: Surface | null;
  /** Best IAU label among the distances: G, S, B or T. */
  iau: "G" | "S" | "B" | "T" | null;
  formats: RowFormat[];
}

const IAU_ORDER = ["G", "S", "B", "T"] as const;

/** The ISO day part of a DUV date, or null for "0000-00-00", empty or null. */
export function isoDay(value: string | null | undefined): string | null {
  const m = (value ?? "").match(/^(\d{4}-\d{2}-\d{2})/);
  if (!m || m[1].startsWith("0000")) return null;
  return m[1];
}

export function surfaceOf(eventType: string | null | undefined): Surface | null {
  return raceTypeOf(eventType)?.surface ?? null;
}

export function isBackyard(race: Pick<CalendarRace, "EventType">): boolean {
  return raceTypeOf(race.EventType)?.kind === "backyard";
}

/**
 * The format text of one race. A trail race shows its climb after the length
 * when one is known (calendar rows carry none; the page looks it up).
 */
export function formatOf(
  race: Pick<CalendarRace, "EventType" | "Length" | "Duration">,
  locale: string,
  climb?: string | null
): string {
  if (isBackyard(race)) return "";
  const length = (race.Length ?? "").trim();
  if (length) {
    return surfaceOf(race.EventType) === "trail"
      ? formatLengthAndClimb({ length, climb }, locale)
      : formatCourseLength(length, locale);
  }
  return formatCourseLength(race.Duration ?? "", locale);
}

/** Sort weight inside a row: longest first, timed races before distances. */
function weight(race: Pick<CalendarRace, "Length" | "Duration">): number {
  const read = (s: string | null | undefined) => {
    const m = (s ?? "").replace(",", ".").match(/^(\d+(?:\.\d+)?)\s*(km|mi|h|d)/i);
    if (!m) return null;
    return { n: Number(m[1]), unit: m[2].toLowerCase() };
  };
  const time = read(race.Duration);
  if (!race.Length && time) return 1e6 + time.n * (time.unit === "d" ? 24 : 1);
  const len = read(race.Length);
  if (len) return len.n * (len.unit === "mi" ? KM_PER_MILE : 1);
  return 0;
}

const UNIT_WORD = /^(?:km|k|mi|mile|miles|meilen|h|hr|hrs|hour|hours|std|stunden|heures|ore|horas|day|days|tage|d)$/i;
/** "24hr", "100km", "50k", "100Miles", "48-Stundenlauf" stays (a word), "6h" goes. */
const DISTANCE_WORD = /^[\d.,/]+(?:km|k|mi|m|mile|miles|h|hr|hrs|hour|hours|std|d)?$/i;
const PUNCT = /^[-–—:|/(),.+&]+$/;

/** A race name without its distance words: "24hr Loutraki Festival" → ["Loutraki", "Festival"]. */
function nameWords(name: string): string[] {
  return name
    .trim()
    .split(/\s+/)
    .filter((w) => !DISTANCE_WORD.test(w) && !UNIT_WORD.test(w) && !PUNCT.test(w));
}

/**
 * What sibling race names share once their distances are taken out
 * ("Glacial Trail 50 Mile Race" + "Glacial Trail 50 km Race" give "Glacial
 * Trail Race", "24hr Loutraki Festival" + "12hr Loutraki Festival" give
 * "Loutraki Festival"). Null when that is too short to name a race.
 */
export function sharedName(names: string[]): string | null {
  const words = names.map(nameWords);
  const first = words[0] ?? [];
  let n = 0;
  while (n < first.length && words.every((w) => w[n]?.toLowerCase() === first[n].toLowerCase())) n++;
  const text = first.slice(0, n).join(" ");
  if (n >= 2 || text.length >= 10) return text;
  return null;
}

function rowKey(race: CalendarRace) {
  return `${race.Startdate}|${(race.City ?? "").trim().toLowerCase()}|${race.Country}`;
}

/**
 * Groups the distances of one race into one row: same start day, place and
 * country, and names that share at least two words (or ten letters). Keeps
 * the API's order of first appearance.
 */
export function groupRows(
  races: CalendarRace[],
  locale: string,
  climbs: ReadonlyMap<string, string> = new Map()
): CalendarRow[] {
  const buckets = new Map<string, CalendarRace[][]>();
  const order: CalendarRace[][] = [];
  for (const race of races) {
    const key = rowKey(race);
    const candidates = buckets.get(key) ?? [];
    const fit = candidates.find(
      (group) =>
        surfaceOf(group[0].EventType) === surfaceOf(race.EventType) &&
        sharedName([group[0].EventName, race.EventName]) !== null &&
        (group.length === 1 || sharedName([...group.map((r) => r.EventName), race.EventName]) !== null)
    );
    if (fit) {
      fit.push(race);
    } else {
      const group = [race];
      candidates.push(group);
      buckets.set(key, candidates);
      order.push(group);
    }
  }

  return order.map((group) => {
    const sorted = [...group].sort((a, b) => weight(b) - weight(a));
    const lead = sorted[0];
    const name =
      group.length === 1
        ? lead.EventName.trim()
        : (sharedName(group.map((r) => r.EventName)) ?? lead.EventName.trim());
    const labels = group.map((r) => (r.IAULabel ?? "").trim().toUpperCase());
    const iau = IAU_ORDER.find((l) => labels.includes(l)) ?? null;
    const ends = group.map((r) => isoDay(r.Enddate)).filter((d): d is string => !!d).sort();
    return {
      key: `${lead.EventID}`,
      eventId: lead.EventID,
      name,
      city: (lead.City ?? "").trim(),
      country: (lead.Country ?? "").trim(),
      startdate: lead.Startdate,
      enddate: ends.length ? ends[ends.length - 1] : null,
      surface: surfaceOf(lead.EventType),
      iau,
      formats: sorted.map((r) => {
        const results = (r.Results ?? "").trim().toUpperCase();
        return {
          eventId: r.EventID,
          text: formatOf(r, locale, climbs.get(r.EventID)),
          backyard: isBackyard(r),
          hasResults: results === "C" || results === "S" || results === "P",
          partial: results === "P",
        };
      }),
    };
  });
}

/** Days between two ISO dates (b - a). */
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export interface RunningState {
  /** Today is day `day` of `total`. */
  day: number;
  total: number;
  /** 0 to 1, for the progress bar. */
  progress: number;
}

/**
 * A multi-day race that started before today and has not finished: its day
 * count. Null for anything else (a race starting today is in the day list).
 */
export function runningState(
  race: { Startdate: string; Enddate: string | null },
  today: string
): RunningState | null {
  const start = isoDay(race.Startdate);
  const end = isoDay(race.Enddate);
  if (!start || !end || start >= today || end < today) return null;
  const total = daysBetween(start, end) + 1;
  const day = daysBetween(start, today) + 1;
  if (total < 2) return null;
  return { day, total, progress: Math.min(1, day / total) };
}

/** Keeps rows of one surface (when format and surface are both chosen). */
export function matchesSurface(race: Pick<CalendarRace, "EventType">, surface: Surface | "all"): boolean {
  return surface === "all" || surfaceOf(race.EventType) === surface;
}

/** True when DUV has a climb worth looking up for this race (trail with a length). */
export function wantsClimb(race: Pick<CalendarRace, "EventType" | "Length">): boolean {
  return surfaceOf(race.EventType) === "trail" && !!(race.Length ?? "").trim();
}
