import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Tag } from "@/components/design";
import { COURSE_SEPARATOR, formatDayMonth, formatDate, formatWeekday, formatYear } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarRow, RowFormat } from "./races";

interface Day {
  date: string;
  rows: CalendarRow[];
  raceCount: number;
}

function byDay(rows: CalendarRow[]): Day[] {
  const days: Day[] = [];
  for (const row of rows) {
    const date = row.startdate.slice(0, 10);
    let day = days[days.length - 1];
    if (!day || day.date !== date) {
      day = { date, rows: [], raceCount: 0 };
      days.push(day);
    }
    day.rows.push(row);
    day.raceCount += row.formats.length;
  }
  return days;
}

const inkLink = "text-fg no-underline hover:text-link hover:underline";

/** "117 km · 6 500 m+" as length and climb parts; one part for every other format. */
function FormatText({ format, stacked = false }: { format: RowFormat; stacked?: boolean }) {
  const t = useTranslations("tags");
  if (format.backyard) return <span className="font-medium text-fg-muted">{t("type.backyard")}</span>;
  const [length, climb] = format.text.split(COURSE_SEPARATOR);
  if (!climb) return <>{length}</>;
  if (stacked) {
    return (
      <>
        {length}
        <span className="block text-xs font-medium text-fg-muted">{climb}</span>
      </>
    );
  }
  return (
    <>
      {length}
      <span className="font-medium text-fg-muted">
        {COURSE_SEPARATOR}
        {climb}
      </span>
    </>
  );
}

function ResultsMark({ row }: { row: CalendarRow }) {
  const t = useTranslations("tags");
  const done = row.formats.find((f) => f.hasResults);
  if (!done) return null;
  const partial = row.formats.every((f) => !f.hasResults || f.partial);
  return (
    <Link href={`/events/${done.eventId}/results`} className="inline-flex items-center gap-1.5 no-underline hover:underline">
      <span aria-hidden className={cn("size-1.5 rounded-full", partial ? "bg-warning" : "bg-success")} />
      {t(partial ? "status.P" : "status.C")}
    </Link>
  );
}

/**
 * The race calendar as a printed ledger: the date once in a left margin, then
 * one row per race that starts with what the race is (48 h, 100 mi, Backyard).
 * Distances of one race share a row, each linking to its own DUV event.
 * Desktop draws a real table with the day as a row group; phones get a list
 * under sticky day headings.
 */
export function CalendarLedger({ rows, showResults }: { rows: CalendarRow[]; showResults: boolean }) {
  const t = useTranslations("calendar.ledger");
  const tTags = useTranslations("tags");
  const locale = useLocale();
  const days = byDay(rows);
  // Columns are decided once per list: no Label column when no race has one.
  const showLabel = rows.some((row) => row.iau);

  const surface = (row: CalendarRow) => (row.surface ? tTags(`surface.${row.surface}`) : "");
  const iau = (row: CalendarRow) =>
    row.iau ? (
      <Tag family="iau" title={tTags(`iau.${row.iau}`)}>
        {tTags(`iau.${row.iau}`)}
      </Tag>
    ) : null;

  return (
    <>
      {/* Desktop: the ledger table. */}
      <table className="hidden w-full border-collapse text-[0.9375rem] lg:table">
        <caption className="sr-only">{t("caption")}</caption>
        <thead>
          <tr className="label-caps border-b-2 border-fg text-fg-muted">
            <th scope="col" className="w-36 pe-4 pb-1.5 text-start font-semibold">
              {t("day")}
            </th>
            <th scope="col" className="w-40 pe-4 pb-1.5 text-end font-semibold">
              {t("format")}
            </th>
            <th scope="col" className="pe-4 pb-1.5 text-start font-semibold">
              {t("race")}
            </th>
            <th scope="col" className="w-20 pe-4 pb-1.5 text-start font-semibold">
              {t("surface")}
            </th>
            <th scope="col" className="w-48 pe-4 pb-1.5 text-start font-semibold">
              {t("place")}
            </th>
            <th scope="col" className="w-12 pe-4 pb-1.5 text-start font-semibold">
              <abbr title={t("nationFull")} className="no-underline">
                {t("nation")}
              </abbr>
            </th>
            {showLabel && (
              <th scope="col" className={cn("w-28 pb-1.5 text-start font-semibold", showResults && "pe-4")}>
                {t("label")}
              </th>
            )}
            {showResults && (
              <th scope="col" className="w-36 pb-1.5 text-start font-semibold">
                {t("results")}
              </th>
            )}
          </tr>
        </thead>
        {days.map((day) => (
          <tbody key={day.date} className="border-b border-border">
            {day.rows.map((row, i) => (
              <tr key={row.key} className={cn("align-baseline", i < day.rows.length - 1 && "border-b border-hair")}>
                {i === 0 && (
                  <th scope="rowgroup" rowSpan={day.rows.length} className="pe-4 text-start align-top font-normal">
                    <div className="sticky top-[calc(var(--header-h)+0.5rem)] py-2.5">
                      <time dateTime={day.date}>
                        <span className="label-caps block text-fg-muted">{formatWeekday(day.date, locale)?.text}</span>
                        <span className="block font-serif text-[1.375rem] leading-tight font-semibold serif-figures">
                          {formatDayMonth(day.date, locale)?.text}
                        </span>
                        <span className="block text-xs text-fg-muted tabular">
                          {formatYear(day.date)?.text} · {t("raceCount", { count: day.raceCount })}
                        </span>
                      </time>
                    </div>
                  </th>
                )}
                <td className="py-2 pe-4 text-end font-semibold tabular">
                  <span className="inline-flex flex-wrap justify-end gap-x-2.5">
                    {row.formats.map((f) => (
                      <Link key={f.eventId} href={`/events/${f.eventId}`} className={cn(inkLink, "whitespace-nowrap")}>
                        <FormatText format={f} />
                      </Link>
                    ))}
                  </span>
                </td>
                <td className="py-2 pe-4">
                  <Link href={`/events/${row.eventId}`} className={cn(inkLink, "font-medium")}>
                    {row.name}
                  </Link>
                </td>
                <td className="py-2 pe-4 text-fg-muted">{surface(row)}</td>
                <td className="py-2 pe-4">{row.city}</td>
                <td className="label-caps py-2 pe-4 text-fg-muted">{row.country}</td>
                {showLabel && <td className={cn("py-2", showResults && "pe-4")}>{iau(row)}</td>}
                {showResults && (
                  <td className="py-2 text-sm">
                    <ResultsMark row={row} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        ))}
      </table>

      {/* Phones and tablets: sticky day headings over a list. */}
      <div className="lg:hidden">
        {days.map((day) => {
          const heading = `${formatWeekday(day.date, locale)?.text ?? ""} ${formatDate(day.date, locale)?.text ?? ""}`;
          return (
            <section key={day.date} aria-labelledby={`day-${day.date}`}>
              <h2
                id={`day-${day.date}`}
                className="sticky top-[var(--header-h)] z-10 -mx-4 flex items-baseline justify-between gap-3 border-b-2 border-fg bg-bg px-4 pt-3.5 pb-1.5 md:-mx-6 md:px-6"
              >
                <time dateTime={day.date} className="text-[0.9375rem] font-semibold tabular">
                  {heading}
                </time>
                <span className="text-xs font-normal text-fg-muted">{t("raceCount", { count: day.raceCount })}</span>
              </h2>
              <ul>
                {day.rows.map((row) => (
                  <li key={row.key} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3 border-b border-hair py-2.5">
                    <div className="text-sm leading-snug font-semibold tabular">
                      {row.formats.map((f) => (
                        <Link key={f.eventId} href={`/events/${f.eventId}`} className={cn(inkLink, "block")}>
                          <FormatText format={f} stacked />
                        </Link>
                      ))}
                      {row.surface && <span className="block text-xs font-medium text-fg-muted">{surface(row)}</span>}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/events/${row.eventId}`} className={cn(inkLink, "text-[0.9375rem] font-medium")}>
                        {row.name}
                      </Link>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-fg-muted">
                        {row.city && <span className="truncate">{row.city}</span>}
                        {row.city && <span aria-hidden>·</span>}
                        <span className="label-caps">{row.country}</span>
                        {row.iau && (
                          <>
                            <span aria-hidden>·</span>
                            {iau(row)}
                          </>
                        )}
                        {showResults && row.formats.some((f) => f.hasResults) && (
                          <>
                            <span aria-hidden>·</span>
                            <ResultsMark row={row} />
                          </>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
