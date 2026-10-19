import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatLengthAndClimb, formatPerformanceText } from "@/lib/format";
import type { LedgerRow } from "./ledger";
import { Place } from "./Place";

export interface TrailResult {
  row: LedgerRow;
  year: string;
  /** From the race's details: Length and AltitudeDiff. */
  length?: string;
  climb?: string;
}

const VISIBLE = 8;

function TrailItem({ item }: { item: TrailResult }) {
  const locale = useLocale();
  const course = formatLengthAndClimb({ length: item.length || item.row.dist, climb: item.climb }, locale);
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 border-b border-hair py-2">
      <div className="min-w-0">
        <Link href={`/events/${item.row.id}/results`} className="font-medium text-link hover:underline">
          {item.row.name}
        </Link>
        <p className="text-xs text-fg-muted md:text-[0.8125rem]">
          <span className="tabular">{item.year}</span>
          {course && (
            <>
              {" · "}
              <span className="tabular">{course}</span>
            </>
          )}
        </p>
      </div>
      <div className="flex items-baseline gap-2 text-right whitespace-nowrap">
        <span className="text-sm">
          <Place row={item.row} compact />
        </span>
        <span className="font-semibold tabular">{formatPerformanceText(item.row.perf, locale)}</span>
      </div>
    </li>
  );
}

/**
 * Trail results have no standard-distance PB: each race stands on its own
 * course, so they are listed by race with length, climb, place and time,
 * newest first, next to the PB ladder.
 */
export function TrailRaces({ items, href }: { items: TrailResult[]; href: string }) {
  const t = useTranslations("runner.trail");
  if (!items.length) return null;
  const shown = items.slice(0, VISIBLE);
  const rest = items.slice(VISIBLE);
  return (
    <section aria-labelledby="trail-heading" className="mt-8">
      <h2 id="trail-heading" className="label-caps mb-1 text-fg-muted">
        {t("heading")} <span className="font-normal tracking-normal normal-case">{t("count", { count: items.length })}</span>
      </h2>
      <p className="mb-1 text-xs text-fg-muted">{t("note")}</p>
      <ul>
        {shown.map((item) => (
          <TrailItem key={item.row.id} item={item} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm text-link hover:underline md:min-h-9 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{t("more", { count: rest.length })}</span>
            <span className="hidden group-open:inline">{t("fewer")}</span>
          </summary>
          <ul>
            {rest.map((item) => (
              <TrailItem key={item.row.id} item={item} />
            ))}
          </ul>
        </details>
      )}
      <p className="mt-1 text-sm">
        <Link href={href} scroll={false} className="text-link hover:underline">
          {t("inHistory")}
        </Link>
      </p>
    </section>
  );
}
