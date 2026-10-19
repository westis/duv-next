import { discipline } from "./disciplines";
import type { DisciplineKey } from "./types";

/** "7:52:31", "07:20:48 h", "165:13:22", "2d 10:00:50" to seconds. */
export function parseTimeValue(raw: string): number | null {
  const s = raw.replace(/&nbsp;/g, " ").trim().replace(/\s*h$/i, "");
  const m = s.match(/^(?:(\d{1,3})\s*d\s+)?(\d{1,4}):([0-5]?\d):([0-5]?\d)(?:[.,]\d+)?$/i);
  if (!m) return null;
  const value = Number(m[1] ?? 0) * 86400 + Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4]);
  return value > 0 ? value : null;
}

/** "278.622", "278.622 km", "80,992" (DUV's own lists use a dot) to km. */
export function parseKmValue(raw: string): number | null {
  const s = raw.replace(/&nbsp;/g, " ").trim().replace(/\s*km$/i, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const value = Number(s);
  return value > 0 ? value : null;
}

/** A DUV performance as the number the discipline compares: seconds, km or laps. */
export function parseDuvPerf(raw: string | number | null | undefined, key: DisciplineKey): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : null;
  const kind = discipline(key).kind;
  if (kind === "time") return parseTimeValue(raw);
  if (kind === "laps") {
    const m = raw.trim().match(/^(\d+)(\s*\D.*)?$/);
    return m ? Number(m[1]) || null : null;
  }
  return parseKmValue(raw);
}
