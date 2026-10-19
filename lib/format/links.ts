import { cleanDuv } from "./locale";

const URL_IN_TEXT = /\b(?:https?:\/\/|www\.)[^\s<>"]+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

function normalise(candidate: string): string | null {
  const withScheme = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * The http(s) URL a DUV field holds, or null when the field is not just a link.
 * "www.race.de" gets "https://"; "Organiser" or "see www.x.de" give null.
 */
export function externalUrl(value: string | null | undefined): string | null {
  const s = cleanDuv(value);
  if (!s || /\s/.test(s) || !/^(?:https?:\/\/|www\.)/i.test(s)) return null;
  return normalise(s);
}

/** "https://www.itra.run/Races/..." -> "itra.run". The input when it is not a URL. */
export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

export type TextSegment = { text: string } | { url: string; raw: string };

/**
 * Splits text into plain parts and the links inside it, so a long URL can be
 * shown as a short link: "Organiser, https://x.de/r" ->
 * [{ text: "Organiser, " }, { url: "https://x.de/r", raw: "https://x.de/r" }].
 */
export function splitLinks(value: string | null | undefined): TextSegment[] {
  // Keep line breaks: descriptions are shown with whitespace-pre-line.
  const s = (value ?? "").replace(/&nbsp;/gi, " ").trim();
  const segments: TextSegment[] = [];
  let last = 0;
  for (const match of Array.from(s.matchAll(URL_IN_TEXT))) {
    const raw = match[0].replace(TRAILING_PUNCTUATION, "");
    const url = normalise(raw);
    if (!url) continue;
    const start = match.index ?? 0;
    if (start > last) segments.push({ text: s.slice(last, start) });
    segments.push({ url, raw });
    last = start + raw.length;
  }
  if (last < s.length) segments.push({ text: s.slice(last) });
  return segments;
}
