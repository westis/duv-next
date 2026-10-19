import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState, SectionHeading, SectionLayout, StatTile } from "@/components/design";
import { BestRunners, rankingsHref } from "@/components/features/countries/BestRunners";
import { CountryHeader } from "@/components/features/countries/CountryHeader";
import {
  getCountry,
  getCountryOptions,
  loadBestRunners,
  loadPodiumsAbroad,
  loadRacesInYear,
  loadUpcomingRaces,
  parseYear,
  type DistanceBest,
} from "@/components/features/countries/data";
import { HostBars, PodiumFeed } from "@/components/features/countries/PodiumFeed";
import { RacesInCountry, parseSurface } from "@/components/features/countries/RacesInCountry";
import type { RankingEntry } from "@/lib/duv/types";
import { formatCount, formatCourseLength, formatPerformanceText, formatRunnerName, parsePerformance } from "@/lib/format";

export const revalidate = 3600;

/** Podiums shown on the page; the rest are on /countries/[nat]/abroad. */
const FEED_ROWS = 8;

interface PageProps {
  params: Promise<{ nat: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const country = await getCountry((await params).nat);
  const year = parseYear((await searchParams).year);
  const t = await getTranslations("countries.page");
  return {
    title: t("metaTitle", { country: country.name, year }),
    description: t("metaDescription", { country: country.name, year }),
  };
}

/** The best result of the year at the first of these distances anyone ran: the fourth ledger figure. */
function headlineResult(best: DistanceBest[] | null): { dist: string; entry: RankingEntry } | null {
  for (const dist of ["100km", "24h", "50km", "100mi"]) {
    const d = best?.find((b) => b.dist === dist);
    const candidates = [d?.women.top[0], d?.men.top[0]].filter((e): e is RankingEntry => Boolean(e));
    if (!candidates.length) continue;
    const value = (e: RankingEntry) => parsePerformance(e.Perf);
    const pick = candidates.reduce((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (!va || !vb) return va ? a : b;
      // Times: lower is better. Distances (fixed time): higher is better.
      return va.kind === "time" ? (vb.value < va.value ? b : a) : vb.value > va.value ? b : a;
    });
    return { dist, entry: pick };
  }
  return null;
}

/**
 * A country, read top to bottom (Almanac): masthead with four figures, best
 * runners per distance, podiums abroad by host country, races in the country
 * by month, and a link to the national records.
 */
export default async function CountryPage({ params, searchParams }: PageProps) {
  const country = await getCountry((await params).nat);
  const sp = await searchParams;
  const year = parseYear(sp.year);
  const surface = parseSurface(sp.surface);
  const nat = country.code;
  const t = await getTranslations("countries.page");
  const locale = await getLocale();
  const isCurrentYear = year === new Date().getFullYear();

  const [countries, best, podiums, races, upcoming] = await Promise.all([
    getCountryOptions(),
    loadBestRunners(nat, year),
    loadPodiumsAbroad(nat, year),
    loadRacesInYear(nat, year),
    isCurrentYear ? loadUpcomingRaces(nat) : Promise.resolve(null),
  ]);
  const names = Object.fromEntries(countries.map((c) => [c.value, c.label]));

  const wins = podiums?.filter((r) => Number(r.RankMW) === 1) ?? [];
  const winsWomen = wins.filter((r) => r.Gender === "W").length;
  const hosts = new Set(podiums?.map((r) => r.Country) ?? []).size;
  const withResults = races?.filter((r) => ["C", "P"].includes((r.Results ?? "").trim().toUpperCase())).length ?? 0;
  const headline = headlineResult(best);
  const yearQuery = isCurrentYear ? "" : `?year=${year}`;
  const recordsHref = `/countries/${nat}/records`;

  const sections = [
    { href: "#best", label: t("best.title", { year }) },
    { href: "#abroad", label: t("abroad.title") },
    { href: "#races", label: t("races.title", { country: country.name }) },
    { href: recordsHref, label: t("records.link") },
  ];

  const facts = [
    races && (
      <StatTile
        key="races"
        label={t("facts.races", { year })}
        value={formatCount(races.length, locale)}
        delta={races.length > 0 ? t("facts.racesWithResults", { count: formatCount(withResults, locale) ?? "0" }) : undefined}
      />
    ),
    podiums && <StatTile key="podiums" label={t("facts.podiums")} value={formatCount(podiums.length, locale)} />,
    podiums && (
      <StatTile
        key="wins"
        label={t("facts.wins")}
        value={formatCount(wins.length, locale)}
        delta={
          wins.length > 0
            ? t("facts.winsSplit", {
                women: formatCount(winsWomen, locale) ?? "0",
                men: formatCount(wins.length - winsWomen, locale) ?? "0",
              })
            : undefined
        }
      />
    ),
    headline && (
      <StatTile
        key="headline"
        label={t("facts.fastest", { dist: formatCourseLength(headline.dist, locale) })}
        value={formatPerformanceText(headline.entry.Perf, locale)}
        delta={formatRunnerName({ first: headline.entry.FirstName, last: headline.entry.LastName }, locale)}
      />
    ),
  ].filter(Boolean);

  return (
    <SectionLayout
      items={sections}
      label={t("sections")}
      heading={t("contents")}
      stickyRow
      header={
        <CountryHeader
          country={country}
          countries={countries}
          year={year}
          yearAction={`/countries/${nat}`}
          facts={facts.length > 0 ? facts : undefined}
        />
      }
    >
      <div className="pb-12">
        <section aria-labelledby="best">
          <SectionHeading id="best">{t("best.title", { year })}</SectionHeading>
          <p className="mb-4 text-sm text-fg-muted md:text-[0.9375rem]">{t("best.deck", { country: country.name, year })}</p>
          {best === null ? (
            <EmptyState>{t("loadError")}</EmptyState>
          ) : best.length === 0 ? (
            <EmptyState action={<Link href={rankingsHref(nat, year, "100km")}>{t("best.fullList", { dist: formatCourseLength("100km", locale), year })}</Link>}>
              {t("best.empty", { country: country.name, year })}
            </EmptyState>
          ) : (
            <BestRunners best={best} nat={nat} year={year} />
          )}
          <p className="mt-3 max-w-prose text-xs text-fg-muted md:text-sm">{t("best.trailNote")}</p>
        </section>

        <section aria-labelledby="abroad">
          <SectionHeading id="abroad">{t("abroad.title")}</SectionHeading>
          {podiums === null ? (
            <EmptyState>{t("loadError")}</EmptyState>
          ) : podiums.length === 0 ? (
            <EmptyState>{t("abroad.empty", { country: country.name, year })}</EmptyState>
          ) : (
            <>
              <p className="mb-4 text-sm text-fg-muted md:text-[0.9375rem]">
                {t("abroad.deck", { country: country.name, year, count: podiums.length, hosts })}
              </p>
              <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
                <div>
                  <h3 className="label-caps mb-2 text-fg-muted">{t("abroad.where")}</h3>
                  <HostBars rows={podiums} names={names} />
                </div>
                <div className="min-w-0">
                  <h3 className="label-caps mb-1 text-fg-muted">{t("abroad.latest")}</h3>
                  <PodiumFeed rows={podiums.slice(0, FEED_ROWS)} />
                  <Link
                    href={`/countries/${nat}/abroad${yearQuery}`}
                    className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold"
                  >
                    {t("abroad.all", { count: formatCount(podiums.length, locale) ?? "" })}
                    <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </section>

        <section aria-labelledby="races">
          <SectionHeading id="races">{t("races.title", { country: country.name })}</SectionHeading>
          {races === null ? (
            <EmptyState>{t("loadError")}</EmptyState>
          ) : (
            <RacesInCountry
              nat={nat}
              countryName={country.name}
              year={year}
              races={races}
              upcoming={upcoming}
              surface={surface}
            />
          )}
        </section>

        <Link
          href={recordsHref}
          className="mt-10 flex min-h-14 items-center justify-between gap-4 border-y-2 border-fg py-3 font-semibold text-fg no-underline hover:underline"
        >
          <span>
            <span className="block font-serif text-lg md:text-xl">{t("records.link")}</span>
            <span className="block text-sm font-normal text-fg-muted">{t("records.xref")}</span>
          </span>
          <ArrowRight aria-hidden strokeWidth={1.75} className="size-5 shrink-0" />
        </Link>
      </div>
    </SectionLayout>
  );
}
