import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { RankingEntry } from "@/lib/duv/types";
import { DateText, cleanDuv, formatCount, formatCourseLength, formatPerformanceText, formatRunnerName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DistanceBest, GenderList } from "./data";

/** Distances drawn as small multiples; the rest are listed as links. */
const SHOWN = 4;

export function rankingsHref(nat: string, year: number, dist: string) {
  return `/rankings?year=${year}&dist=${dist}&nat=${nat}`;
}

function Entry({ entry, nat, first, locale }: { entry: RankingEntry; nat: string; first: boolean; locale: string }) {
  const where = [cleanDuv(entry.City), cleanDuv(entry.Country) !== nat ? cleanDuv(entry.Country) : ""]
    .filter(Boolean)
    .join(" ");
  const cat = cleanDuv(entry.CatInt);
  return (
    <li className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-x-2 border-b border-dotted border-border py-1">
      <span className={cn("text-end font-semibold tabular", first && "text-brand-ink")}>
        {formatPerformanceText(entry.Perf, locale)}
      </span>
      <Link href={`/runners/${entry.PersonID}`} className="min-w-0 font-medium text-fg">
        {formatRunnerName({ first: entry.FirstName, last: entry.LastName }, locale)}
      </Link>
      <span className="col-start-2 text-xs text-fg-muted">
        {cat && <>{cat} · </>}
        <DateText value={entry.Startdate || entry.EvtdateShort} locale={locale} />
        {where && <> · {where}</>}
      </span>
    </li>
  );
}

function GenderBlock({ label, list, nat, locale }: { label: string; list: GenderList; nat: string; locale: string }) {
  if (list.top.length === 0) return null;
  return (
    <>
      <h4 className="label-caps mt-2.5 mb-0.5 text-fg-muted">{label}</h4>
      <ol>
        {list.top.map((entry, i) => (
          <Entry key={entry.PerfID || `${entry.PersonID}-${i}`} entry={entry} nat={nat} first={i === 0} locale={locale} />
        ))}
      </ol>
    </>
  );
}

/**
 * Best runners of the year as small multiples, one per distance: the top three
 * women and men, result first, each linking to the full national list in the
 * rankings. Distances with nobody this year are left out.
 */
export async function BestRunners({ best, nat, year }: { best: DistanceBest[]; nat: string; year: number }) {
  const t = await getTranslations("countries.page.best");
  const locale = await getLocale();
  const ordered = [...best].sort((a, b) => b.total - a.total);
  const shown = ordered.slice(0, SHOWN);
  const others = ordered.slice(SHOWN);
  const count = (list: GenderList) => `${formatCount(list.count, locale)}${list.more ? "+" : ""}`;

  return (
    <>
      <div className="grid gap-x-6 sm:grid-cols-2 xl:grid-cols-4">
        {shown.map((d) => {
          const dist = formatCourseLength(d.dist, locale);
          return (
            <section key={d.dist} aria-labelledby={`best-${d.dist}`} className="mb-5 border-t border-fg pt-2">
              <h3 id={`best-${d.dist}`} className="flex items-baseline justify-between gap-2 text-[0.9375rem] font-semibold">
                {dist}
                <small
                  className="text-xs font-normal text-fg-muted tabular"
                  title={t("countsLabel", { women: count(d.women), men: count(d.men), year })}
                >
                  <span aria-hidden>{t("counts", { women: count(d.women), men: count(d.men) })}</span>
                  <span className="sr-only">{t("countsLabel", { women: count(d.women), men: count(d.men), year })}</span>
                </small>
              </h3>
              <GenderBlock label={t("women")} list={d.women} nat={nat} locale={locale} />
              <GenderBlock label={t("men")} list={d.men} nat={nat} locale={locale} />
              <Link href={rankingsHref(nat, year, d.dist)} className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold">
                {t("fullList", { dist, year })}
                <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" />
              </Link>
            </section>
          );
        })}
      </div>
      {others.length > 0 && (
        <p className="text-sm">
          <span className="text-fg-muted">{t("alsoRanked", { year })}</span>{" "}
          {others.map((d, i) => (
            <span key={d.dist}>
              {i > 0 && <span aria-hidden className="text-fg-muted"> · </span>}
              <Link href={rankingsHref(nat, year, d.dist)} className="inline-flex min-h-9 items-center">
                {formatCourseLength(d.dist, locale)}
              </Link>{" "}
              <span className="text-fg-muted tabular">{formatCount(d.total, locale)}</span>
            </span>
          ))}
        </p>
      )}
    </>
  );
}
