import type { Metadata } from "next";
import { format, parseISO } from "date-fns";
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
  groupDistances,
  parseCalendarParams,
  yearLabel,
  zipOptions,
} from "@/components/features/calendar/params";

export const metadata: Metadata = {
  title: "Race calendar",
  description: "Upcoming and past ultramarathon races worldwide.",
};

interface PageProps {
  searchParams: Promise<CalendarSearchParams>;
}

function toApiParams(state: CalendarFilterState): CalendarParams {
  return {
    plain: true,
    page: state.page,
    perpage: state.perpage,
    order: state.order,
    ...(state.from && state.to
      ? { from: state.from, to: state.to }
      : { year: state.year }),
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
  const years = (data?.FltYearlist ?? ["futur", "past1"]).map(String);
  if (!years.includes("all")) years.push("all");
  return {
    years,
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

function pageTitle(state: CalendarFilterState) {
  if (state.from && state.to) {
    const f = (d: string) => format(parseISO(d), "d MMM yyyy");
    return `Races ${f(state.from)} – ${f(state.to)}`;
  }
  if (state.year === "futur") return "Upcoming races";
  if (state.year === "past1") return "Races in the past 12 months";
  return `Race calendar: ${yearLabel(state.year)}`;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const state = parseCalendarParams(await searchParams);

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
      <h1 className="text-3xl font-bold mb-6">{pageTitle(state)}</h1>
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
