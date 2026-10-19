import { cache } from "react";
import { DuvApiError, getEventDetail, getEventResults } from "@/lib/duv";
import type { EventResultRow, EventResultsHeader } from "@/lib/duv";
import type { WinnerRow } from "./raceModel";

/**
 * The race behind /events/[eventId]. Cached per request, so the page and its
 * metadata share one DUV call. Returns null for ids DUV doesn't know (it
 * answers 400 for those).
 */
export const loadRace = cache(async (eventId: string) => {
  if (!/^\d+$/.test(eventId)) return null;
  let data;
  try {
    data = await getEventDetail({ event: eventId });
  } catch (error) {
    if (error instanceof DuvApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
  if (!data?.raceDetails?.EventID) return null;
  return { ...data, raceDetails: data.raceDetails, winnerList: (data.winnerList ?? []) as WinnerRow[] };
});

export type LoadedRace = NonNullable<Awaited<ReturnType<typeof loadRace>>>;

export function hasResults(results: string | null | undefined) {
  return ["C", "P", "S"].includes(results ?? "");
}

/** DUV pages results 400 at a time. */
const PAGE_SIZE = 400;
/** Up to 4 000 finishers on the page; bigger fields link to DUV's own list for the rest. */
export const MAX_PAGES = 10;

export interface RaceResults {
  header: EventResultsHeader | null;
  rows: EventResultRow[];
  /** DUV has more finishers than the page loaded. */
  truncated: boolean;
}

/**
 * Every finisher of a race (international age classes), fetching DUV's
 * 400-row pages in parallel after the first. Empty when DUV has none.
 */
export const loadRaceResults = cache(async (eventId: string): Promise<RaceResults> => {
  const page = (n: number) =>
    getEventResults({ event: eventId, aktype: 2, perpage: PAGE_SIZE, page: n }).catch((error) => {
      if (error instanceof DuvApiError && (error.status === 404 || error.status === 400)) return null;
      throw error;
    });
  const first = await page(1);
  if (!first?.EvtHeader) return { header: null, rows: [], truncated: false };
  const maxPage = Number(first.Pagination?.MaxPage) || 1;
  const last = Math.min(maxPage, MAX_PAGES);
  const rest = await Promise.all(Array.from({ length: Math.max(0, last - 1) }, (_, i) => page(i + 2)));
  const rows = [first, ...rest].flatMap((p) => p?.Resultlist ?? []);
  return { header: first.EvtHeader, rows, truncated: maxPage > MAX_PAGES };
});
