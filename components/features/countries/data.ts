import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";
import { DuvApiError, getCalendar, getEventDetail, getIntBestList, getTopRankAbroad } from "@/lib/duv";
import type { CalendarRace, RankingEntry, TopRankAbroadRow } from "@/lib/duv/types";
import { continentOf, type Continent } from "./continents";

export interface CountryOption {
  value: string;
  label: string;
}

export interface Country {
  code: string;
  name: string;
  continent: Continent;
}

/** DUV's country filter lists (calendar and rankings): IOC code and English name. */
function zipCountries(values: (string | number)[] | undefined, labels: string[] | undefined): CountryOption[] {
  return (values ?? []).flatMap((value, i) => {
    const code = String(value);
    // The rankings list starts with "World", continents (1..6) and a "---" separator.
    return /^[A-Z]{3}$/.test(code) ? [{ value: code, label: labels?.[i] ?? code }] : [];
  });
}

/**
 * Every country DUV knows: those that host races (calendar filter) and those
 * whose runners are ranked (rankings filter). Cached for a day.
 */
export const getCountryOptions = cache(async (): Promise<CountryOption[]> => {
  const [calendar, rankings] = await Promise.all([
    getCalendar({ perpage: 1 }, { revalidate: 86400 }).catch((error: unknown) => {
      console.error("[countries] calendar country list failed", error);
      return null;
    }),
    getIntBestList({ perpage: 1 }, { revalidate: 86400 }).catch((error: unknown) => {
      console.error("[countries] rankings country list failed", error);
      return null;
    }),
  ]);
  const byCode = new Map<string, CountryOption>();
  for (const c of [
    ...zipCountries(calendar?.FltCountryValues, calendar?.FltCountryLabels),
    ...zipCountries(rankings?.FltCountryValues, rankings?.FltCountryLabels),
  ]) {
    if (!byCode.has(c.value)) byCode.set(c.value, c);
  }
  return Array.from(byCode.values()).sort((a, b) => a.label.localeCompare(b.label, "en"));
});

/** Returns the upper-case country code from a route param, or 404s. */
export function parseNat(nat: string) {
  if (!/^[a-z]{3}$/i.test(nat)) notFound();
  return nat.toUpperCase();
}

/**
 * The country for a route param. 404 for a code DUV does not list; when the
 * list itself could not be loaded, a well-formed code is let through by code.
 */
export const getCountry = cache(async (param: string): Promise<Country> => {
  const code = parseNat(param);
  const countries = await getCountryOptions();
  const found = countries.find((c) => c.value === code);
  if (!found && countries.length > 0) notFound();
  return { code, name: found?.label ?? code, continent: continentOf(code) };
});

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Zips DUV `Flt*Value`/`Flt*Label` arrays. Empty values (shown as
 * "----------" by DUV) become separators.
 */
export function zipOptions(
  values: (string | number)[] | undefined,
  labels: string[] | undefined,
  fallback: SelectOption[],
): SelectOption[] {
  if (!values?.length) return fallback;
  return values.map((value, i) => ({
    value: String(value),
    label: labels?.[i] ?? String(value),
  }));
}

// ---- the country page's year summary ------------------------------------

/** First year the year selector offers. */
export const FIRST_YEAR = 1990;

/** `?year=` within FIRST_YEAR..this year, else this year. */
export function parseYear(raw: string | string[] | undefined, now = new Date()): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  const current = now.getFullYear();
  return Number.isInteger(value) && value >= FIRST_YEAR && value <= current ? value : current;
}

/** Standard distances the rankings cover, in the order they are offered. */
export const BEST_DISTANCES = ["100km", "24h", "50km", "100mi", "6h", "12h", "50mi", "48h"] as const;
export type BestDistance = (typeof BEST_DISTANCES)[number];

const BEST_PER_PAGE = 100;

export interface GenderList {
  top: RankingEntry[];
  /** Results on the list; `more` when the list runs past one page of 100. */
  count: number;
  more: boolean;
}

export interface DistanceBest {
  dist: BestDistance;
  women: GenderList;
  men: GenderList;
  total: number;
}

/**
 * DUV answers an empty list with 404, and an empty calendar (a country with
 * no races that year, seen for FIJ) with a body that is not JSON.
 */
function isEmptyAnswer(error: unknown) {
  if (!(error instanceof DuvApiError)) return false;
  return error.status === 404 || (error.endpoint === "mcalendar.php" && /invalid JSON/.test(error.message));
}

const EMPTY_LIST: GenderList = { top: [], count: 0, more: false };

/** One national list; null when DUV failed. DUV answers 404 for an empty list. */
async function bestList(nat: string, year: number, dist: BestDistance, gender: "W" | "M"): Promise<GenderList | null> {
  try {
    const data = await getIntBestList({ nat, year, dist, gender, perpage: BEST_PER_PAGE, plain: true });
    const list = data?.RankingList ?? [];
    // The list holds every result; the top three are three different runners.
    const seen = new Set<string>();
    const top = list.filter((e) => !seen.has(e.PersonID) && seen.add(e.PersonID)).slice(0, 3);
    return { top, count: list.length, more: (data?.Pagination?.MaxPage ?? 1) > 1 };
  } catch (error) {
    if (isEmptyAnswer(error)) return EMPTY_LIST;
    console.error(`[countries] best list ${nat} ${year} ${dist} ${gender} failed`, error);
    return null;
  }
}

/**
 * Best women and men of a country per standard distance in a year; distances
 * with nobody left out. Null only when every list failed.
 */
export async function loadBestRunners(nat: string, year: number): Promise<DistanceBest[] | null> {
  const lists = await Promise.all(
    BEST_DISTANCES.map(async (dist) => {
      const [women, men] = await Promise.all([bestList(nat, year, dist, "W"), bestList(nat, year, dist, "M")]);
      return { dist, women, men };
    })
  );
  if (lists.every((d) => d.women === null && d.men === null)) return null;
  return lists
    .map(({ dist, women, men }) => {
      const w = women ?? EMPTY_LIST;
      const m = men ?? EMPTY_LIST;
      return { dist, women: w, men: m, total: w.count + m.count };
    })
    .filter((d) => d.total > 0);
}

/** Top-3 places (within gender) of a country's runners in races abroad, newest first. */
export async function loadPodiumsAbroad(
  nat: string,
  year: number,
  filters: { dist?: string; gender?: "all" | "M" | "W" } = {}
): Promise<TopRankAbroadRow[] | null> {
  try {
    const data = await getTopRankAbroad({
      country: nat,
      year,
      cnt: 3,
      dist: filters.dist || "all",
      gender: filters.gender ?? "all",
    });
    return (data?.Resultlist ?? [])
      .filter((r) => {
        const rank = Number(r.RankMW);
        return rank >= 1 && rank <= 3;
      })
      .sort((a, b) => (b.Date ?? "").localeCompare(a.Date ?? ""));
  } catch (error) {
    if (isEmptyAnswer(error)) return [];
    console.error(`[countries] podiums abroad ${nat} ${year} failed`, error);
    return null;
  }
}

/** Calendar rows may carry the climb (trail races); not in the shared type yet. */
export type CountryRace = CalendarRace & { AltitudeDiff?: string | null };

const RACES_PER_PAGE = 400;
const MAX_RACE_PAGES = 5;

/** Every race in a country in a year (DUV pages through 400 at a time). */
export async function loadRacesInYear(nat: string, year: number): Promise<CountryRace[] | null> {
  try {
    const base = {
      country: nat,
      from: `${year}-01-01`,
      to: `${year}-12-31`,
      order: "asc" as const,
      perpage: RACES_PER_PAGE,
      plain: true,
      // Stages and splits are not races of their own.
      splits: true,
    };
    const first = await getCalendar({ ...base, page: 1 }, { revalidate: 3600 });
    const pages = Math.min(first?.Pagination?.MaxPage ?? 1, MAX_RACE_PAGES);
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
        getCalendar({ ...base, page: i + 2 }, { revalidate: 3600 })
      )
    );
    const races = [first, ...rest].flatMap((d) => d?.Races ?? []) as CountryRace[];
    // Only races that start in the year.
    return races.filter((r) => (r.Startdate ?? "").startsWith(String(year)));
  } catch (error) {
    if (isEmptyAnswer(error)) return [];
    console.error(`[countries] races ${nat} ${year} failed`, error);
    return null;
  }
}

/** The next races in a country from today on. */
export async function loadUpcomingRaces(nat: string): Promise<CountryRace[] | null> {
  try {
    const data = await getCalendar({ country: nat, year: "futur", order: "asc", perpage: 80, plain: true, splits: true });
    return (data?.Races ?? []) as CountryRace[];
  } catch (error) {
    if (isEmptyAnswer(error)) return [];
    console.error(`[countries] upcoming races ${nat} failed`, error);
    return null;
  }
}

/**
 * The calendar sends no climb, so trail races among the next ones get it from
 * their event details (cached an hour). Others are returned as they are.
 */
export async function withClimb(races: CountryRace[]): Promise<CountryRace[]> {
  return Promise.all(
    races.map(async (race) => {
      if (race.AltitudeDiff || race.EventType !== "2") return race;
      try {
        const detail = await getEventDetail({ event: race.EventID });
        const climb = detail?.raceDetails?.AltitudeDiff;
        return climb ? { ...race, AltitudeDiff: climb } : race;
      } catch {
        return race;
      }
    })
  );
}
