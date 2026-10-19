import type { EventDetailListEntry } from "@/lib/duv";

export interface ParsedWinner {
  rank: string;
  name: string;
  performance: string;
}

/**
 * Parses a winnerList entry such as "1#Ondrej Pouc 187.207" or
 * "3#Jane Doe 7:12:34 h". The rank is the overall place. Returns null for
 * an empty string (no finisher of that gender).
 */
export function parseWinner(value: string | null | undefined): ParsedWinner | null {
  const raw = value?.trim();
  if (!raw) return null;
  const hashAt = raw.indexOf("#");
  const rank = hashAt > 0 ? raw.slice(0, hashAt).trim() : "";
  const rest = hashAt >= 0 ? raw.slice(hashAt + 1).trim() : raw;
  // Performance: a number or time at the end, optionally followed by a unit
  const match = rest.match(/^(.*?)\s+(\d[\d:.,]*(?:\s*(?:h|km|mi|laps?))?)$/i);
  if (!match) return { rank, name: rest, performance: "" };
  return { rank, name: match[1], performance: match[2] };
}

/** "2024-04-06 12:00:00" and "2024-04-07 12:00:00" -> "6 Apr 2024 – 7 Apr 2024". */
export function formatEventDates(start: string, end?: string) {
  const s = toDate(start);
  if (!s) return start;
  const e = end ? toDate(end) : null;
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  if (!e || sameDay(s, e)) return fmt(s);
  return `${fmt(s)} – ${fmt(e)}`;
}

/** Start time "12:00" from "2024-04-06 12:00:00", or "" when it is midnight. */
export function formatStartTime(start: string) {
  const time = start.split(" ")[1]?.slice(0, 5);
  return time && time !== "00:00" ? time : "";
}

function toDate(value: string) {
  const d = new Date(value.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

function sameDay(a: Date, b: Date) {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

/** Old-site links come as "../getresultevent.php?event=1"; make them absolute. */
export function resolveDuvLink(link: string, apiBaseUrl: string) {
  try {
    return new URL(link, apiBaseUrl.replace(/\/?$/, "/")).toString();
  } catch {
    return null;
  }
}

/** Web pages from the API sometimes lack a scheme. */
export function toExternalUrl(value: string) {
  const v = value.trim();
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/** DUV obfuscates emails as "name[at]host"; show them readable. */
export function formatEmail(value: string) {
  return value.replace(/\s*\[at\]\s*/gi, "@").trim();
}

/**
 * Picks a link and a label from a report/GPS-track entry whose shape is not
 * known yet: the first http(s) value is the link, and the first other
 * non-empty text field that looks like a title is the label.
 */
export function describeLinkEntry(entry: EventDetailListEntry) {
  const values = Object.entries(entry).filter(
    (kv): kv is [string, string] => typeof kv[1] === "string" && kv[1].trim() !== ""
  );
  const url = values.find(([, v]) => /^https?:\/\//i.test(v.trim()))?.[1].trim();
  const labelKeys = /title|name|desc|text|author|source|by/i;
  const label =
    values.find(([k, v]) => labelKeys.test(k) && !/^https?:\/\//i.test(v))?.[1] ??
    url ??
    "";
  return { url: url ?? null, label };
}
