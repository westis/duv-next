import { cache } from "react";
import { DuvApiError, getEventDetail } from "@/lib/duv";

/**
 * The race behind every tab of /events/[eventId]. Cached per request, so the
 * layout, the tab pages and their metadata share one DUV call.
 * Returns null for ids DUV doesn't know (it answers 400 for those).
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
  return data?.raceDetails?.EventID ? { ...data, raceDetails: data.raceDetails } : null;
});

export type LoadedRace = NonNullable<Awaited<ReturnType<typeof loadRace>>>;

export function hasResults(results: string | null | undefined) {
  return ["C", "P", "S"].includes(results ?? "");
}
