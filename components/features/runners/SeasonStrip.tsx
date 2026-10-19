import { useLocale, useTranslations } from "next-intl";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SeasonBar } from "./ledger";

/**
 * Kilometres per season as a bar strip, the busiest season in red. Each bar
 * that has races is a link to that season in the history; seasons without
 * races keep their place as a hairline so gaps read as gaps.
 */
export function SeasonStrip({ bars }: { bars: SeasonBar[] }) {
  const t = useTranslations("runner.strip");
  const locale = useLocale();
  if (bars.length < 2) return null;
  const max = Math.max(...bars.map((b) => b.km), 1);
  const top = bars.reduce((best, b) => (b.km > best.km ? b : best), bars[0]);
  // Label every year while they fit, else the first, the last and every fifth.
  const every = bars.length <= 8 ? 1 : bars.length <= 16 ? 2 : 5;
  const labelled = (i: number, year: number) =>
    i === 0 || i === bars.length - 1 || (every === 1 ? true : year % every === 0 && i > 1 && i < bars.length - 2);

  return (
    <figure className="mt-6 border-b border-border pb-3 md:grid md:grid-cols-[9rem_minmax(0,1fr)] md:items-end md:gap-6">
      <figcaption className="mb-2 text-xs text-fg-muted md:mb-6 md:text-[0.8125rem]">
        {t("caption")}
        <span className="hidden md:block">{t("hint")}</span>
      </figcaption>
      <ol className="flex h-28 items-end gap-[3px] sm:gap-1.5" aria-label={t("label", { first: bars[0].year, last: bars[bars.length - 1].year })}>
        {bars.map((bar, i) => {
          const km = formatCount(Math.round(bar.km), locale) ?? "0";
          const height = bar.raced ? Math.max(4, Math.round((bar.km / max) * 100)) : 0;
          const label = bar.raced
            ? t("bar", { year: bar.year, km, events: bar.events })
            : t("none", { year: bar.year });
          const showYear = labelled(i, Number(bar.year));
          const body = (
            <>
              <span className="flex h-[5.5rem] w-full items-end">
                <span
                  aria-hidden
                  className={cn(
                    "block w-full transition-colors",
                    bar.raced
                      ? bar === top
                        ? "bg-brand"
                        : "bg-fg-muted/45 group-hover:bg-fg-muted"
                      : "h-px bg-border"
                  )}
                  style={bar.raced ? { height: `${height}%` } : undefined}
                />
              </span>
              <span
                aria-hidden
                className={cn("mt-1 block text-center text-[0.6875rem] leading-4 text-fg-muted tabular", !showYear && "invisible")}
              >
                {bar.year}
              </span>
            </>
          );
          return (
            <li key={bar.year} className="min-w-0 flex-1">
              {bar.raced ? (
                <a href={`#y${bar.year}`} title={label} aria-label={label} className="group block focus-visible:outline-2 focus-visible:outline-offset-2">
                  {body}
                </a>
              ) : (
                <span title={label} className="block">
                  <span className="sr-only">{label}</span>
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
