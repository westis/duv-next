import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCalendar, type CalendarParams } from "@/lib/duv";
import type { CalendarRace, CalendarResponse } from "@/lib/duv/types";
import {
  CalendarFilters,
  type CalendarFilterOptions,
} from "@/components/features/calendar/CalendarFilters";
import { CalendarList } from "@/components/features/calendar/CalendarList";
import { CalendarPagination } from "@/components/features/calendar/CalendarPagination";
import {
  type CalendarFilterState,
  type CalendarSearchParams,
  calendarHref,
  groupDistances,
  parseCalendarParams,
  zipOptions,
} from "@/components/features/calendar/params";
import { formatDateRange } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("calendar");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

interface PageProps {
  searchParams: Promise<CalendarSearchParams>;
}

function toApiParams(state: CalendarFilterState): CalendarParams {
  return {
    plain: true,
    page: state.page,
    perpage: state.perpage,
    order: state.order,
    // No range: DUV's own "from today onward".
    ...(state.from && state.to
      ? { from: state.from, to: state.to }
      : { year: "futur" }),
    dist: state.dist,
    country: state.country === "all" ? undefined : state.country,
    cups: state.cups,
    rproof: state.rproof || undefined,
    norslt: state.norslt || undefined,
    splits: state.splits || undefined,
    label: state.iau ? "IAU" : undefined,
  };
}

/** Filter lists change rarely; same cached call as /api/countries. */
async function getFilterOptions(): Promise<CalendarFilterOptions> {
  let data: CalendarResponse | null = null;
  try {
    data = await getCalendar({ perpage: 1 }, { revalidate: 86400 });
  } catch (error) {
    console.error("Calendar filter lists unavailable:", error);
  }
  return {
    distances: groupDistances(
      data?.FltDistValue ?? [],
      data?.FltDistLabel ?? [],
    ),
    countries: zipOptions(
      data?.FltCountryValues ?? [],
      data?.FltCountryLabels ?? [],
    ),
    cups: zipOptions(data?.FltCupValue ?? [], data?.FltCupLabel ?? []),
  };
}

async function pageTitle(state: CalendarFilterState) {
  const t = await getTranslations("calendar");
  const locale = await getLocale();
  const range = state.from && state.to ? formatDateRange(state.from, locale, state.to) : null;
  return range ? t("title.range", { range: range.text }) : t("title.upcoming");
}

export default async function EventsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const state = parseCalendarParams(sp);
  // Old ?year= links (the year selector is gone): move to the same dates as a range.
  if (sp.year !== undefined) redirect(calendarHref(state));

  const [options, calendar] = await Promise.all([
    getFilterOptions(),
    getCalendar(toApiParams(state)).then(
      (data) => ({ data, error: null }),
      (error: unknown) => {
        console.error("Calendar fetch failed:", error);
        return { data: null, error };
      },
    ),
  ]);

  const races: CalendarRace[] = [...(calendar.data?.Races ?? [])];
  // The API orders by date; keep it stable within the page whatever it sends.
  races.sort((a, b) =>
    state.order === "asc"
      ? a.Startdate.localeCompare(b.Startdate)
      : b.Startdate.localeCompare(a.Startdate),
  );
  const total = calendar.data?.HitCnt ?? races.length;
  const maxPage = calendar.data?.Pagination?.MaxPage ?? 1;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{await pageTitle(state)}</h1>
      <CalendarFilters state={state} options={options} />

      {calendar.error ? (
        <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">
          The calendar could not be loaded right now. Please try again shortly.
        </div>
      ) : races.length === 0 ? (
        <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">
          No races match these filters.
        </div>
      ) : (
        <div className="space-y-4">
          <CalendarList races={races} />
          <CalendarPagination state={state} maxPage={maxPage} total={total} />
        </div>
      )}
    </div>
  );
}
