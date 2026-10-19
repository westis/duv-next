import type { Messages } from "next-intl";
import { hasResults, type LoadedRace } from "./loadRace";

type TabKey = keyof Messages["race"]["tabs"];

/**
 * Tabs of the race page, in order. A tab shows only when it has data
 * (design spec, "Race page"). Each tab is its own route under
 * /events/[eventId]; a new tab adds its route folder and an entry here.
 */
const TABS: { key: Exclude<TabKey, "label">; segment: string; show: (race: LoadedRace) => boolean }[] = [
  { key: "overview", segment: "", show: () => true },
  { key: "results", segment: "results", show: (r) => hasResults(r.raceDetails.Results) },
  { key: "editions", segment: "editions", show: (r) => (r.winnerList?.length ?? 0) > 1 },
];

export function raceTabs(race: LoadedRace) {
  const base = `/events/${race.raceDetails.EventID}`;
  return TABS.filter((tab) => tab.show(race)).map((tab) => ({
    key: tab.key,
    href: tab.segment ? `${base}/${tab.segment}` : base,
  }));
}
