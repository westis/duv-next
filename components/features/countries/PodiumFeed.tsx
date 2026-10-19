import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { TopRankAbroadRow } from "@/lib/duv/types";
import { DateText, cleanDuv, formatCourseLength, formatPerformanceText, formatRunnerName } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Finishers of the runner's gender, when DUV gives a number. */
function finishersOf(row: TopRankAbroadRow): number | null {
  const n = Number(row.Gender === "W" ? row.FinisherW : row.FinisherM);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Top-3 places abroad, result first (Almanac feed): performance, runner and
 * place on the first line; race, host country, length and date below. Works
 * the same for a trail race and a 24 h: the place within the race is the fact.
 */
export async function PodiumFeed({ rows, className }: { rows: TopRankAbroadRow[]; className?: string }) {
  const t = await getTranslations("countries.page.abroad");
  const locale = await getLocale();
  return (
    <ul className={cn("border-t border-hair", className)}>
      {rows.map((r) => {
        const place = Number(r.RankMW);
        const count = finishersOf(r);
        const gender = r.Gender === "W" ? "W" : "M";
        const length = formatCourseLength(r.Dist, locale);
        return (
          <li key={`${r.EventID}-${r.PersonID}-${r.RankMW}`} className="border-b border-hair py-2.5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="serif-figures min-w-[6.5rem] text-base font-semibold">
                {formatPerformanceText(r.Performance, locale)}
              </span>
              <Link href={`/runners/${r.PersonID}`} className="font-semibold text-fg">
                {formatRunnerName({ first: r.FirstName, last: r.LastName }, locale)}
              </Link>
              <span className={cn("text-xs font-semibold", place === 1 ? "text-brand-ink" : "text-fg-muted")}>
                {count
                  ? t("place", { place, gender, count })
                  : t("placeNoCount", { place, gender })}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-fg-muted md:text-sm">
              <Link href={`/events/${r.EventID}`} className="text-fg-muted underline-offset-2 hover:text-fg hover:underline">
                {cleanDuv(r.EventName)}
              </Link>
              {" · "}
              <abbr title={cleanDuv(r.Country)} className="no-underline">
                {cleanDuv(r.Country)}
              </abbr>
              {length && <>{" · "}{length}</>}
              {" · "}
              <DateText value={r.Date || r.DateF} locale={locale} />
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Where the places were won: one bar per host country, longest first, with
 * the count as text so the bar is never the only signal.
 */
export async function HostBars({
  rows,
  names,
  limit = 9,
}: {
  rows: TopRankAbroadRow[];
  /** Country names by code, for screen readers and tooltips. */
  names: Record<string, string>;
  limit?: number;
}) {
  const t = await getTranslations("countries.page.abroad");
  const counts = new Map<string, number>();
  for (const r of rows) {
    const code = cleanDuv(r.Country);
    if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const hosts = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const shown = hosts.slice(0, limit);
  const rest = hosts.length - shown.length;
  const max = shown[0]?.[1] ?? 1;

  return (
    <div>
      <ul className="space-y-1">
        {shown.map(([code, count]) => {
          const name = names[code] ?? code;
          return (
            <li key={code} className="grid grid-cols-[3rem_minmax(0,1fr)_2rem] items-center gap-2 text-sm">
              <Link href={`/countries/${code}`} className="font-semibold text-fg tabular" title={name}>
                <span aria-hidden>{code}</span>
                <span className="sr-only">{t("hostLabel", { country: name, count })}</span>
              </Link>
              <span aria-hidden className="block h-3 bg-fg" style={{ width: `${(count / max) * 100}%` }} />
              <span aria-hidden className="text-end font-semibold tabular">
                {count}
              </span>
            </li>
          );
        })}
      </ul>
      {rest > 0 && <p className="mt-2 text-xs text-fg-muted md:text-sm">{t("moreHosts", { count: rest })}</p>}
    </div>
  );
}
