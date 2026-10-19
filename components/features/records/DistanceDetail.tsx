import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { RecordGender } from "@/lib/records/types";
import type { BoardCell } from "./cells";
import type { AgeRow, DistanceDetail as Detail } from "./data";
import { bornText, CellMarker, DateOf, flagText, HolderLink, holderName, PlaceLink, perfText, type RecordsT } from "./parts";

const GENDERS: RecordGender[] = ["W", "M"];

/** The open record of one gender: where and when, and what stands beside it. */
function OpenRecord({ cell, gender, t, locale }: { cell: BoardCell | null; gender: RecordGender; t: RecordsT; locale: string }) {
  if (!cell) return null;
  const flags = flagText(cell, t);
  const other = cell.previous ?? cell.duvBest;
  return (
    <div className="min-w-0 text-sm">
      <p className="label-caps text-fg-muted">{gender === "W" ? t("women") : t("men")}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5">
        <span className="serif-figures text-lg leading-tight font-semibold">{perfText(cell.perf, cell.dist, locale, t)}</span>
        <CellMarker cell={cell} t={t} locale={locale} context="board" />
      </p>
      <p className="font-medium">
        <HolderLink holder={cell} locale={locale} />
        {cell.nat && <span className="font-normal text-fg-muted"> {cell.nat}</span>}
      </p>
      <p className="text-fg-muted">
        <PlaceLink cell={cell} />
        {(cell.place || cell.country) && cell.date && <span aria-hidden>, </span>}
        <DateOf value={cell.date} locale={locale} />
        {flags && <span> · {flags}</span>}
      </p>
      {other && (
        <p className="mt-1 text-xs text-fg-muted md:text-sm">
          {cell.previous ? t("ratifiedRecord") : t("bestInDuv")}:{" "}
          <span className="tabular">{perfText(other.perf, cell.dist, locale, t)}</span>, {holderName(other, locale)}
          {other.date && (
            <>
              , <DateOf value={other.date} locale={locale} />
            </>
          )}
        </p>
      )}
    </div>
  );
}

/** One gender's mark in the age table: three lines on phones, three columns from lg. */
function AgeMark({ cell, row, gender, t, locale }: { cell: BoardCell | null; row: AgeRow; gender: RecordGender; t: RecordsT; locale: string }) {
  if (!cell) return <span className="text-xs text-fg-muted">{t("noMark")}</span>;
  const born = bornText(cell, locale, t);
  const flags = flagText(cell, t);
  return (
    <div className="min-w-0 lg:grid lg:grid-cols-[6.25rem_minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-3">
      <p className="flex flex-wrap items-center gap-x-1.5">
        <span className="serif-figures font-semibold">{perfText(cell.perf, cell.dist, locale, t)}</span>
        <CellMarker cell={cell} t={t} locale={locale} context="age" holds={row.holds.includes(gender)} />
      </p>
      <div className="min-w-0">
        <p className="truncate text-sm">
          <HolderLink holder={cell} locale={locale} />
        </p>
        {born && <p className="hidden truncate text-xs text-fg-muted lg:block md:text-sm">{born}</p>}
      </div>
      <div className="min-w-0 text-xs text-fg-muted lg:text-sm">
        <p className="truncate">
          {cell.date && (
            <span className="lg:hidden">
              <DateOf value={cell.date} locale={locale} variant="year" />
              {(cell.place || cell.country) && <span aria-hidden> · </span>}
            </span>
          )}
          <PlaceLink cell={cell} />
        </p>
        <p className="hidden truncate text-xs text-fg-muted lg:block md:text-sm">
          <DateOf value={cell.date} locale={locale} />
          {flags && <span> · {flags}</span>}
        </p>
      </div>
    </div>
  );
}

/**
 * A distance's records by age class (records.html A): the open records first,
 * then one table with women and men side by side per age class. The class that
 * holds the open record is shaded.
 */
export async function DistanceDetail({
  detail,
  ageBy,
  headingLevel = "h2",
  className,
}: {
  detail: Detail;
  ageBy: "DOB" | "YOB";
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const t = await getTranslations("records");
  const locale = await getLocale();
  const Heading = headingLevel;
  const distLabel = t(`dist.${detail.dist}`);
  const hasHolder = detail.ages.some((r) => r.holds.length > 0);

  return (
    <section aria-label={t("detailTitle", { dist: distLabel })} className={className}>
      <Heading className="font-serif text-xl leading-tight font-semibold md:text-[1.375rem]">
        {t("detailTitle", { dist: distLabel })}
      </Heading>

      {detail.failed ? (
        <p className="mt-3 text-sm text-fg-muted">{t("detailFailed")}</p>
      ) : (
        <>
          {(detail.open.W || detail.open.M) && (
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {GENDERS.map((g) => (
                <OpenRecord key={g} cell={detail.open[g]} gender={g} t={t} locale={locale} />
              ))}
            </div>
          )}

          {detail.ages.length === 0 ? (
            <p className="mt-4 text-sm text-fg-muted">{t("noAgeClasses")}</p>
          ) : (
            <table className="mt-5 w-full table-fixed border-collapse text-left">
              <caption className="sr-only">{t("detailTitle", { dist: distLabel })}</caption>
              <colgroup>
                <col className="w-11" />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr className="border-b border-fg">
                  <th scope="col" className="label-caps ps-1.5 pb-2 text-fg-muted">
                    {t("age")}
                  </th>
                  <th scope="col" className="label-caps px-2 pb-2 text-fg-muted">
                    {t("women")}
                  </th>
                  <th scope="col" className="label-caps border-s border-hair px-2 pb-2 text-fg-muted">
                    {t("men")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.ages.map((row) => (
                  <tr key={row.band} className={cn("border-b border-hair align-top", row.holds.length > 0 && "bg-highlight")}>
                    <th scope="row" className="ps-1.5 pt-2 pb-2.5 text-sm font-semibold tabular">
                      {row.band}
                    </th>
                    {GENDERS.map((g) => (
                      <td key={g} className={cn("px-2 pt-2 pb-2.5", g === "M" && "border-s border-hair")}>
                        <AgeMark cell={row[g]} row={row} gender={g} t={t} locale={locale} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {detail.ages.length > 0 && (
            <p className="mt-2 text-xs text-fg-muted md:text-sm">
              {hasHolder && <>{t("shaded")} </>}
              {ageBy === "YOB" ? t("ageByYear") : t("ageOnRaceDay")}
            </p>
          )}
        </>
      )}
    </section>
  );
}
