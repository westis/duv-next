import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { DateText, formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RaceEdition } from "./races";
import { formatDistances, formatPlace } from "./raceText";
import { bodyCell, headCell, tableClass } from "./tableStyles";

export type EditionRow = RaceEdition & { city: string; country: string };

/** Races as DUV lists them: one row per edition, newest first. */
export function EditionTable({ rows }: { rows: EditionRow[] }) {
  const t = useTranslations("search");
  const locale = useLocale();
  return (
    <table className={tableClass}>
      <caption className="sr-only">{t("editionCaption")}</caption>
      <thead>
        <tr>
          <th scope="col" className={cn(headCell, "w-[6.5rem]")}>
            {t("col.date")}
          </th>
          <th scope="col" className={headCell}>
            {t("col.race")}
          </th>
          <th scope="col" className={cn(headCell, "hidden md:table-cell")}>
            {t("col.where")}
          </th>
          <th scope="col" className={cn(headCell, "hidden md:table-cell")}>
            {t("col.distance")}
          </th>
          <th scope="col" className={cn(headCell, "hidden text-end lg:table-cell")}>
            {t("col.finishers")}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((e) => {
          const place = formatPlace(e.city, e.country);
          const distance = formatDistances([e], locale);
          const field = e.upcoming ? t("upcoming") : e.finishers !== null ? formatCount(e.finishers, locale) : "";
          return (
            <tr key={e.id} className="hover:bg-surface-muted/60">
              <td className={cn(bodyCell, "whitespace-nowrap text-fg-muted tabular")}>
                <DateText value={e.date} end={e.end} locale={locale} variant="range" />
              </td>
              <td className={bodyCell}>
                <Link href={`/events/${e.id}`} className="font-semibold">
                  {e.name}
                </Link>
                <span className="block text-sm text-fg-muted md:hidden">
                  {[place, distance].filter(Boolean).join(" · ")}
                </span>
              </td>
              <td className={cn(bodyCell, "hidden md:table-cell")}>{place}</td>
              <td className={cn(bodyCell, "hidden text-fg-muted md:table-cell")}>{distance}</td>
              <td className={cn(bodyCell, "hidden text-end tabular lg:table-cell", e.upcoming && "text-fg-muted")}>
                {field}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
