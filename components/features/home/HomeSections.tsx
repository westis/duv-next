import type { ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Tag } from "@/components/design";
import {
  calendarHref,
  parseCalendarParams,
} from "@/components/features/calendar/params";
import {
  formatOf,
  type CalendarRow,
} from "@/components/features/calendar/races";
import { searchHref } from "@/components/features/search/params";
import {
  COURSE_SEPARATOR,
  formatCount,
  formatDate,
  formatDateRange,
  formatLengthAndClimb,
  formatPerformanceText,
  formatRunnerName,
  formatWeekday,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BestList, RecentResults, ThisWeek } from "./load";

const inkLink = "text-fg no-underline hover:text-link hover:underline";

/** The page's headline: one large search field that opens /search. */
export function HomeSearch() {
  const t = useTranslations("home.search");
  const examples = ["Pouc", "Spartathlon", "Comrades"];
  return (
    <section className="border-b border-border bg-surface">
      <div className="container py-6 md:py-9">
        <form action="/search" method="get" role="search" className="max-w-3xl">
          <label
            htmlFor="home-search"
            className="mb-2.5 block font-serif text-[1.375rem] leading-tight font-semibold md:text-[1.75rem]"
          >
            {t("heading")}
          </label>
          <div className="flex h-14 items-center gap-3 border-2 border-fg bg-bg px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand">
            <Search
              aria-hidden
              strokeWidth={1.75}
              className="size-5 shrink-0 text-fg-muted"
            />
            <input
              id="home-search"
              name="sname"
              type="search"
              required
              minLength={2}
              autoComplete="off"
              enterKeyHint="search"
              placeholder={t("placeholder")}
              className="h-full min-w-0 grow bg-transparent text-base text-fg outline-none placeholder:text-fg-muted md:text-lg"
            />
            <button
              type="submit"
              className="h-10 shrink-0 bg-fg px-4 text-sm font-semibold text-bg"
            >
              {t("submit")}
            </button>
          </div>
        </form>
        <p className="mt-2.5 flex flex-wrap items-center gap-x-4 text-sm text-fg-muted">
          {t("try")}
          {examples.map((q) => (
            <Link
              key={q}
              href={searchHref({ sname: q })}
              className="inline-flex min-h-11 items-center font-medium md:min-h-9"
            >
              {q}
            </Link>
          ))}
        </p>
      </div>
    </section>
  );
}

/** A column heading: small capitals over an ink rule, with a link to the full list. */
function ColumnHeading({
  id,
  children,
  href,
  link,
}: {
  id: string;
  children: ReactNode;
  href: string;
  link: string;
}) {
  return (
    <h2
      id={id}
      className="flex items-baseline justify-between gap-3 border-b-2 border-fg pb-1.5"
    >
      <span className="label-caps text-[0.8125rem] text-fg">{children}</span>
      <Link href={href} className="text-sm font-normal">
        {link}
      </Link>
    </h2>
  );
}

function FormatText({ text }: { text: string }) {
  const [length, climb] = text.split(COURSE_SEPARATOR);
  return (
    <>
      {length}
      {climb && (
        <span className="block text-xs font-medium text-fg-muted">{climb}</span>
      )}
    </>
  );
}

export function ResultsJustIn({ data }: { data: RecentResults }) {
  const t = useTranslations("home.results");
  const tTags = useTranslations("tags");
  const locale = useLocale();
  if (!data.withWinners.length && !data.more.length) return null;
  const allHref = calendarHref({
    ...parseCalendarParams({}),
    from: data.from,
    to: data.to,
    order: "desc",
  });
  return (
    <section aria-labelledby="home-results">
      <ColumnHeading id="home-results" href={allHref} link={t("all")}>
        {t("title")}
      </ColumnHeading>
      <ul>
        {data.withWinners.map(({ race, length, climb, finishers, winners }) => {
          const backyard = race.EventType === "10";
          const format = backyard
            ? tTags("type.backyard")
            : formatLengthAndClimb(
                { length, climb: race.EventType === "2" ? climb : null },
                locale,
              );
          const meta = [
            formatDateRange(race.Startdate, locale, race.Enddate)?.text,
            [race.City?.trim(), race.Country].filter(Boolean).join(", "),
            format,
            finishers !== null ? t("finishers", { count: finishers }) : null,
          ].filter(Boolean);
          return (
            <li key={race.EventID} className="border-b border-hair py-2.5">
              <Link
                href={`/events/${race.EventID}`}
                className={cn(inkLink, "text-[0.9375rem] font-semibold")}
              >
                {race.EventName.trim()}
              </Link>
              <p className="mt-0.5 mb-1.5 text-xs text-fg-muted tabular">
                {meta.join(" · ")}
              </p>
              {winners.length > 0 && (
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    {t("winnersOf", { race: race.EventName.trim() })}
                  </caption>
                  <tbody>
                    {winners.map(({ gender, row }) => (
                      <tr key={gender} className="align-baseline">
                        <td className="w-24 pe-2.5 text-end font-semibold whitespace-nowrap tabular">
                          {formatPerformanceText(row.Performance, locale)}
                        </td>
                        <th scope="row" className="pe-2 text-start font-normal">
                          <abbr
                            title={t(`gender.${gender}`)}
                            className="label-caps me-1.5 inline-block w-3.5 text-fg-muted no-underline"
                          >
                            {t(`genderShort.${gender}`)}
                          </abbr>
                          <Link
                            href={`/runners/${row.PersonID}`}
                            className={inkLink}
                          >
                            {formatRunnerName(
                              { first: row.FirstName, last: row.LastName },
                              locale,
                            )}
                          </Link>
                        </th>
                        <td className="label-caps w-10 text-end text-fg-muted">
                          {row.Nationality}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </li>
          );
        })}
        {data.more.map((race) => (
          <li
            key={race.EventID}
            className="flex items-baseline justify-between gap-3 border-b border-hair py-2 text-sm"
          >
            <Link
              href={`/events/${race.EventID}/results`}
              className={cn(inkLink, "min-w-0")}
            >
              {race.EventName.trim()}
            </Link>
            <span className="shrink-0 text-xs text-fg-muted tabular">
              {formatDate(race.Startdate, locale)?.text} ·{" "}
              <span className="label-caps">{race.Country}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WeekRow({ row, aside }: { row: CalendarRow; aside?: ReactNode }) {
  const tTags = useTranslations("tags");
  const f = row.formats[0];
  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)_2.25rem] gap-2.5 border-b border-hair py-1.5 text-sm">
      <span className="text-end font-semibold tabular">
        {f.backyard ? (
          <span className="text-fg-muted">{tTags("type.backyard")}</span>
        ) : (
          <FormatText text={f.text} />
        )}
        {row.formats.length > 1 && (
          <span className="block text-xs font-medium text-fg-muted">
            +{row.formats.length - 1}
          </span>
        )}
      </span>
      <span className="min-w-0">
        <Link href={`/events/${row.eventId}`} className={inkLink}>
          {row.name}
        </Link>
        {row.iau && (
          <>
            {" "}
            <Tag family="iau" className="align-baseline">
              {tTags(`iau.${row.iau}`)}
            </Tag>
          </>
        )}
        {aside}
      </span>
      <span className="label-caps text-end text-fg-muted">{row.country}</span>
    </li>
  );
}

export function ThisWeekColumn({ data }: { data: ThisWeek }) {
  const t = useTranslations("home.week");
  const tRun = useTranslations("calendar.running");
  const locale = useLocale();
  if (!data.days.length && !data.running.length) return null;
  const weekHref = calendarHref({
    ...parseCalendarParams({}),
    from: data.from,
    to: data.to,
  });
  const dayHead = "label-caps mt-3.5 mb-0.5 text-fg-muted";
  return (
    <section aria-labelledby="home-week">
      <ColumnHeading id="home-week" href="/events" link={t("calendar")}>
        {t("title")}
      </ColumnHeading>
      {data.running.length > 0 && (
        <>
          <h3 className={dayHead}>{t("runningNow")}</h3>
          <ul>
            {data.running.map(({ row, state }) => (
              <WeekRow
                key={row.key}
                row={row}
                aside={
                  <span className="text-xs text-fg-muted tabular">
                    {" · "}
                    {state.day >= state.total
                      ? tRun("lastDay")
                      : tRun("dayOf", { day: state.day, total: state.total })}
                  </span>
                }
              />
            ))}
          </ul>
        </>
      )}
      {data.days.map((day) => (
        <div key={day.date}>
          <h3 className={dayHead}>
            <time dateTime={day.date}>
              {formatWeekday(day.date, locale)?.text}{" "}
              {formatDate(day.date, locale)?.text}
            </time>
          </h3>
          <ul>
            {day.rows.map((row) => (
              <WeekRow key={row.key} row={row} />
            ))}
          </ul>
        </div>
      ))}
      <p className="mt-2 text-sm">
        <Link
          href={weekHref}
          className="inline-flex min-h-11 items-center md:min-h-9"
        >
          {t("all", {
            count: formatCount(data.total, locale) ?? String(data.total),
          })}
        </Link>
      </p>
    </section>
  );
}

export function BestOfYear({
  lists,
  year,
}: {
  lists: BestList[];
  year: string;
}) {
  const t = useTranslations("home.best");
  const locale = useLocale();
  if (!lists.length) return null;
  return (
    <section aria-labelledby="home-best">
      <ColumnHeading id="home-best" href="/rankings" link={t("rankings")}>
        {t("title", { year })}
      </ColumnHeading>
      {lists.map((list) => {
        const id = `best-${list.dist}-${list.gender}`;
        const isTime = /h$/.test(list.dist);
        return (
          <div key={id} className="mt-3">
            <h3
              id={id}
              className="mb-0.5 flex items-baseline justify-between text-[0.8125rem] font-semibold"
            >
              <Link
                href={`/rankings?year=${year}&dist=${list.dist}&gender=${list.gender}`}
                className={inkLink}
              >
                {formatOf(
                  {
                    EventType: "1",
                    Length: isTime ? "" : list.dist,
                    Duration: isTime ? list.dist : "",
                  },
                  locale,
                )}
              </Link>
              <span className="text-xs font-normal text-fg-muted">
                {t(`gender.${list.gender}`)}
              </span>
            </h3>
            <table aria-labelledby={id} className="w-full text-sm">
              <thead className="sr-only">
                <tr>
                  <th scope="col">{t("rank")}</th>
                  <th scope="col">{t("performance")}</th>
                  <th scope="col">{t("runner")}</th>
                  <th scope="col">{t("nation")}</th>
                </tr>
              </thead>
              <tbody>
                {list.entries.map((e) => (
                  <tr
                    key={e.PerfID}
                    className="border-b border-hair align-baseline"
                  >
                    <td className="w-5 py-1 text-xs text-fg-muted tabular">
                      {e.Rank}
                    </td>
                    <td className="w-24 py-1 pe-2.5 text-end font-semibold whitespace-nowrap tabular">
                      {formatPerformanceText(e.Perf, locale)}
                    </td>
                    <td className="py-1 pe-2">
                      <Link href={`/runners/${e.PersonID}`} className={inkLink}>
                        {formatRunnerName(
                          { first: e.FirstName, last: e.LastName },
                          locale,
                        )}
                      </Link>
                    </td>
                    <td className="label-caps w-10 py-1 text-end text-fg-muted">
                      {e.Nationality}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      <p className="mt-4 text-xs text-fg-muted">{t("trailNote")}</p>
    </section>
  );
}
