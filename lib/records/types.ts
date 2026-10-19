// Shared types of the record engine (design spec, "Record markers").
// Pure: no server-only imports, so the parsers and the evaluator can be unit-tested.

/** DUV discipline keys, as the list endpoints take them in `dist`, plus backyard. */
export type DisciplineKey =
  | "50km"
  | "50mi"
  | "100km"
  | "100mi"
  | "1000km"
  | "1000mi"
  | "6h"
  | "12h"
  | "24h"
  | "48h"
  | "72h"
  | "6d"
  | "10d"
  | "backyard";

export type RecordGender = "M" | "W";

/** IAU and DUV continent codes. DUV's `nat` takes 1..6 for them. */
export type AreaCode = "EUR" | "ASI" | "AFR" | "NAM" | "SAM" | "OCE";

export type RecordScope = "world" | "area" | "nation";

export type RatifyingBody = "IAU" | "GOMU";

/**
 * One cell of a record list: discipline, gender, scope and age class.
 * `category` is "Overall" or the age band without gender ("35" ... "95", "U23", "23").
 */
export interface RecordCell {
  dist: DisciplineKey;
  gender: RecordGender;
  scope: RecordScope;
  /** "WORLD", an area code, or an IOC country code. */
  scopeCode: string;
  category: string;
}

export const OVERALL = "Overall";
export const WORLD = "WORLD";

/**
 * A mark from DUV's own lists (best performance per cell). Every entry has
 * DUV ids, so a result row matches it by EventID + PersonID.
 */
export interface DuvBest extends RecordCell {
  /** Seconds for a fixed distance, km for a fixed time, laps for backyard. */
  value: number;
  /** As DUV wrote it ("07:20:48", "278.622 km", "119"). */
  perfRaw: string;
  personId: string;
  eventId: string;
  perfId: string;
  firstName: string;
  lastName: string;
  nat: string;
  /** "16.01.1979" as DUV sends it, "" when unknown. */
  dob: string;
  /** ISO start date of the race. */
  date: string | null;
  eventName: string;
  city: string;
  country: string;
  /** DUV's split flag: set when the mark is a split inside a longer race. */
  split: string;
}

/** A record from a ratifying body (IAU page, GOMU sheets). */
export interface RatifiedMark extends RecordCell {
  body: RatifyingBody;
  /** Ratified ("current") or an application under ratification ("pending"). */
  status: "current" | "pending";
  value: number;
  perfRaw: string;
  /** "First Last" (the page's "Last, First" is turned around). */
  holder: string;
  nat: string | null;
  /** "16.01.1979", or null. */
  dob: string | null;
  /** ISO first and last day of the race. */
  date: string | null;
  endDate: string | null;
  venue: string | null;
  notes: string | null;
  /** Filled by the matching: the DUV ids of this run, when known for sure. */
  personId: string | null;
  eventId: string | null;
  /** How the ids were found: the same run in a DUV list, or the holder by birth date and name. */
  matchedBy: "run" | "holder" | null;
}

export interface ParseResult<T> {
  records: T[];
  /** One line per row that could not be read; the rest is still usable. */
  warnings: string[];
}
