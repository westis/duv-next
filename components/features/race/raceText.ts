// Text for the result sheet's figures: results without units and gaps.
import { formatDistance, formatDuration, formatPerformanceText } from "../../../lib/format";
import type { ResultKind } from "./raceModel";

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
