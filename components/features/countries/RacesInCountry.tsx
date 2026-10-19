import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState, FilterLinks } from "@/components/design";
import {
  cleanDuv,
  formatCount,
  formatDate,
  formatDayMonth,
  formatClimb,
  formatCourseLength,
  formatMonthShort,
} from "@/lib/format";
import { raceTypeOf, type TagMessageKey } from "@/lib/tags";
import { cn } from "@/lib/utils";
import type { CountryRace } from "./data";

export const SURFACES = ["road", "trail", "track", "indoor"] as const;
export type Surface = (typeof SURFACES)[number];

/** `?surface=` as one of the surfaces, else undefined (all races). */
export function parseSurface(
  raw: string | string[] | undefined,
): Surface | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return SURFACES.find((s) => s === value);
}

/** DUV calendar `dist` values for a surface, for the calendar link. */
const CALENDAR_DIST: Record<Surface, string> = {
  road: "Road",
  trail: "Trail",
  track: "Track",
  indoor: "Indoo",
};

function surfaceOf(race: CountryRace): Surface | undefined {
  return raceTypeOf(race.EventType)?.surface;
}

/** The race's kind as a `tags.type.*` key: fixed distance or time, backyard, stage race... */
function typeKey(race: CountryRace): TagMessageKey | null {
  const type = raceTypeOf(race.EventType);
  if (!type) return null;
  if (type.kind === "regular") {
    if (cleanDuv(race.Duration) && !cleanDuv(race.Length))
      return "type.fixedTime";
    return cleanDuv(race.Length) ? "type.fixedDistance" : null;
  }
  const kinds: Record<string, TagMessageKey> = {
    stageRace: "type.stageRace",
    invitational: "type.invitational",
    elimination: "type.elimination",
    backyard: "type.backyard",
    walking: "type.walking",
  };
  return kinds[type.kind] ?? null;
}

function monthOf(race: CountryRace): number {
  return Number(race.Month) || Number((race.Startdate ?? "").slice(5, 7));
}

function hasResults(race: CountryRace) {
  const r = cleanDuv(race.Results).toUpperCase();
  return r === "C" || r === "P";
}

interface RacesInCountryProps {
  nat: string;
  countryName: string;
  year: number;
  races: CountryRace[];
  /** From today on; only shown for the current year. */
  upcoming: CountryRace[] | null;
  surface?: Surface;
  now?: Date;
}

/**
 * Races in a country in a year: a surface filter (trail included), a month
 * histogram (months still ahead hatched), the mix of race kinds, and the next
 * races with their length and, for trail, the climb ("53 km" over "2 100 m+").
 */
export async function RacesInCountry({
  nat,
  countryName,
  year,
  races,
  upcoming,
  surface,
  now = new Date(),
}: RacesInCountryProps) {
  const t = await getTranslations("countries.page.races");
  const tt = await getTranslations("tags");
  const locale = await getLocale();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const bySurface = new Map<Surface, number>();
  for (const race of races) {
    const s = surfaceOf(race);
    if (s) bySurface.set(s, (bySurface.get(s) ?? 0) + 1);
  }
  const filtered = surface
    ? races.filter((r) => surfaceOf(r) === surface)
    : races;

  const base = `/countries/${nat}${year !== currentYear ? `?year=${year}` : ""}`;
  const withSurface = (s?: Surface) => {
    const sep = base.includes("?") ? "&" : "?";
    return `${s ? `${base}${sep}surface=${s}` : base}#races`;
  };
  const filterItems = [
    {
      href: withSurface(),
      label: t("all"),
      count: formatCount(races.length, locale) ?? undefined,
      current: !surface,
    },
    ...SURFACES.filter((s) => (bySurface.get(s) ?? 0) > 0 || s === surface).map(
      (s) => ({
        href: withSurface(s),
        label: tt(`surface.${s}`),
        count: formatCount(bySurface.get(s) ?? 0, locale) ?? undefined,
        current: surface === s,
      }),
    ),
  ];

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const perMonth = months.map(
    (m) => filtered.filter((r) => monthOf(r) === m).length,
  );
  const max = Math.max(1, ...perMonth);
  const stateOf = (m: number) =>
    year > currentYear || (year === currentYear && m > currentMonth)
      ? "ahead"
      : year === currentYear && m === currentMonth
        ? "now"
        : "past";
  const anyAhead = months.some((m) => stateOf(m) === "ahead");

  const kinds = new Map<TagMessageKey, number>();
  for (const race of filtered) {
    const key = typeKey(race);
    if (key) kinds.set(key, (kinds.get(key) ?? 0) + 1);
  }
  const kindList = Array.from(kinds.entries()).sort((a, b) => b[1] - a[1]);

  const next =
    year === currentYear && upcoming
      ? upcoming.filter((r) => !surface || surfaceOf(r) === surface).slice(0, 8)
      : null;
  const calendarHref = `/events?country=${nat}${surface ? `&dist=${CALENDAR_DIST[surface]}` : ""}`;

  return (
    <>
      {filtered.length > 0 && (
        <p className="mt-1 mb-3 text-sm text-fg-muted md:text-[0.9375rem]">
          {t("deck", {
            count: filtered.length,
            year,
            results:
              formatCount(filtered.filter(hasResults).length, locale) ?? "0",
          })}
          {anyAhead && <> {t("ahead")}</>}
        </p>
      )}
      {races.length > 0 && (
        <FilterLinks
          items={filterItems}
          label={t("surface")}
          className="mb-3"
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState>
          {races.length === 0
            ? t("empty", { country: countryName, year })
            : t("emptyFiltered", { country: countryName, year })}
        </EmptyState>
      ) : (
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <figure className="min-w-0">
            <figcaption className="sr-only">
              {t("byMonth", { year })}
            </figcaption>
            <ol className="grid h-28 grid-cols-12 items-end gap-1 pt-4">
              {months.map((m, i) => {
                const count = perMonth[i];
                const state = stateOf(m);
                const name = formatMonthShort(m, locale) ?? String(m);
                return (
                  <li
                    key={m}
                    className="relative flex h-full flex-col justify-end"
                  >
                    <span className="sr-only">
                      {t("monthBar", { month: name, count })}
                    </span>
                    <span
                      aria-hidden
                      className="text-center text-[0.6875rem] leading-4 font-semibold tabular"
                    >
                      {count > 0 ? count : ""}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "block rounded-t-[1px]",
                        state === "past" && "bg-fg",
                        state === "now" && "bg-brand",
                        state === "ahead" &&
                          "border border-border bg-[repeating-linear-gradient(135deg,var(--border)_0_3px,transparent_3px_6px)]",
                      )}
                      style={{
                        height: `${Math.max(count > 0 ? 3 : 1, (count / max) * 100)}%`,
                      }}
                    />
                  </li>
                );
              })}
            </ol>
            <div
              aria-hidden
              className="mt-1 grid grid-cols-12 gap-1 text-center text-[0.6875rem] font-semibold text-fg-muted"
            >
              {months.map((m) => {
                const name = formatMonthShort(m, locale) ?? String(m);
                return (
                  <span key={m}>
                    {/* Three letters do not fit twelve columns on a phone. */}
                    <span className="sm:hidden">{Array.from(name)[0]}</span>
                    <span className="hidden sm:inline">{name}</span>
                  </span>
                );
              })}
            </div>
            {kindList.length > 0 && (
              <p className="mt-3 text-sm">
                {kindList.map(([key, count], i) => (
                  <span key={key}>
                    {i > 0 && (
                      <span aria-hidden className="text-fg-muted">
                        {" "}
                        ·{" "}
                      </span>
                    )}
                    <b className="font-semibold tabular">
                      {formatCount(count, locale)}
                    </b>{" "}
                    {tt(key).toLocaleLowerCase(locale)}
                  </span>
                ))}
              </p>
            )}
          </figure>

          {next && (
            <div className="min-w-0">
              <h3 id="next-up" className="label-caps mb-1 text-fg-muted">
                {t("nextUp")}
              </h3>
              {next.length === 0 ? (
                <p className="border-t border-hair py-3 text-sm text-fg-muted">
                  {t("noUpcoming")}
                </p>
              ) : (
                <table
                  aria-labelledby="next-up"
                  className="w-full border-collapse text-sm"
                >
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">{t("date")}</th>
                      <th scope="col">{t("course")}</th>
                      <th scope="col">{t("race")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {next.map((race) => {
                      const start = race.Startdate ?? "";
                      const date =
                        start.slice(0, 4) === String(currentYear)
                          ? formatDayMonth(start, locale)
                          : formatDate(start, locale);
                      const length = formatCourseLength(
                        race.Length || race.Duration,
                        locale,
                      );
                      const climb = formatClimb(race.AltitudeDiff, locale);
                      const kind = typeKey(race);
                      const s = surfaceOf(race);
                      return (
                        <tr
                          key={race.EventID}
                          className="border-b border-hair align-baseline"
                        >
                          <td className="py-1.5 pe-3 whitespace-nowrap text-fg-muted tabular">
                            {date && (
                              <time dateTime={date.dateTime}>{date.text}</time>
                            )}
                          </td>
                          <td className="py-1.5 pe-3 tabular">
                            <span className="block font-semibold whitespace-nowrap">
                              {length || (kind ? tt(kind) : "")}
                            </span>
                            {climb && (
                              <span className="block text-xs whitespace-nowrap text-fg-muted">
                                {climb}
                              </span>
                            )}
                          </td>
                          <td className="py-1.5">
                            <Link
                              href={`/events/${race.EventID}`}
                              className="text-fg"
                            >
                              {cleanDuv(race.EventName)}
                            </Link>
                            <span className="block text-xs text-fg-muted">
                              {[
                                cleanDuv(race.City),
                                s ? tt(`surface.${s}`) : kind ? tt(kind) : "",
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      <Link
        href={calendarHref}
        className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold"
      >
        {t("calendar", { country: countryName })}
        <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" />
      </Link>
    </>
  );
}
