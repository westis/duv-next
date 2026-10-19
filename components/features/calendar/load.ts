import "server-only";

import { getCalendar, getEventDetail, type CalendarParams } from "@/lib/duv";
import type { CalendarRace, CalendarResponse } from "@/lib/duv/types";
import { type CalendarFilterState, apiDist, groupDistances, zipOptions, type OptionGroup, type Option } from "./params";
import { matchesSurface, runningState, wantsClimb } from "./races";

export interface CalendarFilterOptions {
  formats: OptionGroup[];
  countries: Option[];
  cups: Option[];
}

/** Filter lists change rarely: one cached call a day. */
export async function loadFilterOptions(): Promise<CalendarFilterOptions> {
  let data: CalendarResponse | null = null;
  try {
    data = await getCalendar({ perpage: 1 }, { revalidate: 86400 });
  } catch (error) {
    console.error("Calendar filter lists unavailable:", error);
  }
  return {
    formats: groupDistances(data?.FltDistValue ?? [], data?.FltDistLabel ?? []),
    countries: zipOptions(data?.FltCountryValues ?? [], data?.FltCountryLabels ?? []),
    cups: zipOptions(data?.FltCupValue ?? [], data?.FltCupLabel ?? []),
  };
}

function filterParams(state: CalendarFilterState): CalendarParams {
  return {
    plain: true,
    dist: apiDist(state),
    country: state.country === "all" ? undefined : state.country,
    cups: state.cups === "all" ? undefined : state.cups,
    rproof: state.rproof || undefined,
    norslt: state.norslt || undefined,
    splits: state.splits || undefined,
    label: state.iau ? "IAU" : undefined,
  };
}

export interface CalendarPage {
  races: CalendarRace[];
  total: number;
  pageCount: number;
}

/** One page of the calendar for the filters in the URL. */
export async function loadCalendarPage(state: CalendarFilterState): Promise<CalendarPage> {
  const data = await getCalendar({
    ...filterParams(state),
    page: state.page,
    perpage: state.perpage,
    order: state.order,
    // No range: DUV's own "from today onward".
    ...(state.from && state.to ? { from: state.from, to: state.to } : { year: "futur" }),
  });
  const races = (data?.Races ?? []).filter((r) => matchesSurface(r, state.surface));
  races.sort((a, b) =>
    state.order === "asc" ? a.Startdate.localeCompare(b.Startdate) : b.Startdate.localeCompare(a.Startdate)
  );
  const total = data?.HitCnt ?? races.length;
  const pageCount = Math.max(1, data?.Pagination?.MaxPage ?? Math.ceil(total / state.perpage));
  return { races, total, pageCount };
}

/**
 * Multi-day races that started before today and are still on, under the same
 * filters. DUV's "from today onward" list starts with them, oldest first.
 */
export async function loadRunningNow(state: CalendarFilterState, today: string): Promise<CalendarRace[]> {
  try {
    const data = await getCalendar({ ...filterParams(state), year: "futur", order: "asc", perpage: 100 });
    return (data?.Races ?? []).filter((r) => matchesSurface(r, state.surface) && runningState(r, today) !== null);
  } catch (error) {
    console.error("Running races unavailable:", error);
    return [];
  }
}

/** Most trail races looked up for their climb per page view; the rest show length only. */
const MAX_CLIMB_LOOKUPS = 120;
const CONCURRENCY = 6;

/**
 * Climb (DUV AltitudeDiff) of the trail races in a list. Calendar rows carry
 * none, so each comes from the race's detail call, cached for a day. Failures
 * just leave the climb out.
 */
export async function loadClimbs(races: CalendarRace[]): Promise<Map<string, string>> {
  const ids = Array.from(new Set(races.filter(wantsClimb).map((r) => r.EventID))).slice(0, MAX_CLIMB_LOOKUPS);
  const climbs = new Map<string, string>();
  let next = 0;
  async function worker() {
    while (next < ids.length) {
      const id = ids[next++];
      try {
        const detail = await getEventDetail({ event: id }, { revalidate: 86400 });
        const climb = detail?.raceDetails?.AltitudeDiff?.trim();
        if (climb) climbs.set(id, climb);
      } catch {
        // No climb for this one.
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, ids.length) }, worker));
  return climbs;
}
