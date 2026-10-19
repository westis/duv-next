import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState, Pagination } from "@/components/design";
import { CalendarLedger } from "@/components/features/calendar/CalendarLedger";
import { CalendarSentence } from "@/components/features/calendar/CalendarSentence";
import {
  RunningNow,
  type RunningRow,
} from "@/components/features/calendar/RunningNow";
import {
  type CalendarPage,
  loadCalendarPage,
  loadClimbs,
  loadFilterOptions,
  loadRunningNow,
} from "@/components/features/calendar/load";
import {
  type CalendarSearchParams,
  calendarHref,
  isoToday,
  parseCalendarParams,
} from "@/components/features/calendar/params";
import { groupRows, runningState } from "@/components/features/calendar/races";
import { formatCount } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("calendar");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

interface PageProps {
  searchParams: Promise<CalendarSearchParams>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const state = parseCalendarParams(sp);
  // Old ?year= and ?dist=Trail links: move to the same view in today's params.
  if (
    sp.year !== undefined ||
    (sp.dist !== undefined &&
      state.surface !== "all" &&
      sp.surface === undefined)
  ) {
    redirect(calendarHref(state));
  }

  const t = await getTranslations("calendar");
  const locale = await getLocale();
  const today = isoToday();
  // The band shows on the first page of a view that includes today.
  const includesToday =
    !state.from || !state.to || (state.from <= today && today <= state.to);
  const withBand = includesToday && state.page === 1;

  const [options, page, running] = await Promise.all([
    loadFilterOptions(),
    loadCalendarPage(state).then(
      (data): CalendarPage | null => data,
      (error: unknown) => {
        console.error("Calendar fetch failed:", error);
        return null;
      },
    ),
    withBand ? loadRunningNow(state, today) : Promise.resolve([]),
  ]);

  // Races under way sit in their own band, not on the day they started.
  const listStart = state.from ?? today;
  const runningIds = new Set(running.map((r) => r.EventID));
  const races = (page?.races ?? []).filter(
    (r) => !(runningIds.has(r.EventID) && r.Startdate < listStart),
  );
  const climbs = await loadClimbs([...races, ...running]);
  const rows = groupRows(races, locale, climbs);
  // One row per race here: each distance of a multi-day event has its own end.
  const runningItems: RunningRow[] = running
    .flatMap((race) => groupRows([race], locale, climbs))
    .flatMap((row) => {
      const s = runningState(
        { Startdate: row.startdate, Enddate: row.enddate },
        today,
      );
      return s ? [{ row, state: s }] : [];
    });
  const showResults = rows.some((row) => row.formats.some((f) => f.hasResults));

  const first =
    page && page.total > 0 ? (state.page - 1) * state.perpage + 1 : 0;
  const last = page ? Math.min(state.page * state.perpage, page.total) : 0;

  return (
    <div className="container pt-5 pb-12 md:pt-7">
      <h1 className="label-caps mb-2 text-[0.8125rem] text-fg-muted">
        {t("heading")}
      </h1>
      <CalendarSentence
        state={state}
        today={today}
        formats={options.formats}
        countries={options.countries}
        cups={options.cups}
      />

      {withBand && <RunningNow items={runningItems} today={today} />}

      <div className="mt-6">
        {!page ? (
          <EmptyState>{t("error")}</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>{t("empty")}</EmptyState>
        ) : (
          <>
            <CalendarLedger rows={rows} showResults={showResults} />
            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-fg-muted tabular">
                {t("shown", {
                  first: formatCount(first, locale) ?? String(first),
                  last: formatCount(last, locale) ?? String(last),
                  total: formatCount(page.total, locale) ?? String(page.total),
                })}
              </p>
              <Pagination
                page={Math.min(state.page, page.pageCount)}
                pageCount={page.pageCount}
                hrefForPage={(n) => calendarHref({ ...state, page: n })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
