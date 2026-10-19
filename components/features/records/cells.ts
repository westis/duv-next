// One cell of the record board: the best known mark of a discipline, gender,
// scope and age class, and how it stands against the ratifying body's list.
// Pure, so it is unit-tested.
import { isBetter, isSameMark } from "../../../lib/records/disciplines";
import type { DisciplineKey, DuvBest, RatifiedMark, RatifyingBody, RecordGender, RecordScope } from "../../../lib/records/types";

/**
 * - `ratified`: the shown mark is the ratified record (IAU or GOMU).
 * - `pending`: DUV's best, and an application for it is with the body.
 * - `duvBest`: DUV's best, better than the ratified record (or the body has none).
 * - `unratified`: DUV's best where no body ratifies (nations, backyard, most area cells).
 */
export type CellStatus = "ratified" | "pending" | "duvBest" | "unratified";

export interface MarkHolder {
  perf: string;
  value: number;
  first: string;
  last: string;
  personId: string | null;
  eventId: string | null;
  date: string | null;
}

export interface BoardCell extends MarkHolder {
  dist: DisciplineKey;
  gender: RecordGender;
  scope: RecordScope;
  category: string;
  nat: string | null;
  /** Birth date as the source wrote it ("16.01.1979"); "" or null when unknown. */
  dob: string | null;
  /** Full race name, for the link title. */
  eventName: string;
  /** City (DUV) or the IAU's venue ("Verona (ITA)"). */
  place: string;
  /** IOC code of the race's country, when DUV gives it. */
  country: string;
  /** DUV's codes: S split, T track, I indoor. */
  flags: string;
  status: CellStatus;
  /** Where the shown mark comes from: DUV's lists, or only the ratifying body's. */
  source: "duv" | "ratified";
  /** Who ratifies this cell; null when nobody does. */
  body: RatifyingBody | null;
  /** The ratified record this mark beat, when the body still lists it. */
  previous: MarkHolder | null;
  /** DUV's own best when the ratified mark shown is better than anything in DUV's lists. */
  duvBest: MarkHolder | null;
  sourceUpdated: string | null;
}

export interface CellInput {
  dist: DisciplineKey;
  scope: RecordScope;
  gender: RecordGender;
  category: string;
  best: DuvBest | null;
  ratified: RatifiedMark | null;
  pending: RatifiedMark[];
  body: RatifyingBody | null;
  sourceUpdated: string | null;
}

/** "Aleksandr Sorokin" → first "Aleksandr", last "Sorokin" (the IAU writes no comma). */
export function splitHolder(holder: string): { first: string; last: string } {
  const tokens = holder.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return { first: "", last: tokens[0] ?? "" };
  return { first: tokens.slice(0, -1).join(" "), last: tokens[tokens.length - 1] };
}

function holderOfDuv(d: DuvBest): MarkHolder {
  return {
    perf: d.perfRaw,
    value: d.value,
    first: d.firstName,
    last: d.lastName,
    personId: d.personId || null,
    eventId: d.eventId || null,
    date: d.date,
  };
}

function holderOfRatified(r: RatifiedMark): MarkHolder {
  return { perf: r.perfRaw, value: r.value, ...splitHolder(r.holder), personId: r.personId, eventId: r.eventId, date: r.date };
}

function fromDuv(input: CellInput, d: DuvBest, status: CellStatus, previous: RatifiedMark | null): BoardCell {
  return {
    ...holderOfDuv(d),
    dist: input.dist,
    gender: input.gender,
    scope: input.scope,
    category: input.category,
    nat: d.nat || null,
    dob: d.dob || null,
    eventName: d.eventName,
    place: d.city,
    country: d.country,
    flags: d.split,
    status,
    source: "duv",
    body: input.body,
    previous: previous ? holderOfRatified(previous) : null,
    duvBest: null,
    sourceUpdated: input.sourceUpdated,
  };
}

function fromRatified(input: CellInput, r: RatifiedMark, status: CellStatus, duv: DuvBest | null): BoardCell {
  return {
    ...holderOfRatified(r),
    dist: input.dist,
    gender: input.gender,
    scope: input.scope,
    category: input.category,
    nat: r.nat,
    dob: r.dob,
    eventName: "",
    place: r.venue ?? "",
    country: "",
    flags: "",
    status,
    source: "ratified",
    body: input.body,
    previous: null,
    duvBest: duv ? holderOfDuv(duv) : null,
    sourceUpdated: input.sourceUpdated,
  };
}

/** The best known mark of a cell and its standing, or null when nothing is known. */
export function resolveCell(input: CellInput): BoardCell | null {
  const { best, ratified, pending, dist, body } = input;
  if (!best && !ratified) {
    const application = pending[0];
    return application ? fromRatified(input, application, "pending", null) : null;
  }
  if (best && ratified && isSameMark(best.value, ratified.value, dist)) {
    // DUV's entry has the ids and the race; the ratified record is the same run.
    return fromDuv(input, best, "ratified", null);
  }
  if (best && (!ratified || isBetter(best.value, ratified.value, dist))) {
    const applied = pending.some((p) => isSameMark(p.value, best.value, dist));
    const status: CellStatus = applied ? "pending" : body ? "duvBest" : "unratified";
    return fromDuv(input, best, status, ratified);
  }
  // The ratified record is better than anything in DUV's lists.
  return fromRatified(input, ratified!, "ratified", best);
}

/** DUV's flags as words: "S" split, "T" track, "I" indoor. */
export function flagWords(flags: string): ("split" | "track" | "indoor")[] {
  const out: ("split" | "track" | "indoor")[] = [];
  const f = flags.toUpperCase();
  if (f.includes("S")) out.push("split");
  if (f.includes("T")) out.push("track");
  if (f.includes("I")) out.push("indoor");
  return out;
}
