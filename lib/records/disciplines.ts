import type { AreaCode, DisciplineKey, RatifyingBody } from "./types";

export type PerformanceKind = "time" | "distance" | "laps";

export interface Discipline {
  key: DisciplineKey;
  /** "time": less is better (seconds). "distance": more is better (km). "laps": more is better. */
  kind: PerformanceKind;
  /** Who ratifies world records here; null when nobody does. */
  body: RatifyingBody | null;
  /** The IAU also keeps area records (50 km, 100 km, 24 h only). */
  iauAreaRecords: boolean;
  /** Length in km for fixed distances, hours for fixed times. */
  size: number;
}

/**
 * Disciplines with a DUV best list. IAU ratifies 50 km, 50 mi, 100 km, 100 mi,
 * 6, 12, 24, 48 h and 6 d (a "world best performance"); GOMU the other
 * multi-day events. Backyard has no ratifying body.
 */
export const DISCIPLINES: Discipline[] = [
  { key: "50km", kind: "time", body: "IAU", iauAreaRecords: true, size: 50 },
  { key: "50mi", kind: "time", body: "IAU", iauAreaRecords: false, size: 80.4672 },
  { key: "100km", kind: "time", body: "IAU", iauAreaRecords: true, size: 100 },
  { key: "100mi", kind: "time", body: "IAU", iauAreaRecords: false, size: 160.9344 },
  { key: "1000km", kind: "time", body: "GOMU", iauAreaRecords: false, size: 1000 },
  { key: "1000mi", kind: "time", body: "GOMU", iauAreaRecords: false, size: 1609.344 },
  { key: "6h", kind: "distance", body: "IAU", iauAreaRecords: false, size: 6 },
  { key: "12h", kind: "distance", body: "IAU", iauAreaRecords: false, size: 12 },
  { key: "24h", kind: "distance", body: "IAU", iauAreaRecords: true, size: 24 },
  { key: "48h", kind: "distance", body: "IAU", iauAreaRecords: false, size: 48 },
  { key: "72h", kind: "distance", body: "GOMU", iauAreaRecords: false, size: 72 },
  { key: "6d", kind: "distance", body: "IAU", iauAreaRecords: false, size: 144 },
  { key: "10d", kind: "distance", body: "GOMU", iauAreaRecords: false, size: 240 },
  { key: "backyard", kind: "laps", body: null, iauAreaRecords: false, size: 0 },
];

/** Disciplines that DUV's best lists (mgetintbestlist, mbestperfcountry) cover. */
export const LIST_DISCIPLINES = DISCIPLINES.filter((d) => d.kind !== "laps").map((d) => d.key);

export function discipline(key: DisciplineKey): Discipline {
  return DISCIPLINES.find((d) => d.key === key)!;
}

export function isDisciplineKey(value: string): value is DisciplineKey {
  return DISCIPLINES.some((d) => d.key === value);
}

/** World age bands (age on race day) that get a WR marker: 35 and up. */
export const WORLD_AGE_BANDS = ["35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85", "90"];

/** DUV's continent numbers for `nat`: 1 Europe, 2 Asia, 3 Africa, 4 North America, 5 South America, 6 Oceania. */
export const AREA_NUMBER: Record<AreaCode, number> = { EUR: 1, ASI: 2, AFR: 3, NAM: 4, SAM: 5, OCE: 6 };
export const AREAS = Object.keys(AREA_NUMBER) as AreaCode[];

/** "W45" → { gender: "W", band: "45" }; "MOverall" → band "Overall". Null for "#NA" and the like. */
export function splitAgeClass(value: string): { gender: "M" | "W"; band: string } | null {
  const m = value.trim().match(/^([MW])(Overall|U?\d{2})$/i);
  if (!m) return null;
  const band = /^overall$/i.test(m[2]) ? "Overall" : m[2].toUpperCase();
  return { gender: m[1].toUpperCase() as "M" | "W", band };
}

/** Is `a` a better mark than `b` in this discipline? */
export function isBetter(a: number, b: number, key: DisciplineKey): boolean {
  return discipline(key).kind === "time" ? a < b : a > b;
}

/** Same mark allowing for the last digit: 10 m, 1 s, or the same lap count. */
export function isSameMark(a: number, b: number, key: DisciplineKey): boolean {
  const kind = discipline(key).kind;
  if (kind === "laps") return a === b;
  return Math.abs(a - b) <= (kind === "distance" ? 0.0105 : 1);
}

/** The fields of a race (meventdetail, mcalendar, winnerList) that say what it is. */
export interface RaceShape {
  EventType?: string | null;
  Length?: string | null;
  Duration?: string | null;
}

/**
 * The record discipline of a race, or null when it is none: "24h" → 24h,
 * "100km" → 100km, "100mi" → 100mi, a backyard (type 10) → backyard.
 * Trail (type 2) and stage races (type 4) never count: records are for
 * standard road, track and indoor events.
 */
export function disciplineOfRace(race: RaceShape): DisciplineKey | null {
  const type = String(race.EventType ?? "").trim();
  if (type === "10") return "backyard";
  if (type === "2" || type === "4" || type === "9") return null;
  const duration = String(race.Duration ?? "").trim().toLowerCase().replace(/\s+/g, "");
  const length = String(race.Length ?? "").trim().toLowerCase().replace(/\s+/g, "");
  const raw = duration || length;
  const m = raw.match(/^(\d+(?:[.,]\d+)?)(km|mi|h|d)$/);
  if (!m) return null;
  const key = `${Number(m[1].replace(",", "."))}${m[2]}`;
  return isDisciplineKey(key) && key !== "backyard" ? key : null;
}

/**
 * Length in km ("100km", "50mi", "161 km") or duration in hours ("24h", "6d")
 * of a race, for comparing editions of one course.
 */
export function raceSize(race: RaceShape): { unit: "km" | "h"; value: number } | null {
  const read = (raw: string | null | undefined) =>
    String(raw ?? "").trim().toLowerCase().replace(/\s+/g, "").match(/^(\d+(?:[.,]\d+)?)(km|mi|h|d)$/);
  const d = read(race.Duration);
  if (d) {
    const n = Number(d[1].replace(",", "."));
    return { unit: "h", value: d[2] === "d" ? n * 24 : n };
  }
  const l = read(race.Length);
  if (l) {
    const n = Number(l[1].replace(",", "."));
    return { unit: "km", value: l[2] === "mi" ? n * 1.609344 : n };
  }
  return null;
}
