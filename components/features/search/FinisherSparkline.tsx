import { useTranslations } from "next-intl";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RaceYear } from "./races";

const SLOT = 4;
const HEIGHT = 20;

/**
 * Finishers per year as small bars, one slot per year from the first edition
 * to the last; a year without an edition or without results is a faint tick.
 * Read out as one sentence (first and last year, the biggest field).
 */
export function FinisherSparkline({ years, locale, className }: { years: RaceYear[]; locale: string; className?: string }) {
  const t = useTranslations("search");
  if (years.length < 2) return null;
  const max = Math.max(0, ...years.map((y) => y.finishers ?? 0));
  if (max === 0) return null;
  const peak = years.reduce((best, y) => ((y.finishers ?? 0) > (best.finishers ?? 0) ? y : best), years[0]);
  const width = years.length * SLOT;
  const label = t("sparkline", {
    from: years[0].year,
    to: years[years.length - 1].year,
    max: formatCount(max, locale) ?? String(max),
    maxYear: peak.year,
  });
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={cn("block h-5", className)}
      style={{ width: `${Math.min(width * 1.25, 150)}px` }}
    >
      {years.map((y, i) => {
        const has = (y.finishers ?? 0) > 0;
        const h = has ? Math.max(1.5, ((y.finishers ?? 0) / max) * HEIGHT) : 1;
        return (
          <rect
            key={y.year}
            x={i * SLOT + 0.5}
            y={HEIGHT - h}
            width={SLOT - 1}
            height={h}
            className={has ? "fill-link" : "fill-border"}
          />
        );
      })}
    </svg>
  );
}
