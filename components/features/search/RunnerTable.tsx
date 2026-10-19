import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatRunnerName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ActiveSpan } from "./ActiveSpan";
import { sexKey } from "./raceText";
import { spanAxis, type RunnerRow } from "./races";
import { bodyCell, headCell, tableClass } from "./tableStyles";

/**
 * Runners with their active years on one shared time axis, so namesakes
 * (two Yiannis KOUROS born 1956) tell apart at a glance. A column shows only
 * when someone in the list has the fact.
 */
export function RunnerTable({ rows }: { rows: RunnerRow[] }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const axis = spanAxis(rows);
  const hasYob = rows.some((r) => r.yob);
  const hasClub = rows.some((r) => r.club || r.city);

  return (
    <table className={tableClass}>
      <caption className="sr-only">{t("runnerCaption")}</caption>
      <thead>
        <tr>
          <th scope="col" className={headCell}>
            {t("col.runner")}
          </th>
          <th scope="col" className={cn(headCell, "hidden w-16 md:table-cell")}>
            {t("col.country")}
          </th>
          <th scope="col" className={cn(headCell, "hidden w-12 md:table-cell")}>
            {t("col.sex")}
          </th>
          {hasYob && (
            <th scope="col" className={cn(headCell, "hidden w-16 md:table-cell")}>
              {t("col.born")}
            </th>
          )}
          {hasClub && (
            <th scope="col" className={cn(headCell, "hidden lg:table-cell")}>
              {t("col.clubCity")}
            </th>
          )}
          <th scope="col" className={cn(headCell, "hidden w-[18rem] md:table-cell lg:w-[22rem]")}>
            {axis ? (
              <span className="flex items-baseline gap-2.5">
                <span className="flex flex-1 justify-between">
                  <span>{t("col.activeFrom", { year: axis.from })}</span>
                  <span className="tabular">{axis.to}</span>
                </span>
                <span aria-hidden className="w-[4.5rem]" />
              </span>
            ) : (
              t("col.active")
            )}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const sex = sexKey(r.gender);
          const facts = [r.nat, sex ? t(`sex.${sex}`) : "", r.yob].filter(Boolean).join(" · ");
          const where = [r.club, r.city].filter(Boolean).join(" · ");
          const sub = [r.origName, where].filter(Boolean);
          return (
            <tr key={r.id} className="hover:bg-surface-muted/60">
              <td className={bodyCell}>
                <span className="flex items-baseline justify-between gap-3">
                  <Link href={`/runners/${r.id}`} className="font-semibold">
                    {formatRunnerName({ first: r.first, last: r.last }, locale)}
                  </Link>
                  <span className="text-sm whitespace-nowrap text-fg-muted tabular md:hidden">{facts}</span>
                </span>
                {r.origName && <span className="block text-sm text-fg-muted lg:hidden">{sub.join(" · ")}</span>}
                {!r.origName && where && <span className="block text-sm text-fg-muted lg:hidden">{where}</span>}
                {r.origName && <span className="hidden text-sm text-fg-muted lg:block">{r.origName}</span>}
                <ActiveSpan from={r.from} to={r.to} axis={axis} className="mt-1.5 md:hidden" />
              </td>
              <td className={cn(bodyCell, "hidden tabular md:table-cell")}>{r.nat}</td>
              <td className={cn(bodyCell, "hidden md:table-cell")}>{sex ? t(`sex.${sex}`) : ""}</td>
              {hasYob && <td className={cn(bodyCell, "hidden tabular md:table-cell")}>{r.yob}</td>}
              {hasClub && <td className={cn(bodyCell, "hidden text-fg-muted lg:table-cell")}>{where}</td>}
              <td className={cn(bodyCell, "hidden align-middle md:table-cell")}>
                <ActiveSpan from={r.from} to={r.to} axis={axis} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
