// GOMU's world records (https://www.gomu.org/results-records/world-records).
//
// The page is a Google Sites page that embeds one published Google Sheet tab
// per discipline and gender; each tab can be read as CSV:
//   https://docs.google.com/spreadsheets/d/e/<pubId>/pub?gid=<gid>&single=true&output=csv
// Row 1 is the title ("72 Hours Women"), row 2 the header (Category, Status,
// Time or Distance (km), Athlete, Nationality, Date of Birth, Place, Start
// Date, End Date, Notes), then one row per age band.
//
// Only the disciplines DUV keeps a best list for are read (72 h, 10 d,
// 1000 km, 1000 mi). 48 h and 6 days are the IAU's: GOMU's sheets for them
// only mirror the IAU and are skipped.
//
// Pure: the fetching and caching live in sources.ts.
import { discipline, isDisciplineKey } from "./disciplines";
import { normalizeNat } from "./areas";
import { decodeEntities, holderName, isBlank, isoDay } from "./text";
import { OVERALL, WORLD, type DisciplineKey, type ParseResult, type RatifiedMark, type RecordGender } from "./types";

export const GOMU_RECORDS_URL = "https://www.gomu.org/results-records/world-records";
export const GOMU_MIN_SHEETS = 20;

export interface GomuSheets {
  pubId: string;
  gids: string[];
}

/** The published workbook id and tab ids the page embeds (in entity-escaped iframe code). */
export function discoverGomuSheets(html: string): GomuSheets {
  const decoded = decodeEntities(decodeEntities(html));
  const gids = new Set<string>();
  let pubId: string | null = null;
  for (const m of Array.from(decoded.matchAll(/spreadsheets\/d\/e\/([\w-]+)\/pub(?:html)?\?[^"'\s<>]*?gid=(\d+)/g))) {
    pubId ??= m[1];
    gids.add(m[2]);
  }
  if (!pubId || gids.size < GOMU_MIN_SHEETS) {
    throw new Error(`GOMU page embeds ${gids.size} sheets, expected at least ${GOMU_MIN_SHEETS}`);
  }
  return { pubId, gids: Array.from(gids) };
}

export function gomuCsvUrl(pubId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?gid=${gid}&single=true&output=csv`;
}

/** RFC 4180 CSV: quoted fields may hold commas, doubled quotes and line breaks. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const UNIT: Record<string, string> = {
  hour: "h",
  hours: "h",
  day: "d",
  days: "d",
  kilometer: "km",
  kilometers: "km",
  kilometre: "km",
  kilometres: "km",
  km: "km",
  mile: "mi",
  miles: "mi",
};

function headingOf(title: string): { dist: string; gender: RecordGender } | null {
  const m = title.trim().toLowerCase().replace(/\s+/g, " ").match(/^(\d+) ?([a-z]+) (women|men)$/);
  const unit = m && UNIT[m[2]];
  return unit ? { dist: `${m[1]}${unit}`, gender: m[3] === "women" ? "W" : "M" } : null;
}

/** "12d 14:38:40", "14:38:40" to seconds. */
export function parseGomuTime(raw: string): number | null {
  const m = raw.trim().match(/^(?:(\d{1,3})\s*d\s+)?(\d{1,3}):([0-5]\d):([0-5]\d)$/i);
  if (!m) return null;
  const value = Number(m[1] ?? 0) * 86400 + +m[2] * 3600 + +m[3] * 60 + +m[4];
  return value > 0 ? value : null;
}

/** "1,045.519" to km: GOMU's comma groups thousands. */
export function parseGomuDistance(raw: string): number | null {
  const s = raw.replace(/[^\d.]/g, "");
  const value = Number(s);
  return s && Number.isFinite(value) && value > 0 ? value : null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "2025-May-30", "2024-June-2" (also plain "2025-05-30") to ISO. */
export function parseGomuDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{4})-([A-Za-z]+|\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const month = /^\d+$/.test(m[2]) ? +m[2] : MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
  return month ? isoDay(+m[3], month, +m[1]) : null;
}

const STATUS_RE = /^(initial|gomu-ratified|ratified|current|pending)$/i;

/** One sheet's CSV to records. Rows whose category and status are not record forms are skipped quietly. */
export function parseGomuSheet(csv: string, warnings: string[]): RatifiedMark[] {
  const rows = parseCsv(csv);
  const heading = headingOf(rows[0]?.[0] ?? "");
  if (!heading || !isDisciplineKey(heading.dist)) return [];
  const dist = heading.dist as DisciplineKey;
  if (discipline(dist).body !== "GOMU") return [];

  const keys = (rows[1] ?? []).map((c) => c.replace(/ /g, " ").replace(/\s+/g, " ").trim().toLowerCase());
  const col = (...names: string[]) => keys.findIndex((k) => names.includes(k));
  const c = {
    category: col("category"),
    status: col("status"),
    perf: col("time", "distance (km)", "distance"),
    athlete: col("athlete"),
    nat: col("nationality", "country"),
    dob: col("date of birth", "dob"),
    place: col("place"),
    start: col("start date", "date"),
    end: col("end date"),
    notes: col("notes"),
  };
  const title = rows[0][0].trim();
  if (c.category < 0 || c.status < 0 || c.perf < 0 || c.athlete < 0) {
    warnings.push(`${title}: header row not recognised`);
    return [];
  }
  const at = (row: string[], i: number) => (i >= 0 ? (row[i] ?? "").trim() : "");
  const out: RatifiedMark[] = [];
  rows.slice(2).forEach((row, offset) => {
    const catRaw = at(row, c.category).toUpperCase();
    const status = at(row, c.status);
    const category = /^(GOMU|IAU)\s+(WR|WBP)$/.test(catRaw) ? OVERALL : /^\d{2}$/.test(catRaw) ? catRaw : null;
    if (!category || !STATUS_RE.test(status)) return;
    const where = `${title} / row ${offset + 3}`;
    const perfRaw = at(row, c.perf);
    const value = discipline(dist).kind === "time" ? parseGomuTime(perfRaw) : parseGomuDistance(perfRaw);
    if (value === null) {
      warnings.push(`${where}: unreadable performance "${perfRaw}"`);
      return;
    }
    const start = parseGomuDate(at(row, c.start));
    const end = parseGomuDate(at(row, c.end));
    const dobRaw = at(row, c.dob);
    const dobParsed = parseGomuDate(dobRaw);
    const athlete = at(row, c.athlete).replace(/\s*\([^)]*\)/g, "");
    out.push({
      dist,
      gender: heading.gender,
      scope: "world",
      scopeCode: WORLD,
      category,
      body: "GOMU",
      status: /^pending$/i.test(status) ? "pending" : "current",
      value,
      perfRaw: perfRaw.replace(/\s+/g, " "),
      holder: holderName(athlete),
      nat: normalizeNat(at(row, c.nat)),
      dob: dobParsed ? dobParsed.split("-").reverse().join(".") : isBlank(dobRaw) ? null : dobRaw,
      date: start,
      endDate: end && start && end > start ? end : null,
      venue: at(row, c.place) || null,
      notes: at(row, c.notes) || null,
      personId: null,
      eventId: null,
      matchedBy: null,
    });
  });
  return out;
}

/** Many sheets to one result. */
export function parseGomuSheets(csvs: string[]): ParseResult<RatifiedMark> {
  const warnings: string[] = [];
  const records = csvs.flatMap((csv) => parseGomuSheet(csv, warnings));
  return { records, warnings };
}
