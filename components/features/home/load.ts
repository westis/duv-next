import "server-only";

import { getCalendar, getEventResults } from "@/lib/duv";
import { loadRanking } from "@/components/features/rankings/load";
import type {
  CalendarRace,
  EventResultRow,
  RankingEntry,
} from "@/lib/duv/types";
import {
  loadClimbs,
  loadRunningNow,
} from "@/components/features/calendar/load";
import {
  parseCalendarParams,
  shiftDays,
} from "@/components/features/calendar/params";
import {
  type CalendarRow,
  groupRows,
  isoDay,
  runningState,
  type RunningState,
} from "@/components/features/calendar/races";

function lastDay(race: CalendarRace): string {
  return isoDay(race.Enddate) ?? race.Startdate;
}

/** Races with results in the last two weeks: the first few with their winners. */
const RESULT_WINDOW_DAYS = 14;
const WITH_WINNERS = 4;
const PLAIN_RESULTS = 4;
/** Rows in "This week"; the rest are a link to the calendar. */
const WEEK_ROWS = 12;

export interface Winner {
  gender: "M" | "W";
  row: EventResultRow;
}

export interface ResultItem {
  race: CalendarRace;
  /** "117km" or "24h" from the results header; the calendar's own when missing. */
  length: string;
  climb: string | null;
  finishers: number | null;
  winners: Winner[];
}

async function winnersOf(
  race: CalendarRace,
): Promise<Omit<ResultItem, "race"> | null> {
  const [men, women] = await Promise.all(
    (["M", "W"] as const).map((cat) =>
      getEventResults(
        { event: race.EventID, cat, perpage: 1, plain: true },
        { revalidate: 3600 },
      ).catch(() => null),
    ),
  );
  const header = men?.EvtHeader ?? women?.EvtHeader;
  const winners: Winner[] = [];
  const m = men?.Resultlist?.[0];
  const w = women?.Resultlist?.[0];
  // Women first (the site never shows men first).
  if (w) winners.push({ gender: "W", row: w });
  if (m) winners.push({ gender: "M", row: m });
  if (!header && !winners.length) return null;
  const finishers = Number.parseInt(header?.FinisherCnt ?? "", 10);
  return {
    length: (header?.EvtDist || race.Length || race.Duration || "").trim(),
    climb: header?.AltitudeDiff?.trim() || null,
    finishers: Number.isFinite(finishers) ? finishers : null,
    winners,
  };
}

export interface RecentResults {
  withWinners: ResultItem[];
  more: CalendarRace[];
  from: string;
  to: string;
}

export async function loadRecentResults(
  today: string,
): Promise<RecentResults | null> {
  const from = shiftDays(today, -RESULT_WINDOW_DAYS);
  try {
    const data = await getCalendar(
      { plain: true, from, to: today, order: "desc", perpage: 400 },
      { revalidate: 1800 },
    );
    const done = (data?.Races ?? [])
      .filter((r) => (r.Results ?? "").trim().toUpperCase() === "C")
      .sort(
        (a, b) =>
          lastDay(b).localeCompare(lastDay(a)) ||
          b.Startdate.localeCompare(a.Startdate),
      );
    const head = done.slice(0, WITH_WINNERS);
    const withWinners = (
      await Promise.all(
        head.map(async (race) => {
          const w = await winnersOf(race);
          return w ? { race, ...w } : null;
        }),
      )
    ).filter((x): x is ResultItem => x !== null);
    return {
      withWinners,
      more: done.slice(WITH_WINNERS, WITH_WINNERS + PLAIN_RESULTS),
      from,
      to: today,
    };
  } catch (error) {
    console.error("Recent results unavailable:", error);
    return null;
  }
}

export interface WeekDay {
  date: string;
  rows: CalendarRow[];
}

export interface ThisWeek {
  running: { row: CalendarRow; state: RunningState }[];
  days: WeekDay[];
  total: number;
  from: string;
  to: string;
}

export async function loadThisWeek(
  today: string,
  locale: string,
): Promise<ThisWeek | null> {
  const to = shiftDays(today, 6);
  try {
    const [data, running] = await Promise.all([
      getCalendar(
        { plain: true, from: today, to, order: "asc", perpage: 400 },
        { revalidate: 1800 },
      ),
      loadRunningNow(parseCalendarParams({}), today),
    ]);
    const races = data?.Races ?? [];
    const all = groupRows(races, locale);
    // A short pick: IAU label races first, then the rest in date order.
    const picked = new Set(
      [...all]
        .map((row, i) => ({ row, i }))
        .sort((a, b) => Number(!a.row.iau) - Number(!b.row.iau) || a.i - b.i)
        .slice(0, WEEK_ROWS)
        .map(({ row }) => row.key),
    );
    const pickedRaces = races.filter((r) =>
      all.some(
        (row) =>
          picked.has(row.key) &&
          row.formats.some((f) => f.eventId === r.EventID),
      ),
    );
    const climbs = await loadClimbs(pickedRaces);
    const rows = groupRows(pickedRaces, locale, climbs);
    const days: WeekDay[] = [];
    for (const row of rows) {
      const date = row.startdate.slice(0, 10);
      const last = days[days.length - 1];
      if (last?.date === date) last.rows.push(row);
      else days.push({ date, rows: [row] });
    }
    const runningRows = running
      .flatMap((race) => groupRows([race], locale))
      .flatMap((row) => {
        const state = runningState(
          { Startdate: row.startdate, Enddate: row.enddate },
          today,
        );
        return state ? [{ row, state }] : [];
      });
    return {
      running: runningRows.slice(0, 3),
      days,
      total: data?.HitCnt ?? races.length,
      from: today,
      to,
    };
  } catch (error) {
    console.error("This week unavailable:", error);
    return null;
  }
}

export interface BestList {
  dist: string;
  gender: "M" | "W";
  entries: RankingEntry[];
}

/** The year lists shown on the home page: 100 km and 24 h, women and men. */
const BEST_LISTS: { dist: string; gender: "M" | "W" }[] = [
  { dist: "100km", gender: "W" },
  { dist: "100km", gender: "M" },
  { dist: "24h", gender: "W" },
  { dist: "24h", gender: "M" },
];

/**
 * The year's top three from DUV's rankings, women first. They load like the
 * rankings page (`loadRanking`), which rebuilds a list from its age groups when
 * DUV's server fails on it (2026 100 km women). A distance is shown only with
 * its women's list: never the men's list alone.
 */
export async function loadBestOfYear(year: string): Promise<BestList[]> {
  const lists = await Promise.all(
    BEST_LISTS.map(async ({ dist, gender }) => {
      try {
        const ranking = await loadRanking({
          year,
          dist,
          gender,
          cat: "all",
          nat: "all",
          iau: false,
          net: false,
          view: "all",
          page: 1,
        });
        const entries = ranking.entries.slice(0, 3);
        return entries.length ? { dist, gender, entries } : null;
      } catch {
        return null;
      }
    }),
  );
  const found = lists.filter((l): l is BestList => l !== null);
  // DUV has answered a women's list with the men's one when it ignored the gender: such a copy is no women's list.
  const key = (l: BestList) => `${l.dist}|${l.entries.map((e) => e.PerfID).join(",")}`;
  const women = found.filter(
    (l) => l.gender === "W" && !found.some((m) => m.gender === "M" && key(m) === key(l)),
  );
  const withWomen = new Set(women.map((l) => l.dist));
  return found.filter((l) => withWomen.has(l.dist) && (l.gender === "M" || women.includes(l)));
}
