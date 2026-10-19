// Turns DUV search hits into what search shows: race editions grouped into one
// race (series), and a runner's active years. Pure functions, safe on the client.

import type { EventSearchHit, RunnerSearchHit } from "../../../lib/duv/types";
import { cleanDuv } from "../../../lib/format/locale";

/** One edition (one DUV event) as search shows it. */
export interface RaceEdition {
  id: string;
  name: string;
  /** ISO start day, "2026-09-26". */
  date: string;
  /** ISO end day when the race ends on a later day. */
  end?: string;
  year: number;
  /** DUV Length, or Duration for a fixed-time race ("246km", "24h"). */
  length: string;
  /** DUV AltitudeDiff, free text ("6500Hm"). */
  climb: string;
  /** Normalised length in km, for ordering distances. */
  normKm: number;
  trail: boolean;
  /** Men + women finishers; null when DUV lists no results. */
  finishers: number | null;
  upcoming: boolean;
}

/** One year on a race's finisher strip. `id` is null for a year the race was not held. */
export interface RaceYear {
  year: number;
  id: string | null;
  finishers: number | null;
}

/** A race: every edition DUV holds under one series, newest first. */
export interface RaceGroup {
  key: string;
  name: string;
  city: string;
  country: string;
  /** The next edition when one is coming, else the latest. */
  shown: RaceEdition;
  /** The distances run on the shown edition's day, longest first. */
  distances: RaceEdition[];
  /** Days the race was held (several distances on one day count once). */
  editionCount: number;
  firstYear: number;
  lastYear: number;
  /** Finishers of the latest edition with results. */
  lastField: number | null;
  /** First to last year, with the years between that had no edition. */
  years: RaceYear[];
  /** Every edition, newest first. */
  editions: RaceEdition[];
  trail: boolean;
}

/** DUV EventType 2 is a trail race. */
export function isTrail(eventType: string | null | undefined): boolean {
  return String(eventType ?? "").trim() === "2";
}

function isoDay(value: string | null | undefined): string | null {
  const m = cleanDuv(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m && m[1] !== "0000" ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function finisherCount(hit: EventSearchHit): number | null {
  if (hit.FinisherM == null && hit.FinisherW == null) return null;
  const n = Number(hit.FinisherM ?? 0) + Number(hit.FinisherW ?? 0);
  return Number.isFinite(n) ? n : null;
}

/** A hit as an edition; null for a split (PartOf) or an event without a readable date. */
export function toEdition(hit: EventSearchHit, today: string): RaceEdition | null {
  const partOf = cleanDuv(hit.PartOf);
  if (partOf && partOf !== "0") return null;
  const date = isoDay(hit.Startdate);
  if (!date) return null;
  const end = isoDay(hit.Enddate);
  return {
    id: String(hit.EventID),
    name: cleanDuv(hit.EventName),
    date,
    ...(end && end > date ? { end } : {}),
    year: Number(date.slice(0, 4)),
    length: cleanDuv(hit.Length) || cleanDuv(hit.Duration),
    climb: cleanDuv(hit.AltitudeDiff),
    normKm: Number(hit.NormLen) || 0,
    trail: isTrail(hit.EventType),
    finishers: finisherCount(hit),
    upcoming: date > today,
  };
}

interface Place {
  city: string;
  country: string;
}

function nameKey(hit: EventSearchHit) {
  return [hit.EventName, hit.City, hit.Country].map((s) => cleanDuv(s).toLowerCase()).join("|");
}

/** Words that name a distance or format, not the race: "Camp Croft 100 Miler" → "camp croft". */
const FORMAT_WORDS = new Set(["km", "k", "mi", "mile", "miles", "miler", "milers", "h", "hour", "hours", "race", "run", "lauf"]);

export function nameStem(name: string): string {
  return cleanDuv(name)
    .toLowerCase()
    .split(/[\s\-–—:,/()]+/)
    .filter((w) => w && !/\d/.test(w) && !FORMAT_WORDS.has(w))
    .join(" ");
}

/** The distances of one event held the same year in the same place, whatever DUV calls each. */
function eventKey(hit: EventSearchHit, year: number) {
  const stem = nameStem(hit.EventName);
  return stem ? `e:${stem}|${cleanDuv(hit.City).toLowerCase()}|${cleanDuv(hit.Country).toLowerCase()}|${year}` : null;
}

/**
 * Groups msearchevent hits into races. Editions join when DUV gives them the
 * same series (ParentID, which survives sponsor renames), when they share a
 * name and place, or when they are the distances of one event (same place and
 * year, same name once distance words are dropped: "Camp Croft 100 Miler" and
 * "Camp Croft 50 km"), which DUV keeps as separate series. Splits (PartOf)
 * are left out.
 */
export function groupRaces(hits: EventSearchHit[], today: string): RaceGroup[] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(x, root);
    return root;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };
  const add = (x: string) => {
    if (!parent.has(x)) parent.set(x, x);
  };

  const editions: { edition: RaceEdition; place: Place; node: string }[] = [];
  for (const hit of hits) {
    const edition = toEdition(hit, today);
    if (!edition) continue;
    const series = cleanDuv(hit.ParentID);
    const node = `s:${series && series !== "0" ? series : edition.id}`;
    const byName = `n:${nameKey(hit)}`;
    add(node);
    add(byName);
    union(node, byName);
    const byEvent = eventKey(hit, edition.year);
    if (byEvent) {
      add(byEvent);
      union(node, byEvent);
    }
    editions.push({ edition, node, place: { city: cleanDuv(hit.City), country: cleanDuv(hit.Country) } });
  }

  const buckets = new Map<string, { edition: RaceEdition; place: Place }[]>();
  for (const item of editions) {
    const root = find(item.node);
    const list = buckets.get(root) ?? [];
    list.push(item);
    buckets.set(root, list);
  }

  return Array.from(buckets.values()).map((items) => buildGroup(items));
}

function buildGroup(items: { edition: RaceEdition; place: Place }[]): RaceGroup {
  const byDateDesc = [...items].sort(
    (a, b) => b.edition.date.localeCompare(a.edition.date) || b.edition.normKm - a.edition.normKm
  );
  const editions = byDateDesc.map((i) => i.edition);
  const upcoming = editions.filter((e) => e.upcoming);
  // The next edition: the earliest of the upcoming ones; else the latest held.
  const shown = upcoming.length ? upcoming[upcoming.length - 1] : editions[0];
  const shownPlace = byDateDesc.find((i) => i.edition === shown)!.place;
  const distances = editions
    .filter((e) => e.date === shown.date)
    .sort((a, b) => b.normKm - a.normKm);

  const days = new Set(editions.map((e) => e.date));
  const years = editions.map((e) => e.year);
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);

  const perYear = new Map<number, { id: string; finishers: number | null; best: number }>();
  for (const e of editions) {
    const prev = perYear.get(e.year);
    const count = e.finishers ?? -1;
    if (!prev) {
      perYear.set(e.year, { id: e.id, finishers: e.finishers, best: count });
      continue;
    }
    const sum = prev.finishers === null && e.finishers === null ? null : (prev.finishers ?? 0) + (e.finishers ?? 0);
    perYear.set(e.year, count > prev.best ? { id: e.id, finishers: sum, best: count } : { ...prev, finishers: sum });
  }
  const strip: RaceYear[] = [];
  for (let y = firstYear; y <= lastYear; y++) {
    const entry = perYear.get(y);
    strip.push(entry ? { year: y, id: entry.id, finishers: entry.finishers } : { year: y, id: null, finishers: null });
  }

  const lastHeldDate = editions.find((e) => !e.upcoming && e.finishers !== null)?.date;
  const lastField =
    lastHeldDate === undefined
      ? null
      : editions.filter((e) => e.date === lastHeldDate).reduce((sum, e) => sum + (e.finishers ?? 0), 0);

  return {
    key: shown.id,
    name: commonName(distances.map((d) => d.name)) || shown.name,
    city: shownPlace.city,
    country: shownPlace.country,
    shown,
    distances,
    editionCount: days.size,
    firstYear,
    lastYear,
    lastField,
    years: strip,
    editions,
    trail: distances.some((d) => d.trail),
  };
}

/** "Camp Croft" from "Camp Croft 100 Miler" and "Camp Croft 50 km"; "" when they share no word. */
function commonName(names: string[]): string {
  const unique = Array.from(new Set(names));
  if (unique.length < 2) return unique[0] ?? "";
  const words = unique.map((n) => n.split(/\s+/));
  const shared: string[] = [];
  for (let i = 0; i < words[0].length; i++) {
    const w = words[0][i];
    if (!words.every((ws) => ws[i]?.toLowerCase() === w.toLowerCase())) break;
    shared.push(w);
  }
  while (shared.length && (/\d/.test(shared[shared.length - 1]) || /^[-–—:,]$/.test(shared[shared.length - 1]))) shared.pop();
  return shared.join(" ");
}

/** Newest first by the shown (next or latest) edition: the full page's order. */
export function sortByDate(groups: RaceGroup[]): RaceGroup[] {
  return [...groups].sort((a, b) => b.shown.date.localeCompare(a.shown.date) || a.name.localeCompare(b.name));
}

/**
 * Quick search order: names that start with the query first, then the races
 * with the longest history, then the newest.
 */
export function sortByRelevance(groups: RaceGroup[], query: string): RaceGroup[] {
  const q = query.trim().toLowerCase();
  const starts = (g: RaceGroup) => (q && g.name.toLowerCase().startsWith(q) ? 0 : 1);
  return [...groups].sort(
    (a, b) =>
      starts(a) - starts(b) ||
      b.editionCount - a.editionCount ||
      b.shown.date.localeCompare(a.shown.date)
  );
}

/** A runner row as search shows it (client-safe, no unused API fields). */
export interface RunnerRow {
  id: string;
  first: string;
  last: string;
  origName: string;
  club: string;
  city: string;
  nat: string;
  /** Year of birth, "" when unknown. */
  yob: string;
  gender: string;
  /** First and last active year; null when DUV has none. */
  from: number | null;
  to: number | null;
}

/** DUV's ActivRange "1983-2014" (or "2022", "2022-2022") as years. */
export function parseActiveRange(value: string | null | undefined): { from: number; to: number } | null {
  const years = (cleanDuv(value).match(/\d{4}/g) ?? []).map(Number).filter((y) => y > 0);
  if (!years.length) return null;
  return { from: Math.min(...years), to: Math.max(...years) };
}

export function toRunnerRow(hit: RunnerSearchHit): RunnerRow {
  const span = parseActiveRange(hit.ActivRange);
  const yob = cleanDuv(hit.YOB);
  return {
    id: String(hit.PersonID),
    first: cleanDuv(hit.FirstName),
    last: cleanDuv(hit.LastName),
    origName: cleanDuv(hit.OrigName),
    club: cleanDuv(hit.Club),
    city: cleanDuv(hit.City),
    nat: cleanDuv(hit.Nationality),
    yob: /^\d{4}$/.test(yob) && yob !== "0000" ? yob : "",
    gender: cleanDuv(hit.Gender),
    from: span?.from ?? null,
    to: span?.to ?? null,
  };
}

/** The shared time axis for a list of runners: earliest to latest active year. */
export function spanAxis(rows: Pick<RunnerRow, "from" | "to">[]): { from: number; to: number } | null {
  const froms = rows.map((r) => r.from).filter((y): y is number => y !== null);
  const tos = rows.map((r) => r.to).filter((y): y is number => y !== null);
  if (!froms.length || !tos.length) return null;
  return { from: Math.min(...froms), to: Math.max(...tos) };
}

/** Today as an ISO day in UTC, for "upcoming". */
export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
