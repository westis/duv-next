// The IAU records page (https://iau-ultramarathon.org/iau-records.html).
//
// One hand-edited HTML page: a table of pending applications, then 18 tables,
// one per discipline and gender, titled in their first row ("50 Km Women") with
// the columns Category | Status | Time (or Distance) | Athlete | Country | DOB |
// Place | MF | Date | Comments. The tables never nest, so they are read with
// regular expressions instead of an HTML library.
//
// Pure: the fetching and caching live in sources.ts.
import { AREAS } from "./disciplines";
import { normalizeNat } from "./areas";
import { decodeEntities, holderName, isBlank, isoDay } from "./text";
import { OVERALL, WORLD, type AreaCode, type DisciplineKey, type ParseResult, type RatifiedMark, type RecordGender } from "./types";

export const IAU_RECORDS_URL = "https://iau-ultramarathon.org/iau-records.html";

/** Below these the page layout has changed: refuse it, so the cache keeps the last good copy. */
export const IAU_MIN_TABLES = 15;
export const IAU_MIN_CURRENT = 150;

const TABLE_RE = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
const ROW_RE = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
const CELL_RE = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;

function cellText(html: string): string {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Every table of the page as rows of plain-text cells. */
export function htmlTables(html: string): string[][][] {
  const tables: string[][][] = [];
  for (const [, table] of Array.from(html.matchAll(TABLE_RE))) {
    const rows: string[][] = [];
    for (const [, row] of Array.from(table.matchAll(ROW_RE))) {
      rows.push(Array.from(row.matchAll(CELL_RE)).map(([, cell]) => cellText(cell)));
    }
    tables.push(rows);
  }
  return tables;
}

const DIST_BY_TITLE: Record<string, DisciplineKey> = {
  "50 km": "50km",
  "50 mile": "50mi",
  "50 miles": "50mi",
  "100 km": "100km",
  "100 mile": "100mi",
  "100 miles": "100mi",
  "6 hours": "6h",
  "12 hours": "12h",
  "24 hours": "24h",
  "48 hours": "48h",
  "6 days": "6d",
};

const DIST_BY_TOKEN: Record<string, DisciplineKey> = {
  "50K": "50km",
  "50M": "50mi",
  "100K": "100km",
  "100M": "100mi",
  "6H": "6h",
  "12H": "12h",
  "24H": "24h",
  "48H": "48h",
  "6D": "6d",
};

const AREA_BY_NAME: Record<string, AreaCode> = {
  europe: "EUR",
  asia: "ASI",
  africa: "AFR",
  "north america": "NAM",
  "south america": "SAM",
  oceania: "OCE",
};

const isTimeDist = (key: DisciplineKey) => /(km|mi)$/.test(key);

/** "3:04:24", "2.59.54", "05:21:33" to seconds. Colons and dots both separate. */
export function parseIauTime(raw: string): number | null {
  const m = raw.replace(/[^\d:.,]/g, "").match(/^(\d{1,3})[:.,](\d{1,2})[:.,](\d{1,2})$/);
  if (!m || +m[2] > 59 || +m[3] > 59) return null;
  const value = +m[1] * 3600 + +m[2] * 60 + +m[3];
  return value > 0 ? value : null;
}

/**
 * "100,224", "1.007,600", "278.621" to km: the last separator is the decimal
 * one. A lone "1.036" can only be thousands (no fixed-time record is under 20 km).
 */
export function parseIauDistance(raw: string): number | null {
  const s = raw.replace(/[^\d.,]/g, "");
  if (!/\d/.test(s)) return null;
  const parts = s.split(/[.,]/);
  const value = parts.length === 1 ? Number(s) : Number(`${parts.slice(0, -1).join("")}.${parts[parts.length - 1]}`);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value < 20 && /^\d{1,3}[.,]\d{3}$/.test(s)) return Number(s.replace(/[.,]/, ""));
  return value;
}

function parsePerf(raw: string, key: DisciplineKey): number | null {
  return isTimeDist(key) ? parseIauTime(raw) : parseIauDistance(raw);
}

/**
 * Single days ("13.04.2021", "24/03/2024") and ranges with the shared parts
 * written once ("9-10.12.2017", "28.04-04.05.2025", "28.12.2014-3.01.2015").
 */
export function parseIauDates(raw: string): { start: string; end: string | null } | null {
  const s = raw.replace(/\s+/g, "").replace(/[–—]/g, "-");
  if (isBlank(s)) return null;
  const dash = s.indexOf("-");
  const nums = (part: string) => Array.from(part.matchAll(/\d+/g)).map(([d]) => Number(d));
  const head = nums(dash < 0 ? s : s.slice(0, dash));
  const tail = dash < 0 ? [] : nums(s.slice(dash + 1));
  const yearOf = (list: number[]) => [...list].reverse().find((n) => n >= 1900 && n <= 2100);

  const day = head[0];
  let [month, year] = [head[1], head[2]];
  if (head.length === 2) year = yearOf(tail)!;
  if (head.length === 1) {
    if (tail.length >= 3) [, month, year] = tail;
    else if (tail.length === 2) [month, year] = tail;
  }
  const start = isoDay(day, month, year);
  if (!start) return null;
  if (!tail.length) return { start, end: null };
  let [endDay, endMonth, endYear] = [tail[0], month, year];
  if (tail.length >= 3) [endDay, endMonth, endYear] = tail;
  else if (tail.length === 2) [endDay, endMonth] = tail;
  const end = isoDay(endDay, endMonth, endYear);
  return { start, end: end && end > start ? end : null };
}

/** "IAU Records (updated on 6th May 2026)" → "2026-05-06". */
export function parseIauUpdated(html: string): string | null {
  const text = decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ");
  const m = text.match(/updated\s+(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?\.?\s+([a-z]+)\.?\s+(\d{4})/i);
  if (!m) return null;
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = months.indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
  return month ? isoDay(+m[1], month, +m[3]) : null;
}

function headingOf(title: string): { dist: DisciplineKey; gender: RecordGender } | null {
  const m = title.trim().toLowerCase().replace(/\s+/g, " ").match(/^(.*?) (women|men)$/);
  const dist = m && DIST_BY_TITLE[m[1]];
  return dist ? { dist, gender: m[2] === "women" ? "W" : "M" } : null;
}

/** "WR", "IAU WR", "WBP" (6 days), an area name, or an age band "35".."90". */
function categoryOf(raw: string): { scope: "world" | "area"; scopeCode: string; category: string } | null {
  const v = raw.trim();
  if (/^(iau\s+)?(wr|wbp)$/i.test(v)) return { scope: "world", scopeCode: WORLD, category: OVERALL };
  const area = AREA_BY_NAME[v.toLowerCase()];
  if (area && AREAS.includes(area)) return { scope: "area", scopeCode: area, category: OVERALL };
  if (/^\d{2}$/.test(v)) return { scope: "world", scopeCode: WORLD, category: v };
  return null;
}

function blankMark(): Pick<RatifiedMark, "personId" | "eventId" | "matchedBy"> {
  return { personId: null, eventId: null, matchedBy: null };
}

function parseRecordTable(rows: string[][], heading: { dist: DisciplineKey; gender: RecordGender }, title: string, warnings: string[]) {
  const out: RatifiedMark[] = [];
  rows.forEach((cells, i) => {
    if (cells.length <= 1 || cells.every(isBlank) || /^category$/i.test(cells[0])) return;
    const where = `${title} / row ${i + 1}`;
    if (cells.length < 9) {
      warnings.push(`${where}: expected 10 columns, found ${cells.length}`);
      return;
    }
    const [catRaw, status, perfRaw, athlete, country, dob, place, mf, date] = cells;
    const comments = cells[9] ?? "";
    if (isBlank(status) || isBlank(perfRaw)) return; // "N.A." / "No record"
    if (!/^(current|initial|new)$/i.test(status.trim())) {
      warnings.push(`${where}: unknown status "${status}"`);
      return;
    }
    const cat = categoryOf(catRaw);
    if (!cat) {
      warnings.push(`${where}: unknown category "${catRaw}"`);
      return;
    }
    const value = parsePerf(perfRaw, heading.dist);
    if (value === null) {
      warnings.push(`${where}: unreadable performance "${perfRaw}"`);
      return;
    }
    const dates = parseIauDates(date);
    if (!dates && !isBlank(date)) warnings.push(`${where}: unreadable date "${date}"`);
    const venue = [isBlank(place) ? "" : place, isBlank(mf) ? "" : `(${mf})`].filter(Boolean).join(" ");
    out.push({
      ...heading,
      ...cat,
      body: "IAU",
      status: "current",
      value,
      perfRaw: perfRaw.trim(),
      holder: holderName(athlete),
      nat: normalizeNat(country),
      dob: isBlank(dob) ? null : dob.trim(),
      date: dates?.start ?? null,
      endDate: dates?.end ?? null,
      venue: venue || null,
      notes: isBlank(comments) ? null : comments,
      ...blankMark(),
    });
  });
  return out;
}

/**
 * "12H / M45", "50K / M85", "6D / W WBP", "50KW70", "1OOM/WR/W40" (letter O
 * for zero): distance, gender and age band in one hand-typed cell.
 */
export function parsePendingCell(raw: string): { dist: DisciplineKey; gender: RecordGender; category: string } | null {
  const upper = raw.toUpperCase();
  const m = upper.match(/^\s*([0-9O]{1,3})\s*([KMHD])/);
  if (!m) return null;
  const dist = DIST_BY_TOKEN[`${m[1].replace(/O/g, "0")}${m[2]}`];
  if (!dist) return null;
  const tail = upper
    .slice(m[0].length)
    .replace(/OVERALL|WBP|IAU|WR|WOMEN|MEN/g, (w) => (w === "WOMEN" ? "W" : w === "MEN" ? "M" : ""))
    .replace(/[^A-Z0-9]/g, "");
  const parts = tail.match(/^([MW])(\d{2})?$/);
  if (!parts) return null;
  return { dist, gender: parts[1] as RecordGender, category: parts[2] ?? OVERALL };
}

function parsePendingTable(rows: string[][], warnings: string[]) {
  const out: RatifiedMark[] = [];
  rows.forEach((cells, i) => {
    if (cells.length <= 1 || cells.every(isBlank) || /^distance$/i.test(cells[0])) return;
    const where = `Pending / row ${i + 1}`;
    if (cells.length < 6) {
      warnings.push(`${where}: expected 7 columns, found ${cells.length}`);
      return;
    }
    const [distRaw, perfRaw, athlete, country, place, date] = cells;
    const cell = parsePendingCell(distRaw);
    if (!cell) {
      warnings.push(`${where}: unknown distance "${distRaw}"`);
      return;
    }
    const value = parsePerf(perfRaw, cell.dist);
    if (value === null) {
      warnings.push(`${where}: unreadable performance "${perfRaw}"`);
      return;
    }
    const dates = parseIauDates(date);
    out.push({
      ...cell,
      scope: "world",
      scopeCode: WORLD,
      body: "IAU",
      status: "pending",
      value,
      perfRaw: perfRaw.trim(),
      holder: holderName(athlete),
      nat: normalizeNat(country),
      dob: null,
      date: dates?.start ?? null,
      endDate: dates?.end ?? null,
      venue: isBlank(place) ? null : place,
      notes: isBlank(cells[6]) ? null : cells[6],
      ...blankMark(),
    });
  });
  return out;
}

export interface IauRecords extends ParseResult<RatifiedMark> {
  /** The page's own "updated on" date (ISO), when it states one. */
  updated: string | null;
}

/**
 * Reads the whole page. A bad row is a warning; a page with fewer than 15
 * record tables or 150 current records throws (the layout changed).
 */
export function parseIauRecords(html: string): IauRecords {
  const warnings: string[] = [];
  const records: RatifiedMark[] = [];
  let tables = 0;
  for (const rows of htmlTables(html)) {
    const title = rows[0]?.[0] ?? "";
    if (/pending/i.test(title)) {
      records.push(...parsePendingTable(rows, warnings));
      continue;
    }
    const heading = headingOf(title);
    if (!heading) continue;
    tables++;
    records.push(...parseRecordTable(rows, heading, title.trim(), warnings));
  }
  if (tables < IAU_MIN_TABLES) {
    throw new Error(`IAU records page has ${tables} record tables, expected at least ${IAU_MIN_TABLES}`);
  }
  const current = records.filter((r) => r.status === "current").length;
  if (current < IAU_MIN_CURRENT) {
    throw new Error(`IAU records page has ${current} current records, expected at least ${IAU_MIN_CURRENT}`);
  }
  return { records, warnings, updated: parseIauUpdated(html) };
}
