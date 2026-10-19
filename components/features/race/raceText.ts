// Text for the result sheet's figures: results without units, gaps, band labels.
import { formatCount, formatDistance, formatDuration, formatPerformanceText } from "../../../lib/format";
import type { Band, ResultKind } from "./raceModel";

/** A result as the lists print it: "6:09:25", "278.622" (km in the heading), laps as DUV sends them. */
export function resultText(perf: string, kind: ResultKind | null, value: number | null, locale: string): string {
  if (kind === "distance" && value !== null) return formatDistance(value, locale)?.number ?? perf;
  return formatPerformanceText(perf, locale);
}

/** "12:34" under an hour, else "1:02:03". */
function shortDuration(seconds: number): string {
  const full = formatDuration(Math.round(seconds)) ?? "";
  return full.startsWith("0:") ? full.slice(2).replace(/^0(\d:)/, "$1") : full;
}

/** Gap to the winner: "+12:34" for times, "−4.450" for distances. */
export function gapText(gap: number | null, kind: ResultKind | null, locale: string): string {
  if (gap === null || gap <= 0) return "";
  if (kind === "time") return `+${shortDuration(gap)}`;
  if (kind === "distance") return `−${formatDistance(gap, locale)?.number ?? ""}`;
  return "";
}

/** A sum of times or distances: "21:13:04" or "768.640". */
export function totalText(total: number, kind: ResultKind | null, locale: string): string {
  if (kind === "time") return formatDuration(Math.round(total)) ?? "";
  return formatDistance(total, locale)?.number ?? "";
}

/** A band edge: "6:00" (hours) or "250 km". */
export function edgeText(edge: number, kind: ResultKind | null, locale: string): string {
  if (kind === "time") {
    const minutes = Math.round(edge / 60);
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
  }
  return `${formatCount(edge, locale)} km`;
}

/** Jump link text: "<6:00", "7:00", "250+", "200", "<100". */
export function bandShortText(band: Band, kind: ResultKind | null, locale: string): string {
  const edge = (n: number) => (kind === "time" ? edgeText(n, kind, locale) : (formatCount(n, locale) ?? ""));
  if (band.from === null && band.to !== null) return `<${edge(band.to)}`;
  if (band.to === null && band.from !== null) return `${edge(band.from)}+`;
  return band.from !== null ? edge(band.from) : "";
}
