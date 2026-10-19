import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { DuvApiError, getEventDetail, getRunnerProfile, type PersonHeader } from "@/lib/duv";
import { formatCourseLength, formatRunnerName, parseDuvName } from "@/lib/format";
import { EmptyState, FilterLinks } from "@/components/design";
import { RunnerHeader } from "@/components/features/runners/RunnerHeader";
import { SeasonStrip } from "@/components/features/runners/SeasonStrip";
import { PersonalBests } from "@/components/features/runners/PersonalBests";
import { TrailRaces, type TrailResult } from "@/components/features/runners/TrailRaces";
import { RepeatRaces } from "@/components/features/runners/RepeatRaces";
import { Ledger, type Courses } from "@/components/features/runners/Ledger";
import {
  buildLedger,
  countWins,
  distKey,
  filterLedger,
  isOtherDistance,
  parseLedgerFilter,
  pbLadder,
  seasonBars,
  type LedgerFilter,
} from "@/components/features/runners/ledger";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ personId: string }>;
  searchParams: Promise<{ label?: string; dist?: string; splits?: string }>;
}

const loadProfile = cache(async (personId: string, label: boolean) => {
  if (!/^\d+$/.test(personId)) return null;
  try {
    const data = await getRunnerProfile({ runner: personId, label: label || undefined });
    return data?.PersonHeader ? data : null;
  } catch (error) {
    // The live API answers an unknown runner ID with a body that is not
    // valid JSON, which the client reports as a 502.
    if (error instanceof DuvApiError && error.status === 502) return null;
    throw error;
  }
});

/** Length and climb of trail races: the runner profile has neither, the race details have both. */
const MAX_COURSES = 60;
const loadCourses = cache(async (ids: string) => {
  const list = ids ? ids.split(",") : [];
  const courses: Courses = {};
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const id = list[next++];
      try {
        const detail = await getEventDetail({ event: id }, { revalidate: 86400 });
        const race = detail?.raceDetails;
        if (race) courses[id] = { length: race.Length || undefined, climb: race.AltitudeDiff || undefined };
      } catch {
        // A race whose details fail just shows its length without climb.
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(6, list.length) }, worker));
  return courses;
});

function runnerName(header: PersonHeader & { FirstName?: string; LastName?: string }, locale: string) {
  const parsed = parseDuvName(header.PersonName);
  return formatRunnerName({ first: header.FirstName || parsed.first, last: header.LastName || parsed.last }, locale);
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { personId } = await params;
  const { label } = await searchParams;
  const t = await getTranslations("runner.meta");
  try {
    const profile = await loadProfile(personId, label === "1");
    if (profile) {
      const name = runnerName(profile.PersonHeader, await getLocale());
      return { title: t("title", { name }), description: t("description", { name }) };
    }
  } catch (error) {
    console.error("Error generating runner metadata:", error);
  }
  return { title: t("fallbackTitle") };
}

export default async function RunnerPage({ params, searchParams }: PageProps) {
  const { personId } = await params;
  const query = await searchParams;
  const labelOnly = query.label === "1";
  const allOpen = query.splits === "open";

  const profile = await loadProfile(personId, labelOnly);
  if (!profile) notFound();

  const t = await getTranslations("runner");
  const locale = await getLocale();
  const header = profile.PersonHeader;
  const name = runnerName(header, locale);

  const ledger = buildLedger(profile.AllPerfs, profile.AllPBs);
  const ladder = pbLadder(profile.AllPBs);
  const bars = seasonBars(profile.AllPerfs);
  const pbKeys = new Set(ladder.map((l) => distKey(l.dist)));
  const mains = ledger.flatMap((y) => y.groups.map((g) => ({ year: y.year, row: g.main })));

  // Trail races newest first, with their course facts.
  const trailRows = mains.filter((m) => m.row.trail);
  const courseIds = trailRows.slice(0, MAX_COURSES).map((m) => m.row.id);
  const courses = await loadCourses(courseIds.join(","));
  const trail: TrailResult[] = trailRows.map((m) => ({
    row: m.row,
    year: m.year,
    length: courses[m.row.id]?.length,
    climb: courses[m.row.id]?.climb,
  }));
  const otherCount = mains.filter((m) => isOtherDistance(m.row, pbKeys)).length;

  // URLs keep the other choices: ?dist=, ?label=1, ?splits=open.
  const href = (change: Partial<Record<"dist" | "label" | "splits", string | null>>) => {
    const next = new URLSearchParams();
    const merged = { dist: query.dist ?? null, label: query.label ?? null, splits: query.splits ?? null, ...change };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const qs = next.toString();
    return `/runners/${personId}${qs ? `?${qs}` : ""}#history`;
  };

  const filter: LedgerFilter = parseLedgerFilter(query.dist);
  const { years: shown, open } = filterLedger(ledger, filter, pbKeys);
  const countOf = (f: LedgerFilter) =>
    filterLedger(ledger, f, pbKeys).years.reduce((sum, y) => sum + y.groups.length, 0);
  const current = filter.kind === "dist" ? filter.key : filter.kind;
  const distItems = [
    { href: href({ dist: null }), label: t("filters.all"), count: mains.length, current: current === "all" },
    ...ladder
      .map((line) => ({ line, count: countOf({ kind: "dist", key: distKey(line.dist) }) }))
      .filter(({ count }) => count > 0)
      .map(({ line, count }) => ({
        href: href({ dist: distKey(line.dist) }),
        label: formatCourseLength(line.dist, locale),
        count,
        current: current === distKey(line.dist),
      })),
    ...(trailRows.length
      ? [{ href: href({ dist: "trail" }), label: t("filters.trail"), count: trailRows.length, current: current === "trail" }]
      : []),
    ...(otherCount
      ? [{ href: href({ dist: "other" }), label: t("filters.other"), count: otherCount, current: current === "other" }]
      : []),
  ];
  const hasSplits = ledger.some((y) => y.groups.some((g) => g.splits.length > 0));
  const years = bars.filter((b) => b.raced).map((b) => b.year).reverse();
  const first = bars.length ? Number(bars[0].year) : 0;
  const last = bars.length ? Number(bars[bars.length - 1].year) : 0;

  return (
    <div className="container pb-16">
      <RunnerHeader
        personId={personId}
        header={header}
        name={name}
        figures={{
          events: header.TotalEvtCnt ?? null,
          km: Number.parseFloat(String(header.TotalKm)) || null,
          firstSeason: bars[0]?.year ?? null,
          lastSeason: bars[bars.length - 1]?.year ?? null,
          wins: countWins(ledger),
        }}
      />
      <SeasonStrip bars={bars} />

      <div className="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <aside aria-label={t("railLabel")} className="pt-6 lg:border-e lg:border-border lg:pe-8 lg:pb-10">
          <PersonalBests
            lines={ladder}
            first={first}
            last={last}
            otherCount={otherCount}
            otherHref={href({ dist: "other" })}
            hrefFor={(dist) => href({ dist: distKey(dist) })}
          />
          <TrailRaces items={trail} href={href({ dist: "trail" })} />
          <RepeatRaces rows={profile.CompTable ?? []} />
          {years.length > 2 && (
            <nav aria-label={t("jumpLabel")} className="mt-8 hidden text-sm lg:block">
              <h2 className="label-caps mb-1 text-fg-muted">{t("jump")}</h2>
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {years.map((y) => (
                  <li key={y}>
                    <a href={`#y${y}`} className="text-link tabular hover:underline">
                      {y}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>

        <section id="history" aria-labelledby="history-heading" className="scroll-mt-[calc(var(--header-h)+1rem)] pt-6">
          <h2 id="history-heading" className="label-caps mb-1 text-fg-muted">
            {t("history")}
          </h2>
          {distItems.length > 2 && <FilterLinks items={distItems} label={t("filters.label")} />}
          <div className="mb-3 flex flex-wrap items-center gap-x-5 text-sm">
            {hasSplits && (
              <Link
                href={href({ splits: allOpen ? null : "open" })}
                scroll={false}
                className="inline-flex min-h-11 items-center text-link hover:underline md:min-h-9"
              >
                {allOpen ? t("filters.foldSplits") : t("filters.openSplits")}
              </Link>
            )}
            <Link
              href={href({ label: labelOnly ? null : "1" })}
              scroll={false}
              className="inline-flex min-h-11 items-center text-link hover:underline md:min-h-9"
            >
              {labelOnly ? t("filters.allRaces") : t("filters.iauOnly")}
            </Link>
            {labelOnly && <span className="text-fg-muted">{t("filters.iauNote")}</span>}
          </div>
          {shown.length ? (
            <Ledger years={shown} courses={courses} open={open} allOpen={allOpen} />
          ) : (
            <EmptyState>{labelOnly ? t("emptyIau") : t("empty")}</EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
