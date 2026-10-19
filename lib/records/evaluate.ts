// Decides the record markers of result rows (design spec, "Record markers").
//
// A marker means the performance is the best known mark of its cell (world,
// area, nation, age group). Two tiers:
// - solid (`AR`): the run is DUV's best of the cell, so it beats every known
//   mark, ratified or not;
// - outlined with the body (`IAU AR`): the run beats (or is) the ratified
//   record, but a better unratified mark stands above it in DUV's list.
// A cell no body ratifies (national records, backyard, events neither body
// lists) is always "per DUV".
//
// Pure: the record book comes in as an argument.
import { areaOfNation } from "./areas";
import { discipline, isBetter, isSameMark, splitAgeClass } from "./disciplines";
import { parseDuvPerf } from "./perf";
import { OVERALL, WORLD, type DisciplineKey, type DuvBest, type RatifiedMark, type RatifyingBody, type RecordGender, type RecordScope } from "./types";

/** Everything known about one discipline. */
export interface RecordBook {
  dist: DisciplineKey;
  /** DUV bests: world, the six areas, and whichever nations were loaded. */
  duv: DuvBest[];
  /** IAU / GOMU marks, current and pending, with DUV ids where matched. */
  ratified: RatifiedMark[];
  /** Date (ISO) of the source the ratified marks come from. */
  updated?: Partial<Record<RatifyingBody, string | null>>;
}

/** A result row to evaluate. Ids are required; the rest enables the outlined tier. */
export interface MarkerRow {
  eventId: string | number;
  personId: string | number;
  /** The row's performance as DUV wrote it ("6:12:03 h", "250.123 km"). */
  perf?: string | number | null;
  gender?: string | null;
  /** IOC code. */
  nat?: string | null;
  /** International age class on race day ("M50", "W35"). */
  cat?: string | null;
  /** ISO start date of the race. */
  date?: string | null;
}

/** A mark referred to in a popover: "6:27:44, Max King (2014)". */
export interface MarkRef {
  perf: string;
  value: number;
  holder: string;
  year: string | null;
  personId: string | null;
  eventId: string | null;
  /** An application under ratification, not yet a record. */
  pending?: boolean;
}

export type MarkerStatus =
  /** The run is the ratified record (and the best known mark when solid). */
  | "ratified"
  /** The run is DUV's best; no ratified record for it (body null, or the body's list trails). */
  | "duvBest"
  /** Beats the ratified record, but a better unratified mark stands. */
  | "beatsRatified"
  /** Matches an application under ratification and no ratified record stands. */
  | "pending";

export interface RecordMarkerInfo {
  kind: "WR" | "AR" | "NR";
  scope: RecordScope;
  /** "WORLD", an area code (EUR...), or the IOC code of the nation. */
  scopeCode: string;
  dist: DisciplineKey;
  gender: RecordGender;
  /** Age class for an age group marker ("M50"); undefined for an open marker. */
  category?: string;
  tier: "solid" | "outlined";
  /** Set on outlined markers: the label reads "IAU AR". */
  body?: RatifyingBody;
  status: MarkerStatus;
  /** Who ratifies this cell; null means DUV's list is the only source (national federations, backyard...). */
  ratifiedBy: RatifyingBody | null;
  /** The ratified record of the cell when it is another run (beaten, or trailing DUV). */
  ratified?: MarkRef;
  /** The best known mark when the marker is outlined. */
  best?: MarkRef;
  /** The run is (also) an application under ratification. */
  pending: boolean;
  /** DUV lists the mark as a split inside a longer race. */
  split: boolean;
  /** Date of the ratifying body's list, for "Source: IAU, updated 06 MAY 2026". */
  sourceUpdated?: string | null;
}

/** "WR", "IAU AR", "NR W45". */
export function markerLabel(m: Pick<RecordMarkerInfo, "kind" | "body" | "category">): string {
  return [m.body, m.kind, m.category].filter(Boolean).join(" ");
}

export function markerKey(eventId: string | number, personId: string | number): string {
  return `${String(eventId).trim()}:${String(personId).trim()}`;
}

/** Who ratifies a cell: IAU/GOMU world (open and 35+), IAU areas at 50 km, 100 km, 24 h. */
export function bodyForCell(dist: DisciplineKey, scope: RecordScope, category: string): RatifyingBody | null {
  const d = discipline(dist);
  if (!d.body) return null;
  if (scope === "world") return d.body;
  if (scope === "area" && category === OVERALL && d.iauAreaRecords) return "IAU";
  return null;
}

function refOfDuv(d: DuvBest): MarkRef {
  return {
    perf: d.perfRaw,
    value: d.value,
    holder: [d.firstName, d.lastName].filter(Boolean).join(" "),
    year: d.date?.slice(0, 4) ?? null,
    personId: d.personId,
    eventId: d.eventId,
  };
}

function refOfRatified(r: RatifiedMark): MarkRef {
  return {
    perf: r.perfRaw,
    value: r.value,
    holder: r.holder,
    year: r.date?.slice(0, 4) ?? null,
    personId: r.personId,
    eventId: r.eventId,
    pending: r.status === "pending" || undefined,
  };
}

const SENIOR_BAND = "23";

interface Cell {
  kind: RecordMarkerInfo["kind"];
  scope: RecordScope;
  scopeCode: string;
  category: string;
}

interface RowFacts {
  eventId: string;
  personId: string;
  value: number | null;
  gender: RecordGender | null;
  band: string | null;
  nat: string | null;
  date: string | null;
}

function rowFacts(row: MarkerRow, dist: DisciplineKey): RowFacts {
  const cat = splitAgeClass(String(row.cat ?? ""));
  const g = String(row.gender ?? "").trim().toUpperCase();
  const gender = g === "M" || g === "W" ? g : g === "F" ? "W" : cat?.gender ?? null;
  return {
    eventId: String(row.eventId).trim(),
    personId: String(row.personId).trim(),
    value: parseDuvPerf(row.perf ?? null, dist),
    gender,
    // "23" (23 to 34) is the senior class: its best is the open record, so no age marker.
    band: cat && cat.band !== OVERALL && cat.band !== SENIOR_BAND ? cat.band : null,
    nat: row.nat ? String(row.nat).trim().toUpperCase() : null,
    date: row.date ?? null,
  };
}

/** Is this DUV entry the row's own run? A split entry must also show the same mark. */
function isOwnRun(entry: { eventId: string | null; personId: string | null }, row: RowFacts, dist: DisciplineKey, split = false, value?: number): boolean {
  if (!entry.eventId || entry.eventId !== row.eventId || entry.personId !== row.personId) return false;
  if (!split) return true;
  return row.value !== null && value !== undefined && isSameMark(row.value, value, dist);
}

/** A ratified mark is the row's run: same ids, or (unmatched) same date and mark. */
function isRatifiedRun(mark: RatifiedMark, row: RowFacts, dist: DisciplineKey): boolean {
  if (mark.personId) return mark.personId === row.personId && (!mark.eventId || mark.eventId === row.eventId);
  return !!mark.date && mark.date === row.date && row.value !== null && isSameMark(row.value, mark.value, dist);
}

function evaluateCell(book: RecordBook, row: RowFacts, gender: RecordGender, cell: Cell): RecordMarkerInfo | null {
  const { dist } = book;
  const sameCell = (c: { gender: string; scope: string; scopeCode: string; category: string }) =>
    c.gender === gender && c.scope === cell.scope && c.scopeCode === cell.scopeCode && c.category === cell.category;
  const best = book.duv.find(sameCell) ?? null;
  const ratifiedBy = bodyForCell(dist, cell.scope, cell.category);
  const marks = ratifiedBy ? book.ratified.filter((r) => r.body === ratifiedBy && sameCell(r)) : [];
  const ratified = marks.find((r) => r.status === "current") ?? null;
  const pendingOwn = marks.some((r) => r.status === "pending" && isRatifiedRun(r, row, dist));
  const base = {
    kind: cell.kind,
    scope: cell.scope,
    scopeCode: cell.scopeCode,
    dist,
    gender,
    category: cell.category === OVERALL ? undefined : `${gender}${cell.category}`,
    ratifiedBy,
    pending: pendingOwn,
    sourceUpdated: ratifiedBy ? book.updated?.[ratifiedBy] ?? null : undefined,
  };

  if (best && isOwnRun(best, row, dist, !!best.split, best.value)) {
    const own = ratified && isRatifiedRun(ratified, row, dist);
    return {
      ...base,
      tier: "solid",
      status: own ? "ratified" : "duvBest",
      ratified: ratified && !own ? refOfRatified(ratified) : undefined,
      split: !!best.split,
    };
  }

  if (ratified) {
    const own = isRatifiedRun(ratified, row, dist);
    const beats = row.value !== null && isBetter(row.value, ratified.value, dist);
    if (!own && !beats) return null;
    // Outlined only when DUV knows a better mark; otherwise this run is the best known.
    const betterKnown = !!best && (row.value === null || isBetter(best.value, row.value, dist));
    if (!betterKnown) {
      return {
        ...base,
        tier: "solid",
        status: own ? "ratified" : "duvBest",
        ratified: own ? undefined : refOfRatified(ratified),
        split: false,
      };
    }
    return {
      ...base,
      tier: "outlined",
      body: ratifiedBy!,
      status: own ? "ratified" : "beatsRatified",
      ratified: own ? undefined : refOfRatified(ratified),
      best: refOfDuv(best!),
      split: false,
    };
  }

  if (pendingOwn && ratifiedBy) {
    return {
      ...base,
      tier: "outlined",
      body: ratifiedBy,
      status: "pending",
      best: best ? refOfDuv(best) : undefined,
      split: false,
    };
  }
  return null;
}

/** Cells a row can hold, open first (world, area, nation), then age groups (world, nation). */
function cellsFor(book: RecordBook, row: RowFacts, gender: RecordGender): { open: Cell[]; age: Cell[] } {
  const open: Cell[] = [{ kind: "WR", scope: "world", scopeCode: WORLD, category: OVERALL }];
  // The area: the list holding the run, else the runner's continent.
  const ownArea = book.duv.find((d) => d.scope === "area" && d.category === OVERALL && d.gender === gender && isOwnRun(d, row, book.dist, !!d.split, d.value));
  const area = ownArea?.scopeCode ?? areaOfNation(row.nat);
  if (area) open.push({ kind: "AR", scope: "area", scopeCode: area, category: OVERALL });
  const ownNation = book.duv.find((d) => d.scope === "nation" && d.category === OVERALL && d.gender === gender && isOwnRun(d, row, book.dist, !!d.split, d.value));
  const nat = ownNation?.scopeCode ?? row.nat;
  if (nat) open.push({ kind: "NR", scope: "nation", scopeCode: nat, category: OVERALL });

  const age: Cell[] = [];
  // The band: the row's category, else the band of a list entry holding the run.
  const ownBand = book.duv.find((d) => d.category !== OVERALL && d.category !== SENIOR_BAND && d.gender === gender && isOwnRun(d, row, book.dist, !!d.split, d.value));
  const band = row.band ?? ownBand?.category ?? null;
  if (band) {
    age.push({ kind: "WR", scope: "world", scopeCode: WORLD, category: band });
    if (nat) age.push({ kind: "NR", scope: "nation", scopeCode: nat, category: band });
  }
  return { open, age };
}

/**
 * The markers of one row: at most one open and one age group marker, the
 * widest scope first (a world record is also an area and a national record).
 */
export function evaluateRow(book: RecordBook, input: MarkerRow): RecordMarkerInfo[] {
  const row = rowFacts(input, book.dist);
  const genders: RecordGender[] = row.gender
    ? [row.gender]
    : Array.from(new Set(book.duv.filter((d) => isOwnRun(d, row, book.dist, !!d.split, d.value)).map((d) => d.gender)));
  const out: RecordMarkerInfo[] = [];
  for (const gender of genders.slice(0, 1)) {
    const { open, age } = cellsFor(book, row, gender);
    const pick = (cells: Cell[]) => {
      const found = cells.map((c) => evaluateCell(book, row, gender, c)).filter((m): m is RecordMarkerInfo => m !== null);
      // Widest scope first; at the same scope a ratified one before a DUV-only one.
      return found[0] ?? null;
    };
    const o = pick(open);
    const a = pick(age);
    if (o) out.push(o);
    if (a) out.push(a);
  }
  return out;
}

/** All rows at once, keyed by `markerKey(eventId, personId)`; rows without markers are left out. */
export function evaluateRows(book: RecordBook, rows: MarkerRow[]): Map<string, RecordMarkerInfo[]> {
  const out = new Map<string, RecordMarkerInfo[]>();
  for (const row of rows) {
    const markers = evaluateRow(book, row);
    if (markers.length) out.set(markerKey(row.eventId, row.personId), markers);
  }
  return out;
}
