import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarRow, RunningState } from "./races";

export interface RunningRow {
  row: CalendarRow;
  state: RunningState;
}

const SHOWN = 5;
const inkLink = "text-fg no-underline hover:text-link hover:underline";

function DayCount({ state }: { state: RunningState }) {
  const t = useTranslations("calendar.running");
  return <>{state.day >= state.total ? t("lastDay") : t("dayOf", { day: state.day, total: state.total })}</>;
}

function Bar({ state }: { state: RunningState }) {
  return (
    <div aria-hidden className="h-1.5 bg-border">
      <div className="h-full bg-fg" style={{ width: `${Math.round(state.progress * 100)}%` }} />
    </div>
  );
}

function Format({ row }: { row: CalendarRow }) {
  const t = useTranslations("tags");
  const f = row.formats[0];
  return f.backyard ? <span className="text-fg-muted">{t("type.backyard")}</span> : <>{f.text}</>;
}

function Row({ item }: { item: RunningRow }) {
  const locale = useLocale();
  const { row, state } = item;
  return (
    <li className="border-b border-hair py-2 lg:grid lg:grid-cols-[9rem_minmax(0,1fr)_12rem_16rem_7rem] lg:items-center lg:gap-4">
      <span className="hidden text-end font-semibold whitespace-nowrap tabular lg:block">
        <Format row={row} />
      </span>
      <div className="flex items-baseline justify-between gap-2 lg:block">
        <Link href={`/events/${row.eventId}`} className={cn(inkLink, "font-medium")}>
          {row.name}
        </Link>
        <span className="label-caps text-fg-muted lg:hidden">{row.country}</span>
      </div>
      <span className="hidden text-fg-muted lg:inline">
        {row.city} <span className="label-caps">{row.country}</span>
      </span>
      <div className="mt-1.5 lg:mt-0">
        <Bar state={state} />
        <div className="mt-1 hidden justify-between text-xs text-fg-muted tabular lg:flex">
          <span>{formatDate(row.startdate, locale)?.text}</span>
          <span>{row.enddate ? formatDate(row.enddate, locale)?.text : ""}</span>
        </div>
      </div>
      <div className="mt-1 flex justify-between gap-2 text-xs text-fg-muted lg:mt-0 lg:block lg:text-end lg:text-sm">
        <span className="truncate lg:hidden">
          <span className="font-semibold text-fg tabular">
            <Format row={row} />
          </span>{" "}
          · {row.city}
        </span>
        <span className="shrink-0 tabular">
          <DayCount state={state} />
        </span>
      </div>
    </li>
  );
}

/**
 * Multi-day races that started before today and have not finished, above the
 * day list: a progress bar from start to end and "day 51 of 52".
 */
export function RunningNow({ items, today }: { items: RunningRow[]; today: string }) {
  const t = useTranslations("calendar.running");
  const locale = useLocale();
  if (!items.length) return null;
  const shown = items.slice(0, SHOWN);
  const rest = items.slice(SHOWN);
  return (
    <section aria-labelledby="running-now" className="mt-6 border-t-2 border-fg">
      <h2 id="running-now" className="mt-2 mb-1 flex flex-wrap items-baseline gap-x-2">
        <span aria-hidden className="size-2 self-center rounded-full bg-brand" />
        <span className="label-caps text-fg">{t("title")}</span>
        <span className="text-xs text-fg-muted">
          <span className="lg:hidden">{items.length}</span>
          <span className="hidden lg:inline">
            {t("subtitle", { count: items.length, date: formatDate(today, locale)?.text ?? today })}
          </span>
        </span>
      </h2>
      <ul>
        {shown.map((item) => (
          <Row key={item.row.key} item={item} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-link group-open:hidden md:min-h-9">
            {t("showMore", { count: rest.length })}
          </summary>
          <ul>
            {rest.map((item) => (
              <Row key={item.row.key} item={item} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
