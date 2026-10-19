import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { DateText, formatClimb, formatCount, formatCourseLength, formatPerformanceText } from "@/lib/format";
import { RecordMarker, Tag } from "@/components/design";
import { cn } from "@/lib/utils";
import { splitLabel, type LedgerGroup, type LedgerRow, type LedgerYear } from "./ledger";
import { Place } from "./Place";
import { SplitToggle } from "./SplitToggle";

/** Course facts of trail races, by EventID (Length and AltitudeDiff from the race details). */
export type Courses = Record<string, { length?: string; climb?: string }>;

// Phones: each row is a small grid (result and place, race, date and distance).
// From md the rows are ordinary table rows. Explicit roles keep the table
// semantics while the display changes.
const ROW =
  "grid grid-cols-[auto_minmax(0,1fr)_auto] [grid-template-areas:'res_res_place'_'race_race_race'_'date_dist_dist'_'tog_tog_tog'] gap-x-2 border-b border-hair py-2 md:table-row md:py-0";
const CELL = "md:table-cell md:border-b md:border-hair md:py-2 md:pe-3 md:align-baseline";

function Result({ row }: { row: LedgerRow }) {
  const t = useTranslations("runner.ledger");
  const locale = useLocale();
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="tabular">{formatPerformanceText(row.perf, locale)}</span>
      {row.pb && (
        <RecordMarker kind="PB" className="self-center">
          {t("pbPopover", { dist: formatCourseLength(row.dist, locale) })}
        </RecordMarker>
      )}
    </span>
  );
}

function Distance({ row, courses }: { row: LedgerRow; courses: Courses }) {
  const locale = useLocale();
  const course = row.trail ? courses[row.id] : undefined;
  const length = formatCourseLength(course?.length || row.dist, locale);
  const climb = row.trail ? formatClimb(course?.climb, locale) : null;
  return (
    <span className="tabular">
      <span className="whitespace-nowrap">{length}</span>
      {climb && (
        <>
          <span className="md:hidden"> · </span>
          <span className="whitespace-nowrap md:block">{climb}</span>
        </>
      )}
    </span>
  );
}

function GroupRows({
  group,
  courses,
  open,
}: {
  group: LedgerGroup;
  courses: Courses;
  open: boolean;
}) {
  const t = useTranslations("runner.ledger");
  const tTags = useTranslations("tags");
  const locale = useLocale();
  const { main, also, splits } = group;
  const parents = [main.name, ...also.map((a) => a.name)];
  const toggle = splits.length > 0 && (
    <SplitToggle
      defaultOpen={open}
      showLabel={t(splits.some((r) => r.pb) ? "showSplitsPb" : "showSplits", { count: splits.length })}
      hideLabel={t("hideSplits", { count: splits.length })}
    />
  );

  return (
    <tbody role="rowgroup" data-open={String(open)} className="group/splits block md:table-row-group">
      <tr role="row" className={ROW}>
        <td role="cell" className={cn(CELL, "[grid-area:res] text-[0.9375rem] font-semibold")}>
          <Result row={main} />
        </td>
        <td role="cell" className={cn(CELL, "[grid-area:place] text-right md:text-left")}>
          <Place row={main} />
        </td>
        <td role="cell" className={cn(CELL, "[grid-area:race] min-w-0")}>
          <Link href={`/events/${main.id}/results`} className="text-link hover:underline">
            {main.name}
          </Link>
          {main.championship && (
            <Tag family="championship" className="ms-1.5 align-[1px]">
              {tTags(`championship.${main.championship}`)}
            </Tag>
          )}
          {main.trail && (
            <Tag family="surface" className="ms-1.5 align-[1px]">
              {tTags("surface.trail")}
            </Tag>
          )}
          {also.length > 0 && (
            <span className="block text-xs text-fg-muted md:text-[0.8125rem]">
              {t("alsoScored", {
                races: also
                  .map((a) =>
                    a.overall && a.overall !== main.overall ? t("alsoPlace", { race: a.name, place: a.overall }) : a.name
                  )
                  .join("; "),
              })}
            </span>
          )}
          {toggle && <span className="hidden md:block">{toggle}</span>}
        </td>
        <td role="cell" className={cn(CELL, "[grid-area:dist] text-xs text-fg-muted md:text-[0.8125rem]")}>
          <span className="md:hidden">· </span>
          <Distance row={main} courses={courses} />
        </td>
        <td role="cell" className={cn(CELL, "[grid-area:date] text-xs text-fg-muted md:pe-0 md:text-right md:text-[0.8125rem] md:whitespace-nowrap")}>
          <DateText value={main.iso || main.date} locale={locale} variant="dayMonth" />
        </td>
        {/* Phones: the toggle goes under the date line, after the race's own facts. */}
        {toggle && (
          <td role="cell" className="[grid-area:tog] md:hidden">
            {toggle}
          </td>
        )}
      </tr>
      {splits.map((split) => (
        <tr
          key={split.id}
          role="row"
          className={cn(
            ROW,
            "border-s-2 border-s-border bg-surface-muted ps-3 group-data-[open=false]/splits:hidden md:border-s-0"
          )}
        >
          <td role="cell" className={cn(CELL, "[grid-area:res] text-sm font-medium md:ps-4")}>
            <Result row={split} />
          </td>
          <td role="cell" className={cn(CELL, "[grid-area:place] text-right text-sm md:text-left")}>
            <Place row={split} compact />
          </td>
          <td role="cell" className={cn(CELL, "[grid-area:race] text-sm")}>
            <span className="sr-only">{t("split")}: </span>
            <Link href={`/events/${split.id}/results`} className="text-fg-muted hover:text-link hover:underline">
              {splitLabel(split.name, parents)}
            </Link>
          </td>
          <td role="cell" className={cn(CELL, "hidden text-[0.8125rem] text-fg-muted md:table-cell")}>
            {formatCourseLength(split.dist, locale)}
          </td>
          <td role="cell" className={cn(CELL, "hidden md:table-cell")} />
        </tr>
      ))}
    </tbody>
  );
}

/**
 * The full history, newest first: one block per season with the year in the
 * margin (above the rows on phones), each race on one line with result,
 * place, race, distance and date, its splits folded under it.
 */
export function Ledger({
  years,
  courses,
  open,
  allOpen,
}: {
  years: LedgerYear[];
  courses: Courses;
  /** Races whose splits start unfolded (a distance filter matched a split). */
  open: Set<string>;
  allOpen: boolean;
}) {
  const t = useTranslations("runner.ledger");
  const locale = useLocale();
  return (
    <div>
      {years.map((year) => {
        const km = year.km !== null ? formatCount(Math.round(year.km), locale) : null;
        const summary = [
          year.events !== null ? t("events", { count: year.events }) : null,
          km ? t("km", { km }) : null,
        ].filter(Boolean);
        return (
          <section
            key={year.year}
            aria-labelledby={`y${year.year}`}
            className="border-t-2 border-fg md:grid md:grid-cols-[5.5rem_minmax(0,1fr)]"
          >
            <h3
              id={`y${year.year}`}
              className="scroll-mt-[calc(var(--header-h)+1rem)] pt-2 pb-1 md:sticky md:top-[calc(var(--header-h)+0.5rem)] md:self-start md:py-2"
            >
              <span className="font-serif text-xl leading-none font-semibold tabular md:text-[1.625rem]">{year.year}</span>
              {summary.length > 0 && (
                <small className="ms-2 text-xs font-normal text-fg-muted md:ms-0 md:mt-1.5 md:block md:leading-snug">
                  {summary.map((s, i) => (
                    <span key={i} className="md:block">
                      {i > 0 && <span className="md:hidden"> · </span>}
                      {s}
                    </span>
                  ))}
                </small>
              )}
            </h3>
            <table role="table" className="block w-full border-collapse text-sm md:table md:table-fixed md:text-[0.9375rem]">
              <caption className="sr-only">{t("caption", { year: year.year })}</caption>
              <colgroup>
                <col className="md:w-[8.75rem]" />
                <col className="md:w-[6.75rem]" />
                <col />
                <col className="md:w-[6rem]" />
                <col className="md:w-[4.75rem]" />
              </colgroup>
              <thead role="rowgroup" className="sr-only">
                <tr role="row">
                  <th role="columnheader" scope="col">{t("result")}</th>
                  <th role="columnheader" scope="col">{t("place")}</th>
                  <th role="columnheader" scope="col">{t("race")}</th>
                  <th role="columnheader" scope="col">{t("distance")}</th>
                  <th role="columnheader" scope="col">{t("date")}</th>
                </tr>
              </thead>
              {year.groups.map((group) => (
                <GroupRows
                  key={group.main.id}
                  group={group}
                  courses={courses}
                  open={allOpen || open.has(group.main.id)}
                />
              ))}
            </table>
          </section>
        );
      })}
    </div>
  );
}
