import { cleanDuv, resolveLocale } from "./locale";

/** No-break space: climbs group thousands with it in every language ("6 500 m+"). */
const GROUP = " ";
/** Between length and climb: "117 km · 6 500 m+". */
export const COURSE_SEPARATOR = " · ";

/**
 * Elevation gain in metres from DUV's free-text AltitudeDiff: "6500Hm", "6.500 Hm",
 * "6,500m", "1200 m+", "D+ 2500", "+2500 m", "2500/2500Hm" (gain/loss: the gain).
 * Null when empty, zero, per lap ("10m/lap") or unreadable.
 */
export function parseClimb(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  const s = cleanDuv(value)
    .toLowerCase()
    .replace(/^d\s*\+\s*/, "")
    .replace(/^\+\s*/, "");
  if (!s || /\/\s*(lap|loop|round|runde|rd)\b/.test(s)) return null;
  const m = s.match(/^(\d{1,3}(?:[.,\s]\d{3})+|\d+)(?:\s*\/\s*-?\d[\d.,\s]*)?\s*(?:hm|m\+?|m\.|d\+)?$/);
  if (!m) return null;
  const n = Number(m[1].replace(/[.,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** "6 500 m+" from any form `parseClimb` reads; null when there is no climb to show. */
export function formatClimb(value: string | number | null | undefined, locale: string): string | null {
  const n = parseClimb(value);
  if (n === null) return null;
  const digits = new Intl.NumberFormat(resolveLocale(locale), { useGrouping: false, numberingSystem: "latn" }).format(n);
  return `${digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP)}${GROUP}m+`;
}

const LENGTH = /^(\d+(?:[.,]\d+)?)\s*(km|mi|h|d)\.?$/i;

function formatOneLength(part: string, locale: string): string | null {
  // "1,461km": a comma before exactly three digits groups thousands.
  const value = /^\d{1,3}(,\d{3})+\s*[a-z]/i.test(part) ? part.replace(/,/g, "") : part;
  const m = value.match(LENGTH);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  const number = new Intl.NumberFormat(resolveLocale(locale), {
    maximumFractionDigits: 3,
    useGrouping: false,
    numberingSystem: "latn",
  }).format(n);
  return `${number} ${m[2].toLowerCase()}`;
}

/**
 * A race's length (or duration) from DUV's Length / Duration text: "117km" gives
 * "117 km", "45.6km" "45,6 km" in German, "100mi,100km" "100 mi, 100 km", and
 * a stage race's "1284km/21Etappen" "1284 km". Unknown shapes come back trimmed.
 */
export function formatCourseLength(value: string | null | undefined, locale: string): string {
  const s = cleanDuv(value);
  if (!s) return "";
  const head = s.split("/")[0].trim();
  const whole = formatOneLength(head, locale);
  if (whole) return whole;
  const parts = head.split(",").map((p) => formatOneLength(p.trim(), locale));
  if (parts.length > 1 && parts.every(Boolean)) return parts.join(", ");
  return s;
}

/**
 * Length and climb together, the way every page names a trail race:
 * "117 km · 6 500 m+". Either half is left out when DUV has none; "" when both are.
 */
export function formatLengthAndClimb(
  race: { length?: string | null; climb?: string | number | null },
  locale: string
): string {
  return [formatCourseLength(race.length, locale), formatClimb(race.climb, locale)]
    .filter(Boolean)
    .join(COURSE_SEPARATOR);
}
