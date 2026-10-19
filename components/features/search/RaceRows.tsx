"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { DateText, formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RaceGroup, RaceYear } from "./races";
import { FinisherSparkline } from "./FinisherSparkline";
import { formatDistances, formatPlace } from "./raceText";
import { bodyCell } from "./tableStyles";

export type RaceRowData = Omit<RaceGroup, "editions">;

/**
 * One race per row, however many editions it has: the next or latest date,
 * where, the distances (with climb for trail), editions, finishers per edition
 * as a sparkline and the last field. "Editions" opens a strip with a bar per
 * year, each a link to that year's race.
 */
export function RaceRows({ races }: { races: RaceRowData[] }) {
  return (
    <>
      {races.map((race) => (
        <RaceRow key={race.key} race={race} />
      ))}
    </>
  );
}

function RaceRow({ race }: { race: RaceRowData }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const stripId = `editions-${race.key}`;
  const place = formatPlace(race.city, race.country);
  const distances = formatDistances(race.distances, locale);
  const field = race.shown.upcoming
    ? t("upcoming")
    : race.lastField !== null
      ? formatCount(race.lastField, locale)
      : "";
  const history = race.editionCount > 1 ? t("editionsSince", { count: race.editionCount, year: race.firstYear }) : "";
  const many = race.editionCount > 1;
  const fieldText = race.shown.upcoming
    ? t("upcoming")
    : race.lastField !== null
      ? t("lastField", { count: formatCount(race.lastField, locale) ?? "" })
      : "";
  const toggle = (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={stripId}
      onClick={() => setOpen((v) => !v)}
      className="inline-flex min-h-11 items-center gap-0.5 align-baseline text-sm text-fg-muted hover:text-fg md:min-h-8"
    >
      {t("editionsToggle")}
      <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} strokeWidth={1.75} aria-hidden />
      <span className="sr-only">{race.name}</span>
    </button>
  );

  return (
    <Fragment>
      <tr className={cn("hover:bg-surface-muted/60", open && "bg-surface-muted")}>
        <td className={cn(bodyCell, "hidden w-[6.5rem] whitespace-nowrap text-fg-muted tabular md:table-cell")}>
          <DateText value={race.shown.date} locale={locale} />
        </td>
        <td className={bodyCell}>
          <Link href={`/events/${race.shown.id}`} className="font-semibold">
            {race.name}
          </Link>
          {many && <span className="hidden lg:inline"> {toggle}</span>}
          <span className="block text-sm text-fg-muted md:hidden">
            <DateText value={race.shown.date} locale={locale} />
            {[place, distances].filter(Boolean).map((part) => ` · ${part}`)}
          </span>
          {(history || field || many) && (
            <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-fg-muted lg:hidden">
              <FinisherSparkline years={race.years} locale={locale} />
              <span className="tabular">{[history, fieldText].filter(Boolean).join(" · ")}</span>
              {many && toggle}
            </span>
          )}
        </td>
        <td className={cn(bodyCell, "hidden md:table-cell")}>{place}</td>
        <td className={cn(bodyCell, "hidden text-fg-muted md:table-cell")}>{distances}</td>
        <td className={cn(bodyCell, "hidden text-end tabular lg:table-cell")}>{formatCount(race.editionCount, locale)}</td>
        <td className={cn(bodyCell, "hidden lg:table-cell")}>
          <FinisherSparkline years={race.years} locale={locale} />
        </td>
        <td className={cn(bodyCell, "hidden text-end tabular lg:table-cell", race.shown.upcoming && "text-fg-muted")}>
          {field}
        </td>
      </tr>
      {many && (
        <tr id={stripId} hidden={!open} className="bg-surface-muted">
          <td colSpan={7} className="border-b border-hair px-0 pt-1 pb-3 md:px-3">
            <EditionStrip race={race} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

const BAR_MAX = 30;

function EditionStrip({ race }: { race: RaceRowData }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const max = Math.max(1, ...race.years.map((y) => y.finishers ?? 0));
  const label = (y: RaceYear) =>
    y.id === null
      ? t("yearNotHeld", { year: y.year })
      : y.finishers
        ? t("yearFinishers", { year: y.year, count: y.finishers, shown: formatCount(y.finishers, locale) ?? "" })
        : t("yearNoFinishers", { year: y.year });
  return (
    <div>
      <p className="mb-1.5 text-xs text-fg-muted">{t("stripCaption")}</p>
      <ul className="flex items-end gap-0.5 overflow-x-auto overscroll-x-contain pb-1" aria-label={t("stripLabel", { name: race.name })}>
        {race.years.map((y) => {
          const height = y.finishers ? Math.max(2, Math.round((y.finishers / max) * BAR_MAX)) : 1;
          const bar = (
            <>
              <span
                aria-hidden
                className={cn("block w-3.5 rounded-[1px]", y.finishers ? "bg-link" : "bg-border")}
                style={{ height }}
              />
              <span aria-hidden className="mt-1 text-[0.6875rem] text-fg-muted tabular">
                {String(y.year).slice(2)}
              </span>
            </>
          );
          return (
            <li key={y.year} className="flex">
              {y.id ? (
                <Link
                  href={`/events/${y.id}`}
                  title={label(y)}
                  aria-label={label(y)}
                  className="nav-link group flex h-12 w-[1.375rem] flex-col items-center justify-end hover:bg-transparent [&:hover>span:first-child]:bg-brand"
                >
                  {bar}
                </Link>
              ) : (
                <span title={label(y)} aria-label={label(y)} role="img" className="flex h-12 w-[1.375rem] flex-col items-center justify-end opacity-50">
                  {bar}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
