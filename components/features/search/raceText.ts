import { formatCourseLength, formatLengthAndClimb } from "../../../lib/format/course";
import { cleanDuv } from "../../../lib/format/locale";
import type { RaceEdition } from "./races";

/**
 * The distances of a race day, longest first: "100 mi, 50 mi, 50 km". A trail
 * race names its climb with each length: "117 km · 6 500 m+".
 */
export function formatDistances(distances: Pick<RaceEdition, "length" | "climb" | "trail">[], locale: string): string {
  const texts = distances.flatMap((d) =>
    d.trail ? [formatLengthAndClimb({ length: d.length, climb: d.climb }, locale)] : lengths(d.length, locale)
  );
  // Each distance stays on one line; a long list wraps only between distances.
  return Array.from(new Set(texts.filter(Boolean)))
    .map((text) => text.replace(/ /g, "\u00a0"))
    .join(", ");
}

/**
 * One event may list several lengths in one field ("24h,12h,6h,100mi,100");
 * each readable one is kept, a bare number without a unit is dropped.
 */
function lengths(raw: string, locale: string): string[] {
  const whole = formatCourseLength(raw, locale);
  if (whole !== cleanDuv(raw) || !raw.includes(",")) return [whole];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => !/^\d+([.,]\d+)?$/.test(part))
    .map((part) => formatCourseLength(part, locale))
    .filter(Boolean);
}

/** "Athens GRE", the place as search rows write it. */
export function formatPlace(city: string, country: string): string {
  return [cleanDuv(city), cleanDuv(country)].filter(Boolean).join(" ");
}

/** Women are "W" on this site; DUV sends "F" or "W". */
export function sexKey(gender: string): "W" | "M" | null {
  const g = gender.trim().toUpperCase();
  if (g === "F" || g === "W") return "W";
  if (g === "M") return "M";
  return null;
}
