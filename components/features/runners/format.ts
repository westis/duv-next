// Helpers for the runner page. The DUV API uses "&nbsp;" for empty cells.

export function clean(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  return str === "&nbsp;" ? "" : str;
}

/** "10:08:00 h" or "8:53:30" → seconds; "245.123 km" → km. */
export function perfValue(perf: string): { kind: "time" | "distance"; value: number } | null {
  const str = clean(perf).replace(/\s*(h|km)$/i, "");
  if (str.includes(":")) {
    const parts = str.split(":").map(Number);
    if (parts.some(Number.isNaN)) return null;
    return { kind: "time", value: parts.reduce((acc, n) => acc * 60 + n, 0) };
  }
  const km = Number.parseFloat(str);
  return Number.isNaN(km) ? null : { kind: "distance", value: km };
}

/** Index of the best performance: lowest time, or longest distance for timed races. */
export function bestIndex(perfs: string[]): number {
  let best = -1;
  let bestVal: { kind: string; value: number } | null = null;
  perfs.forEach((perf, i) => {
    const v = perfValue(perf);
    if (!v) return;
    if (!bestVal || (v.kind === "time" ? v.value < bestVal.value : v.value > bestVal.value)) {
      best = i;
      bestVal = v;
    }
  });
  return best;
}
