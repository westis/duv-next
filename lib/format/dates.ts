import { cleanDuv, languageOf, resolveLocale } from "./locale";

/** ISO dates parsed from a DUV value. `end` is set only when it differs from `start`. */
export interface DuvDate {
  start: string;
  end?: string;
}

/** Display text plus the machine value for `<time dateTime>`. */
export interface FormattedDate {
  text: string;
  dateTime: string;
}

export type DateVariant = "day" | "range" | "month" | "year" | "dayMonth" | "birth";

const EN_DASH = "–";

interface Ymd {
  y: number;
  m: number;
  d: number;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso({ y, m, d }: Ymd): string {
  return `${String(y).padStart(4, "0")}-${pad2(m)}-${pad2(d)}`;
}

function makeYmd(y: number | string, m: number | string, d: number | string): Ymd | null {
  const ymd = { y: Number(y), m: Number(m), d: Number(d) };
  if (ymd.m < 1 || ymd.m > 12 || ymd.d < 1 || ymd.y < 1) return null;
  const date = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d));
  if (date.getUTCMonth() !== ymd.m - 1 || date.getUTCDate() !== ymd.d) return null;
  return ymd;
}

function fromIso(iso: string): Ymd {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/;
const ISO_RANGE = /^(\d{4})-(\d{2})-(\d{2})-(\d{4})-(\d{2})-(\d{2})$/;
const DUV_DAY = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?: \d{1,2}:\d{2}(?::\d{2})?)?$/;
const DUV_SAME_MONTH = /^(\d{1,2})\.?-(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
const DUV_SAME_YEAR = /^(\d{1,2})\.(\d{1,2})\.?-(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
const DUV_TWO_YEARS = /^(\d{1,2})\.(\d{1,2})\.(\d{4})-(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/**
 * Parses DUV dates ("30.09.1981", "09.04.2024 14:30", "06.-07.04.2024", "30.09.-02.10.2024",
 * "31.12.2024-01.01.2025") and ISO dates ("2024-04-06", "2024-04-06 12:00:00").
 * Returns null for anything else, including impossible dates and ranges that
 * end before they start.
 */
export function parseDuvDate(value: string | null | undefined): DuvDate | null {
  const s = cleanDuv(value).replace(/\s*[-–—]\s*/g, "-");
  if (!s) return null;
  let start: Ymd | null = null;
  let end: Ymd | null = null;
  let m: RegExpMatchArray | null;
  if ((m = s.match(ISO_RANGE))) {
    start = makeYmd(m[1], m[2], m[3]);
    end = makeYmd(m[4], m[5], m[6]);
    if (!end) return null;
  } else if ((m = s.match(ISO_DAY))) {
    start = makeYmd(m[1], m[2], m[3]);
  } else if ((m = s.match(DUV_DAY))) {
    start = makeYmd(m[3], m[2], m[1]);
  } else if ((m = s.match(DUV_SAME_MONTH))) {
    start = makeYmd(m[4], m[3], m[1]);
    end = makeYmd(m[4], m[3], m[2]);
    if (!end) return null;
  } else if ((m = s.match(DUV_SAME_YEAR))) {
    start = makeYmd(m[5], m[2], m[1]);
    end = makeYmd(m[5], m[4], m[3]);
    if (!end) return null;
  } else if ((m = s.match(DUV_TWO_YEARS))) {
    start = makeYmd(m[3], m[2], m[1]);
    end = makeYmd(m[6], m[5], m[4]);
    if (!end) return null;
  }
  if (!start) return null;
  const startIso = toIso(start);
  if (!end) return { start: startIso };
  const endIso = toIso(end);
  if (endIso < startIso) return null;
  return endIso === startIso ? { start: startIso } : { start: startIso, end: endIso };
}

// ---- locale data -------------------------------------------------------

/** Short months Intl gets wrong for a compact uppercase label, by language. */
const SHORT_MONTH_OVERRIDES: Record<string, Partial<Record<number, string>>> = {
  de: { 3: "MÄRZ" },
};

/** CJK scripts write dates with their own year/month/day markers. */
const CJK_MARKERS: Record<string, { y: string; m: string; d: string; sep: string }> = {
  ja: { y: "年", m: "月", d: "日", sep: "" },
  zh: { y: "年", m: "月", d: "日", sep: "" },
  ko: { y: "년", m: "월", d: "일", sep: " " },
};

const shortMonthCache = new Map<string, string[]>();
const longMonthCache = new Map<string, string[]>();
const caseCache = new Map<string, boolean>();

function utc({ y, m, d }: Ymd): Date {
  const date = new Date(Date.UTC(2000, m - 1, d));
  date.setUTCFullYear(y);
  return date;
}

function monthNames(locale: string, width: "short" | "long"): string[] {
  const cache = width === "short" ? shortMonthCache : longMonthCache;
  const hit = cache.get(locale);
  if (hit) return hit;
  // Short: a month-only format gives the standalone (nominative) form, e.g. ru "март".
  // Long: the month of "month year" is nominative too, where month-only is not (el).
  const fmt = new Intl.DateTimeFormat(locale, {
    month: width,
    year: width === "long" ? "numeric" : undefined,
    timeZone: "UTC",
    calendar: "gregory",
  });
  const overrides = width === "short" ? SHORT_MONTH_OVERRIDES[languageOf(locale)] ?? {} : {};
  const names = Array.from({ length: 12 }, (_, i) => {
    const override = overrides[i + 1];
    if (override) return override;
    const parts = fmt.formatToParts(new Date(Date.UTC(2024, i, 15)));
    const month = parts.find((p) => p.type === "month")?.value ?? "";
    const name = month.toLocaleUpperCase(locale);
    return width === "short" ? name.replace(/\./g, "").trim() : name;
  });
  cache.set(locale, names);
  return names;
}

/** True when the locale's month names have letter case (Latin, Cyrillic, Greek...). */
function hasLetterCase(locale: string): boolean {
  const hit = caseCache.get(locale);
  if (hit !== undefined) return hit;
  const sample = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC", calendar: "gregory" }).format(
    new Date(Date.UTC(2024, 0, 15))
  );
  const cased = sample.toLocaleUpperCase(locale) !== sample.toLocaleLowerCase(locale);
  caseCache.set(locale, cased);
  return cased;
}

type Style =
  | { kind: "upper"; short: string[]; long: string[] }
  | { kind: "cjk"; y: string; m: string; d: string; sep: string }
  | { kind: "intl"; locale: string };

function styleFor(localeInput: string): Style {
  const locale = resolveLocale(localeInput);
  const cjk = CJK_MARKERS[languageOf(locale)];
  if (cjk) return { kind: "cjk", ...cjk };
  if (hasLetterCase(locale)) {
    return { kind: "upper", short: monthNames(locale, "short"), long: monthNames(locale, "long") };
  }
  return { kind: "intl", locale };
}

function intl(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: "UTC",
    calendar: "gregory",
    numberingSystem: "latn",
  });
}

const FULL: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };

function dayText(style: Style, ymd: Ymd): string {
  switch (style.kind) {
    case "upper":
      return `${pad2(ymd.d)} ${style.short[ymd.m - 1]} ${ymd.y}`;
    case "cjk":
      return `${ymd.y}${style.y}${style.sep}${ymd.m}${style.m}${style.sep}${ymd.d}${style.d}`;
    case "intl":
      return intl(style.locale, FULL).format(utc(ymd));
  }
}

function rangeText(style: Style, a: Ymd, b: Ymd): string {
  const sameYear = a.y === b.y;
  const sameMonth = sameYear && a.m === b.m;
  switch (style.kind) {
    case "upper": {
      if (sameMonth) return `${pad2(a.d)}${EN_DASH}${pad2(b.d)} ${style.short[a.m - 1]} ${a.y}`;
      if (sameYear) return `${pad2(a.d)} ${style.short[a.m - 1]} ${EN_DASH} ${dayText(style, b)}`;
      return `${dayText(style, a)} ${EN_DASH} ${dayText(style, b)}`;
    }
    case "cjk": {
      const { sep } = style;
      if (sameMonth) return `${a.y}${style.y}${sep}${a.m}${style.m}${sep}${a.d}${EN_DASH}${b.d}${style.d}`;
      if (sameYear) return `${dayText(style, a)}${EN_DASH}${b.m}${style.m}${sep}${b.d}${style.d}`;
      return `${dayText(style, a)}${EN_DASH}${dayText(style, b)}`;
    }
    case "intl":
      return intl(style.locale, FULL).formatRange(utc(a), utc(b));
  }
}

// ---- public formatters -------------------------------------------------

/** Single day: "06 APR 2024", ja "2024年4月6日". For a range value, its start day. */
export function formatDate(value: string | null | undefined, locale: string): FormattedDate | null {
  const parsed = parseDuvDate(value);
  if (!parsed) return null;
  return { text: dayText(styleFor(locale), fromIso(parsed.start)), dateTime: parsed.start };
}

/**
 * Date or range: "06–07 APR 2024", "30 SEP – 02 OCT 2024",
 * "31 DEC 2024 – 01 JAN 2025". `value` may itself be a DUV range; otherwise
 * `end` (DUV or ISO) closes it. A one-day range comes out as a single day.
 * `dateTime` is the start date.
 */
export function formatDateRange(
  value: string | null | undefined,
  locale: string,
  end?: string | null
): FormattedDate | null {
  const parsed = parseDuvDate(value);
  if (!parsed) return null;
  const endIso = (end ? parseDuvDate(end)?.start : undefined) ?? parsed.end;
  const style = styleFor(locale);
  const start = fromIso(parsed.start);
  if (!endIso || endIso <= parsed.start) return { text: dayText(style, start), dateTime: parsed.start };
  return { text: rangeText(style, start, fromIso(endIso)), dateTime: parsed.start };
}

/** Month heading: "OCTOBER 2026", ja "2026年10月". `dateTime` is "2026-10". */
export function formatMonthYear(
  value: string | { year: number; month: number } | null | undefined,
  locale: string
): FormattedDate | null {
  let ym: { y: number; m: number } | null = null;
  if (value && typeof value === "object") {
    ym = makeYmd(value.year, value.month, 1);
  } else {
    const s = cleanDuv(value);
    const iso = s.match(/^(\d{4})-(\d{2})$/);
    const duv = s.match(/^(\d{1,2})\.(\d{4})$/);
    if (iso) {
      ym = makeYmd(iso[1], iso[2], 1);
    } else if (duv) {
      ym = makeYmd(duv[2], duv[1], 1);
    } else {
      const parsed = parseDuvDate(s);
      ym = parsed ? fromIso(parsed.start) : null;
    }
  }
  if (!ym) return null;
  const style = styleFor(locale);
  const dateTime = `${String(ym.y).padStart(4, "0")}-${pad2(ym.m)}`;
  let text: string;
  if (style.kind === "upper") text = `${style.long[ym.m - 1]} ${ym.y}`;
  else if (style.kind === "cjk") text = `${ym.y}${style.y}${style.sep}${ym.m}${style.m}`;
  else text = intl(style.locale, { year: "numeric", month: "long" }).format(utc({ y: ym.y, m: ym.m, d: 1 }));
  return { text, dateTime };
}

/** Year only: "2024" in every locale. Accepts "2024" or any date `parseDuvDate` reads. */
export function formatYear(value: string | number | null | undefined, locale?: string): FormattedDate | null {
  void locale;
  const s = cleanDuv(value);
  const year = /^\d{4}$/.test(s) ? s : parseDuvDate(s)?.start.slice(0, 4);
  return year ? { text: year, dateTime: year } : null;
}

/** Short day and month for stacked table cells: "15 JUN", ja "6月15日". */
export function formatDayMonth(value: string | null | undefined, locale: string): FormattedDate | null {
  const parsed = parseDuvDate(value);
  if (!parsed) return null;
  const ymd = fromIso(parsed.start);
  const style = styleFor(locale);
  let text: string;
  if (style.kind === "upper") text = `${pad2(ymd.d)} ${style.short[ymd.m - 1]}`;
  else if (style.kind === "cjk") text = `${ymd.m}${style.m}${style.sep}${ymd.d}${style.d}`;
  else text = intl(style.locale, { month: "long", day: "numeric" }).format(utc(ymd));
  return { text, dateTime: parsed.start };
}

/**
 * Start time as 24-hour "12:00" in every locale, from "2024-04-06 12:00:00",
 * "12:00:00" or "9:30". DUV stores an unknown start time as midnight, so
 * "00:00" gives "" unless `keepMidnight` is set. Missing or unreadable time gives "".
 */
export function formatStartTime(
  value: string | null | undefined,
  options: { keepMidnight?: boolean } = {}
): string {
  const m = cleanDuv(value).match(/(?:^|[ T])(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/);
  if (!m) return "";
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return "";
  if (h === 0 && min === 0 && !options.keepMidnight) return "";
  return `${pad2(h)}:${m[2]}`;
}

/**
 * Date of birth: the full date when DUV knows it ("30 SEP 1981"), only the year
 * when that is all it knows ("00.00.1981", "1981-00-00", "1981"), and null when
 * it knows nothing ("00.00.0000", "0000-00-00", "0", "").
 */
export function formatBirthDate(value: string | number | null | undefined, locale: string): FormattedDate | null {
  const s = cleanDuv(value);
  if (!s) return null;
  const full = formatDate(s, locale);
  if (full) return full;
  const year = s.match(/(?:^|\D)(\d{4})(?:\D|$)/)?.[1];
  return year && Number(year) > 0 ? { text: year, dateTime: year } : null;
}

/** One entry point for `DateText` and other callers that pick a variant at runtime. */
export function formatDateVariant(
  variant: DateVariant,
  value: string | null | undefined,
  locale: string,
  end?: string | null
): FormattedDate | null {
  switch (variant) {
    case "day":
      return formatDate(value, locale);
    case "range":
      return formatDateRange(value, locale, end);
    case "month":
      return formatMonthYear(value, locale);
    case "year":
      return formatYear(value, locale);
    case "dayMonth":
      return formatDayMonth(value, locale);
    case "birth":
      return formatBirthDate(value, locale);
  }
}
