import type { EventDetailListEntry } from "@/lib/duv";
import { linkHost } from "@/lib/format";

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
  // Skip codes such as a GPS source type "1"
  const isText = (v: string) => !/^https?:\/\//i.test(v) && !/^\d+$/.test(v.trim());
  const label =
    values.find(([k, v]) => labelKeys.test(k) && isText(v))?.[1] ??
    (url ? linkHost(url) : "");
  return { url: url ?? null, label };
}
