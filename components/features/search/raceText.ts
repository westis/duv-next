import { cleanDuv, formatCourseLength, formatLengthAndClimb } from "@/lib/format";
import type { RaceEdition } from "./races";

/**
 * The distances of a race day, longest first: "100 mi, 50 mi, 50 km". A trail
 * race names its climb with each length: "117 km · 6 500 m+".
 */
export function formatDistances(distances: Pick<RaceEdition, "length" | "climb" | "trail">[], locale: string): string {
  const texts = distances.map((d) =>
    d.trail ? formatLengthAndClimb({ length: d.length, climb: d.climb }, locale) : formatCourseLength(d.length, locale)
  );
  return Array.from(new Set(texts.filter(Boolean))).join(", ");
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
