import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { DisciplineKey } from "@/lib/records/types";
import type { BoardCell } from "./cells";
import type { BoardRow } from "./data";
import { CellMarker, DateOf, HolderLink, perfText, type RecordsT } from "./parts";

export interface RecordBoardProps {
  rows: BoardRow[];
  /** The distance whose age classes are open. */
  selected: DisciplineKey | null;
  /** Chosen by the visitor (opens on phones too), not only the desktop default. */
  explicit: boolean;
  /** Link that opens a distance. */
  hrefFor: (dist: DisciplineKey) => string;
  /** Link that reloads the page, for a list that did not load. */
  retryHref: string;
  /** The open distance's age classes, shown under its row on phones. */
  inlineDetail?: ReactNode;
}

function BoardMark({ cell, t, locale }: { cell: BoardCell | null; t: RecordsT; locale: string }) {
  if (!cell) return <p className="pt-1.5 text-xs text-fg-muted">{t("noMark")}</p>;
  return (
    <div className="min-w-0">
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span className="font-display text-[1.375rem] leading-tight font-bold tabular-nums">{perfText(cell.perf, cell.dist, locale, t)}</span>
        <CellMarker cell={cell} t={t} locale={locale} context="board" />
      </p>
      <p className="truncate text-sm font-medium">
        <HolderLink holder={cell} locale={locale} />
      </p>
      <p className="truncate text-xs text-fg-muted">
        {cell.scope !== "nation" && cell.nat && (
          <>
            <span>{cell.nat}</span>
            {cell.date && <span aria-hidden> · </span>}
          </>
        )}
        <DateOf value={cell.date} locale={locale} />
      </p>
    </div>
  );
}

/**
 * Every record of a scope on one board (records.html, direction A): a row per
 * distance with the women's and the men's record side by side. A distance's
 * label opens its age classes. One `<tbody>` per distance: the label row is
 * the row group's header, so a screen reader hears "24 h, Women, 278.622 km".
 */
export async function RecordBoard({ rows, selected, explicit, hrefFor, retryHref, inlineDetail }: RecordBoardProps) {
  const t = await getTranslations("records");
  const locale = await getLocale();

  return (
    <table className="w-full table-fixed border-collapse text-left">
      <caption className="sr-only">{t("boardLabel")}</caption>
      <thead>
        <tr className="border-b-[length:var(--rule-mid)] border-fg">
          <th scope="col" className="label-caps w-1/2 ps-2 pe-3 pb-2 text-fg">
            {t("women")}
          </th>
          <th scope="col" className="label-caps w-1/2 border-s border-border ps-3 pe-2 pb-2 text-fg">
            {t("men")}
          </th>
        </tr>
      </thead>
      {rows.map((row) => {
        const isSelected = row.dist === selected;
        const showInline = isSelected && explicit && inlineDetail;
        return (
          <tbody
            key={row.dist}
            id={`dist-${row.dist}`}
            className={cn(
              "scroll-mt-[calc(var(--header-h)+1rem)] border-b border-hair",
              isSelected && (explicit ? "bg-surface-muted" : "lg:bg-surface-muted")
            )}
          >
            <tr>
              <th scope="rowgroup" colSpan={2} className="p-0 font-normal">
                <Link
                  href={hrefFor(row.dist)}
                  scroll={false}
                  aria-current={isSelected ? "true" : undefined}
                  aria-label={t("openDistance", { dist: t(`dist.${row.dist}`) })}
                  className={cn(
                    "nav-link flex min-h-11 items-center justify-between gap-2 px-2 text-sm font-semibold hover:bg-transparent hover:underline md:min-h-9",
                    isSelected && (explicit ? "text-brand-ink" : "lg:text-brand-ink")
                  )}
                >
                  <span>{t(`dist.${row.dist}`)}</span>
                  <ChevronDown aria-hidden strokeWidth={1.75} className={cn("size-4 text-fg-muted lg:hidden", showInline && "rotate-180")} />
                  <ChevronRight aria-hidden strokeWidth={1.75} className="hidden size-4 text-fg-muted lg:block" />
                </Link>
              </th>
            </tr>
            <tr>
              {row.failed ? (
                <td colSpan={2} className="px-2 pb-3 text-xs text-fg-muted">
                  {t("failed")}{" "}
                  <a href={retryHref}>{t("retry")}</a>
                </td>
              ) : (
                <>
                  <td className="ps-2 pe-3 pb-3 align-top">
                    <BoardMark cell={row.W} t={t} locale={locale} />
                  </td>
                  <td className="border-s border-hair ps-3 pe-2 pb-3 align-top">
                    <BoardMark cell={row.M} t={t} locale={locale} />
                  </td>
                </>
              )}
            </tr>
            {showInline && (
              <tr className="lg:hidden">
                <td colSpan={2} className="border-t border-dashed border-border px-2 pt-1 pb-4">
                  <Fragment>{inlineDetail}</Fragment>
                </td>
              </tr>
            )}
          </tbody>
        );
      })}
    </table>
  );
}
