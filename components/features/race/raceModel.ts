// Pure shaping of a race's DUV data for the result sheet (direction A):
// women's and men's lists, bands, gaps, nations, splits and editions.
// No server-only imports, so it is unit-tested.
import { raceSize, type RaceShape } from "../../../lib/records/disciplines";
import { cleanDuv, parseDuration, parsePerformance } from "../../../lib/format";
import type { EventResultRow, EventWinnerRow } from "@/lib/duv";

export type Gender = "W" | "M";
export type ResultKind = "time" | "distance" | "laps";

/** DUV writes women as "F" in results and "W" in lists. */
export function genderOf(value: string | null | undefined): Gender | null {
  const g = cleanDuv(value).toUpperCase();
  if (g === "M") return "M";
  if (g === "W" || g === "F") return "W";
  return null;
}

/** One finisher, read once from DUV's row. */
export interface Finisher {
  row: EventResultRow;
  gender: Gender | null;
  /** Seconds, km or laps; null when DUV's performance can't be read. */
  value: number | null;
  kind: ResultKind | null;
  /** Place within the gender (RankMW). */
  place: number | null;
  overall: number | null;
}

const num = (v: string | null | undefined) => {
  const n = Number.parseInt(cleanDuv(v), 10);
  return Number.isFinite(n) ? n : null;
};

export function readFinisher(row: EventResultRow): Finisher {
  const perf = parsePerformance(row.Performance || row.PerformanceNumeric);
  return {
    row,
    gender: genderOf(row.Gender),
    value: perf?.value ?? null,
    kind: perf?.kind ?? null,
    place: num(row.RankMW),
    overall: num(row.RankTotal),
  };
}

/** The kind of the race's results: the most common readable kind. */
export function resultKind(finishers: Finisher[]): ResultKind | null {
  const counts = new Map<ResultKind, number>();
  for (const f of finishers) if (f.kind) counts.set(f.kind, (counts.get(f.kind) ?? 0) + 1);
  let best: ResultKind | null = null;
  for (const [kind, n] of Array.from(counts)) if (!best || n > (counts.get(best) ?? 0)) best = kind;
  return best;
}

/** Better first: shorter time, longer distance, more laps. */
export function isBetterValue(a: number, b: number, kind: ResultKind): boolean {
  return kind === "time" ? a < b : a > b;
}

export interface GenderLists {
  W: Finisher[];
  M: Finisher[];
  /** Rows without a usable gender (rare); not shown in the lists. */
  other: number;
}

/** Women's and men's lists in DUV's order (their place within the gender). */
export function splitByGender(finishers: Finisher[]): GenderLists {
  const out: GenderLists = { W: [], M: [], other: 0 };
  for (const f of finishers) {
    if (f.gender) out[f.gender].push(f);
    else out.other++;
  }
  const byPlace = (a: Finisher, b: Finisher) =>
    (a.place ?? Number.MAX_SAFE_INTEGER) - (b.place ?? Number.MAX_SAFE_INTEGER) ||
    (a.overall ?? Number.MAX_SAFE_INTEGER) - (b.overall ?? Number.MAX_SAFE_INTEGER);
  out.W.sort(byPlace);
  out.M.sort(byPlace);
  return out;
}

/** Gap to the gender winner: seconds behind (time) or km behind (distance). Null for the winner. */
export function gapToWinner(f: Finisher, winner: Finisher | undefined, kind: ResultKind | null): number | null {
  if (!winner || f === winner || f.value === null || winner.value === null || !kind) return null;
  const gap = kind === "time" ? f.value - winner.value : winner.value - f.value;
  return gap > 0 ? gap : null;
}

/** A band of the result list: "6:00 to 7:00", "200 to 250 km". */
export interface Band {
  /** Lower and upper edge (seconds or km); null for an open end. */
  from: number | null;
  to: number | null;
}

const HOUR_STEPS = [0.5, 1, 2, 3, 4, 6, 12, 24, 48];
const KM_STEPS = [5, 10, 20, 25, 50, 100, 200, 500];
const MAX_BANDS = 8;

/**
 * Bands for a list of results so that a long field reads in chunks: hours for
 * fixed distances (best first, ascending), kilometres for fixed times (best
 * first, descending). Edges are round numbers; at most eight bands. Empty for
 * laps or when nothing can be read.
 */
export function makeBands(values: number[], kind: ResultKind | null): Band[] {
  const vs = values.filter((v) => Number.isFinite(v));
  if (!vs.length || (kind !== "time" && kind !== "distance")) return [];
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const unit = kind === "time" ? 3600 : 1;
  const steps = (kind === "time" ? HOUR_STEPS : KM_STEPS).map((s) => s * unit);
  const step =
    steps.find((s) => Math.floor(max / s) - Math.floor(min / s) + 1 <= MAX_BANDS) ?? steps[steps.length - 1];
  const lo = Math.floor(min / step);
  const hi = Math.floor(max / step);
  const bands: Band[] = [];
  for (let i = lo; i <= hi; i++) bands.push({ from: i * step, to: (i + 1) * step });
  if (kind === "time") {
    bands[0] = { from: null, to: bands[0].to };
    return bands;
  }
  // Distances: best (longest) first; the top band is open upwards, the bottom one downwards.
  bands.reverse();
  bands[0] = { from: bands[0].from, to: null };
  if (bands.length > 1) bands[bands.length - 1] = { from: null, to: bands[bands.length - 1].to };
  return bands;
}

export function bandIndex(value: number | null, bands: Band[]): number {
  if (value === null) return -1;
  return bands.findIndex((b) => (b.from === null || value >= b.from) && (b.to === null || value < b.to));
}

/** Rows grouped into bands, keeping the list's order; unreadable rows in a last group. */
export function groupIntoBands(list: Finisher[], bands: Band[]): { band: Band | null; rows: Finisher[] }[] {
  if (!bands.length) return list.length ? [{ band: null, rows: list }] : [];
  const groups = bands.map((band) => ({ band: band as Band | null, rows: [] as Finisher[] }));
  const rest: Finisher[] = [];
  for (const f of list) {
    const i = bandIndex(f.value, bands);
    if (i < 0) rest.push(f);
    else groups[i].rows.push(f);
  }
  const out = groups.filter((g) => g.rows.length);
  if (rest.length) out.push({ band: null, rows: rest });
  return out;
}

export interface NationTeam {
  nat: string;
  /** Sum of the best three (seconds or km). */
  total: number;
  members: Finisher[];
}

/**
 * Each nation's best three of one gender, summed (worked out from DUV's
 * results; official team scoring may differ). Only nations with three
 * finishers; best total first.
 */
export function nationTeams(list: Finisher[], kind: ResultKind | null, size = 3): NationTeam[] {
  if (kind !== "time" && kind !== "distance") return [];
  const byNat = new Map<string, Finisher[]>();
  for (const f of list) {
    const nat = cleanDuv(f.row.Nationality).toUpperCase();
    if (!nat || f.value === null) continue;
    byNat.set(nat, [...(byNat.get(nat) ?? []), f]);
  }
  const teams: NationTeam[] = [];
  for (const [nat, runners] of Array.from(byNat)) {
    if (runners.length < size) continue;
    const best = [...runners].sort((a, b) => (isBetterValue(a.value!, b.value!, kind) ? -1 : 1)).slice(0, size);
    teams.push({ nat, members: best, total: best.reduce((s, f) => s + f.value!, 0) });
  }
  return teams.sort((a, b) => (kind === "time" ? a.total - b.total : b.total - a.total));
}

// ---- editions, splits and classifications (meventdetail's winnerList) ----

/** A winnerList row as DUV sends it now (it also carries the ISO start). */
export type WinnerRow = EventWinnerRow & { EvtDateIso?: string };

export interface Winner {
  /** Overall place. */
  rank: number | null;
  /** "Ondrej Pouc", as DUV writes it in the list. */
  name: string;
  perf: string;
}

/** "1#Ondrej Pouc 187.207", "39#Courtney Olsen 07:10:31" → winner. */
export function parseWinnerField(raw: string | null | undefined): Winner | null {
  const s = cleanDuv(raw).replace(/&nbsp;/g, " ");
  if (!s) return null;
  const m = s.match(/^(?:(\d+)#)?(.+?)\s+(\d[\d:.,]*)(?:\s*(?:h|km|mi|laps?))?$/i);
  if (!m) return { rank: null, name: s.replace(/^\d+#/, ""), perf: "" };
  return { rank: m[1] ? Number(m[1]) : null, name: m[2].trim(), perf: m[3] };
}

const sizeKey = (r: RaceShape) => {
  const s = raceSize(r);
  return s ? `${s.unit}:${s.value.toFixed(3)}` : `?:${cleanDuv(r.Length)}|${cleanDuv(r.Duration)}`;
};

export function sameDistance(a: RaceShape, b: RaceShape): boolean {
  return sizeKey(a) === sizeKey(b);
}

export interface RaceFamily {
  /** Editions of the race itself (top-level events), newest first, as DUV orders them. */
  editions: WinnerRow[];
  /** Intermediate splits of this race (events PartOf it at another distance or time), in race order. */
  splits: WinnerRow[];
  /** Other classifications of this same race (PartOf it, same distance), e.g. a masters ranking. */
  classifications: WinnerRow[];
  /** The race this event is a split or classification of, when it is one. */
  parent: WinnerRow | null;
  /** Other races on the same day in the same series (not splits of this one). */
  sameDay: WinnerRow[];
}

/**
 * Sorts out the winnerList of one event: DUV lists every event of the series
 * there, splits and classifications included (linked to their race by PartOf).
 */
export function raceFamily(
  race: RaceShape & { EventID: string; PartOf?: string | null; SDate?: string | null },
  winners: WinnerRow[]
): RaceFamily {
  const id = String(race.EventID);
  const partOf = cleanDuv(race.PartOf);
  const isTop = (w: WinnerRow) => !cleanDuv(w.PartOf) || cleanDuv(w.PartOf) === "0";
  const children = winners.filter((w) => cleanDuv(w.PartOf) === id && w.EventID !== id);
  const classifications = children.filter((w) => sameDistance(w, race));
  const self = winners.find((w) => w.EventID === id);
  const splits = children
    .filter((w) => !sameDistance(w, race))
    .map((w) => ({ w, at: splitPosition(w, race, self) }))
    .sort((a, b) => a.at - b.at)
    .map((x) => x.w);
  const parent = partOf && partOf !== "0" ? (winners.find((w) => w.EventID === partOf) ?? null) : null;
  const sameDay = winners.filter(
    (w) => isTop(w) && w.EventID !== id && w.EventID !== partOf && race.SDate && w.SDate === race.SDate
  );
  return { editions: winners.filter(isTop), splits, classifications, parent, sameDay };
}

/**
 * Where a split falls in the race, as a share of the whole: an hour mark of a
 * 24 h race is h / 24; a distance split is km over the winner's distance (or
 * the race length); a split by time inside a distance race uses the winner's time.
 */
export function splitPosition(split: RaceShape, race: RaceShape, self?: WinnerRow): number {
  const s = raceSize(split);
  const r = raceSize(race);
  if (!s || !r) return Number.MAX_SAFE_INTEGER;
  if (s.unit === r.unit) return s.value / r.value;
  const winner = parseWinnerField(self?.Winner_M) ?? parseWinnerField(self?.Winner_W);
  if (r.unit === "h" && s.unit === "km") {
    const km = Number((winner?.perf ?? "").replace(",", "."));
    return km > 0 ? s.value / km : s.value / (r.value * 12);
  }
  // r in km, split in hours
  const seconds = parseDuration(winner?.perf);
  return seconds ? (s.value * 3600) / seconds : (s.value * 12) / r.value;
}

/** Finishers of a winnerList row. */
export function finishersOf(w: Pick<EventWinnerRow, "FinisherM" | "FinisherW">): number {
  return (Number.parseInt(w.FinisherM, 10) || 0) + (Number.parseInt(w.FinisherW, 10) || 0);
}
