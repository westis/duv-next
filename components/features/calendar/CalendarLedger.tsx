import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Tag } from "@/components/design";
import { COURSE_SEPARATOR, formatMonthShort, formatWeekday, formatYear } from "@/lib/format";
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
  if (format.backyard) return <span className="uppercase">{t("type.backyard")}</span>;
  const [length, climb] = format.text.split(COURSE_SEPARATOR);
  if (!climb) return <>{length}</>;
  if (stacked) {
    return (
      <>
        {length}
        <span className="block font-sans text-xs font-medium text-fg-muted">{climb}</span>
      </>
    );
  }
  return (
    <>
      {length}
      <span className="text-[0.8em] font-semibold text-fg-muted">
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
 * The race calendar, Swiss Grid look (design-system/components/CalendarList.md):
 * rows under a 6 px ink rule, the day once as a big condensed number with its
 * weekday, then one row per race: the race and its place, the distance (what
 * the race is: 48 h, 100 mi, Backyard) and the type (surface, IAU label, and
 * the DUV cup in red). Distances of one race share a row, each linking to its
 * own DUV event. Desktop draws a real table with the day as a row group;
 * phones keep the day in a narrow left column with distance and type under
 * the race name.
 */
export function CalendarLedger({ rows, showResults }: { rows: CalendarRow[]; showResults: boolean }) {
  const t = useTranslations("calendar.ledger");
  const tTags = useTranslations("tags");
  const locale = useLocale();
  const days = byDay(rows);

  const dayLabel = (date: string) => ({
    day: date.slice(8, 10),
    weekday: formatWeekday(date, locale)?.text ?? "",
    month: `${formatMonthShort(Number(date.slice(5, 7)), locale) ?? ""} ${formatYear(date)?.text ?? ""}`.trim(),
  });

  /** Surface, IAU label and cup: condensed capitals, only the label and the cup in red. */
  const type = (row: CalendarRow) => (
    <span className="flex flex-col items-start gap-0.5">
      {row.surface && <Tag family="surface">{tTags(`surface.${row.surface}`)}</Tag>}
      {row.iau && (
        <Tag family="iau" title={tTags(`iau.${row.iau}`)}>
          {tTags(`iau.${row.iau}`)}
        </Tag>
      )}
      {row.cup && (
        <Tag family="championship" title={row.cup}>
          {row.cup}
        </Tag>
      )}
    </span>
  );

  const place = (row: CalendarRow) =>
    [row.city, row.country].filter(Boolean).join(", ");

  return (
    <>
      {/* Desktop: the calendar table. */}
      <table className="hidden w-full border-collapse lg:table">
        <caption className="sr-only">{t("caption")}</caption>
        <thead>
          <tr className="label-caps border-b-[length:var(--rule-heavy)] border-fg text-fg">
            <th scope="col" className="w-36 pe-5 pb-2 text-start">
              {t("day")}
            </th>
            <th scope="col" className="pe-5 pb-2 text-start">
              {t("race")}
            </th>
            <th scope="col" className="w-44 pe-5 pb-2 text-start">
              {t("distance")}
            </th>
            <th scope="col" className={cn("w-44 pb-2 text-start", showResults && "pe-5")}>
              {t("type")}
            </th>
            {showResults && (
              <th scope="col" className="w-32 pb-2 text-start">
                {t("results")}
              </th>
            )}
          </tr>
        </thead>
        {days.map((day) => {
          const d = dayLabel(day.date);
          return (
            <tbody key={day.date} className="border-b border-border">
              {day.rows.map((row, i) => (
                <tr key={row.key} className={cn("align-middle", i < day.rows.length - 1 && "border-b border-border")}>
                  {i === 0 && (
                    <th scope="rowgroup" rowSpan={day.rows.length} className="pe-5 text-start align-top font-normal">
                      <div className="sticky top-[calc(var(--header-h)+0.5rem)] py-2.5">
                        <time dateTime={day.date} className="block">
                          <span className="flex items-baseline gap-1.5">
                            <span className="font-display text-[2.5rem] leading-none font-extrabold tabular-nums">{d.day}</span>
                            <span className="font-display text-[0.9375rem] font-bold text-fg-muted uppercase">{d.weekday}</span>
                          </span>
                          <span className="label-caps mt-1 block text-fg-muted">{d.month}</span>
                        </time>
                        {day.rows.length > 1 && (
                          <span className="mt-0.5 block text-xs text-fg-muted">{t("raceCount", { count: day.raceCount })}</span>
                        )}
                      </div>
                    </th>
                  )}
                  <td className="py-2.5 pe-5">
                    <Link href={`/events/${row.eventId}`} className={cn(inkLink, "text-[0.9375rem] font-semibold")}>
                      {row.name}
                    </Link>
                    {place(row) && <span className="mt-0.5 block text-[0.8125rem] text-fg-muted">{place(row)}</span>}
                  </td>
                  <td className="py-2.5 pe-5 font-display text-[1.375rem] leading-tight font-bold tabular-nums">
                    <span className="flex flex-col">
                      {row.formats.map((f) => (
                        <Link key={f.eventId} href={`/events/${f.eventId}`} className={cn(inkLink, "whitespace-nowrap")}>
                          <FormatText format={f} />
                        </Link>
                      ))}
                    </span>
                  </td>
                  <td className={cn("py-2.5", showResults && "pe-5")}>{type(row)}</td>
                  {showResults && (
                    <td className="py-2.5 text-sm">
                      <ResultsMark row={row} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>

      {/* Phones and tablets: the day in a narrow left column, the races beside it. */}
      <div className="border-t-[length:var(--rule-heavy)] border-fg lg:hidden">
        {days.map((day) => {
          const d = dayLabel(day.date);
          return (
            <section
              key={day.date}
              aria-labelledby={`day-${day.date}`}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 border-b border-border"
            >
              <h2 id={`day-${day.date}`} className="py-2.5 font-normal">
                <time dateTime={day.date} className="sticky top-2 block">
                  <span className="block font-display text-[2rem] leading-none font-extrabold tabular-nums">{d.day}</span>
                  <span className="block font-display text-sm font-bold text-fg-muted uppercase">{d.weekday}</span>
                  <span className="sr-only"> {d.month}</span>
                </time>
              </h2>
              <ul>
                {day.rows.map((row, i) => (
                  <li key={row.key} className={cn("py-2.5", i < day.rows.length - 1 && "border-b border-border")}>
                    <Link href={`/events/${row.eventId}`} className={cn(inkLink, "text-[0.9375rem] font-semibold")}>
                      {row.name}
                    </Link>
                    {place(row) && <p className="mt-0.5 text-xs text-fg-muted">{place(row)}</p>}
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      {row.formats.map((f) => (
                        <Link
                          key={f.eventId}
                          href={`/events/${f.eventId}`}
                          className={cn(inkLink, "font-display text-lg leading-tight font-bold whitespace-nowrap tabular-nums")}
                        >
                          <FormatText format={f} />
                        </Link>
                      ))}
                      {row.surface && <Tag family="surface">{tTags(`surface.${row.surface}`)}</Tag>}
                      {row.iau && <Tag family="iau">{tTags(`iau.${row.iau}`)}</Tag>}
                      {row.cup && <Tag family="championship">{row.cup}</Tag>}
                      {showResults && row.formats.some((f) => f.hasResults) && (
                        <span className="text-xs">
                          <ResultsMark row={row} />
                        </span>
                      )}
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
