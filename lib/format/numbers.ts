import { cleanDuv, resolveLocale } from "./locale";

export type DistanceUnit = "km" | "mi";

/** Kilometres in one statute mile. */
export const KM_PER_MILE = 1.609344;

export interface NumberOptions {
  /** Force "187.207" (DUV's classic dot) whatever the locale says. */
  classicDot?: boolean;
}

export interface UnitOptions extends NumberOptions {
  /** Stored values are km and km/h; "mi" converts. Default "km". */
  unit?: DistanceUnit;
}

/** A formatted number with its unit kept apart, so a cell can style them separately. */
export interface FormattedQuantity {
  /** "187.207" or "187,207" */
  number: string;
  /** "km", "mi", "km/h", "mph", "/km", "/mi" */
  unit: string;
  /** number + " " + unit */
  text: string;
}

function quantity(number: string, unit: string): FormattedQuantity {
  return { number, unit, text: `${number} ${unit}` };
}

/** Reads "187.207 km", "187,207", "7.804" or a number. Null when not a finite number. */
export function parseDecimal(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const s = cleanDuv(value)
    .replace(/\s*(km\/h|mph|km|mi|h)$/i, "")
    .replace(/\s/g, "");
  if (!/^-?\d+([.,]\d+)?$/.test(s)) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Fixed decimals, no grouping (performances line up and read like DUV's own lists). */
function fixed(value: number, decimals: number, locale: string, options: NumberOptions): string {
  if (options.classicDot) return value.toFixed(decimals);
  return new Intl.NumberFormat(resolveLocale(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: false,
    numberingSystem: "latn",
  }).format(value);
}

/** Distance result with 3 decimals: "187.207 km", de "187,207 km", or miles with `unit: "mi"`. */
export function formatDistance(
  km: string | number | null | undefined,
  locale: string,
  options: UnitOptions = {}
): FormattedQuantity | null {
  const value = parseDecimal(km);
  if (value === null || value < 0) return null;
  const unit = options.unit ?? "km";
  const converted = unit === "mi" ? value / KM_PER_MILE : value;
  return quantity(fixed(converted, 3, locale, options), unit);
}

/**
 * Seconds from "7:52:31 h", "165:13:22" or a number of seconds.
 * Null for anything that is not h:mm:ss.
 */
export function parseDuration(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  const s = cleanDuv(value).replace(/\s*h$/i, "");
  const m = s.match(/^(\d+):([0-5]\d):([0-5]\d(?:[.,]\d+)?)$/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Math.round(Number(m[3].replace(",", ".")));
}

/** "7:52:31"; 24 h and over keeps counting hours: "165:13:22". No " h" suffix. */
export function formatDuration(value: string | number | null | undefined): string | null {
  const total = parseDuration(value);
  if (total === null) return null;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Backyard laps as a grouped number ("38", "1,234"). The word "laps" comes from
 * the messages with plural rules, e.g. t("laps", { count }), not from here.
 */
export function formatLaps(laps: string | number | null | undefined, locale: string): string | null {
  const n = parseDecimal(laps);
  if (n === null || n < 0 || !Number.isInteger(n)) return null;
  return formatCount(n, locale);
}

/** Counts with locale grouping: "2,115,800" en, "2.115.800" de. */
export function formatCount(value: string | number | null | undefined, locale: string): string | null {
  const n = parseDecimal(value);
  if (n === null) return null;
  return new Intl.NumberFormat(resolveLocale(locale), {
    maximumFractionDigits: 0,
    numberingSystem: "latn",
  }).format(n);
}

/** Speed with 2 decimals: "7.80 km/h" or "4.85 mph". Input is km/h. */
export function formatSpeed(
  kmh: string | number | null | undefined,
  locale: string,
  options: UnitOptions = {}
): FormattedQuantity | null {
  const value = parseDecimal(kmh);
  if (value === null || value < 0) return null;
  const mi = options.unit === "mi";
  return quantity(fixed(mi ? value / KM_PER_MILE : value, 2, locale, options), mi ? "mph" : "km/h");
}

/**
 * Pace from a speed in km/h: "7:41 /km" or "12:22 /mi", rounded to the
 * nearest second; an hour or more per unit reads "1:02:03".
 */
export function formatPace(
  kmh: string | number | null | undefined,
  options: { unit?: DistanceUnit } = {}
): FormattedQuantity | null {
  const value = parseDecimal(kmh);
  if (value === null || value <= 0) return null;
  const mi = options.unit === "mi";
  const seconds = Math.round((3600 * (mi ? KM_PER_MILE : 1)) / value);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, "0");
  const number = h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
  return quantity(number, mi ? "/mi" : "/km");
}

export type PerformanceKind = "time" | "distance" | "laps";

export interface ParsedPerformance {
  kind: PerformanceKind;
  /** Seconds for a time, km for a distance, laps for backyard. */
  value: number;
}

/**
 * Detects a DUV performance: "7:52:31 h" is a time, "187.207 km" (or a bare
 * number) a distance, "38 laps" laps. Miles are converted to km.
 */
export function parsePerformance(value: string | number | null | undefined): ParsedPerformance | null {
  if (typeof value === "number") return Number.isFinite(value) ? { kind: "distance", value } : null;
  const s = cleanDuv(value);
  if (!s) return null;
  if (s.includes(":")) {
    const seconds = parseDuration(s);
    return seconds === null ? null : { kind: "time", value: seconds };
  }
  const laps = s.match(/^(\d+)\s*(?:laps?|rounds?|runden?)$/i);
  if (laps) return { kind: "laps", value: Number(laps[1]) };
  const miles = /\smi$/i.test(s);
  const n = parseDecimal(s);
  if (n === null) return null;
  return { kind: "distance", value: miles ? n * KM_PER_MILE : n };
}

export interface FormattedPerformance extends ParsedPerformance {
  /** "7:52:31", "187.207 km", or for laps just the number (label from messages). */
  text: string;
  /** "km" / "mi" for a distance, "" otherwise. */
  unit: string;
}

/** Formats any DUV performance string by its detected kind. */
export function formatPerformance(
  value: string | number | null | undefined,
  locale: string,
  options: UnitOptions = {}
): FormattedPerformance | null {
  const parsed = parsePerformance(value);
  if (!parsed) return null;
  if (parsed.kind === "time") {
    return { ...parsed, text: formatDuration(parsed.value) ?? "", unit: "" };
  }
  if (parsed.kind === "laps") {
    return { ...parsed, text: formatLaps(parsed.value, locale) ?? "", unit: "" };
  }
  const distance = formatDistance(parsed.value, locale, options);
  return distance ? { ...parsed, text: distance.text, unit: distance.unit } : null;
}
