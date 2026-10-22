import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  DateText,
  formatDistance,
  formatLaps,
  formatPerformanceText,
  formatRunnerName,
} from "@/lib/format";
import type { RankingEntry } from "@/lib/duv/types";
import { cn } from "@/lib/utils";
import {
  backyardLaps,
  formatGap,
  gapPercent,
  type GapScale,
  type ListKind,
  type RankRow,
} from "./rows";

type T = ReturnType<typeof useTranslations<"rankings">>;

interface ListProps {
  rows: RankRow[];
  kind: ListKind;
  scale: GapScale | null;
  caption: string;
}

function name(e: RankingEntry, locale: string) {
  return formatRunnerName({ first: e.FirstName, last: e.LastName }, locale);
}

function cat(e: RankingEntry) {
  const c = (e.CatInt ?? "").trim();
  return c && c !== "#NA" ? c : "";
}

const IAU = new Set(["G", "S", "B", "T"]);

/** The result: "6:09:25", "261.170" (km in the header), or backyard laps over their km. */
function Result({
  row,
  kind,
  locale,
  t,
  compact,
}: {
  row: RankRow;
  kind: ListKind;
  locale: string;
  t: T;
  compact?: boolean;
}) {
  const e = row.entry;
  if (kind === "backyard") {
    const laps = backyardLaps(e);
    const km = formatDistance(e.Distance, locale);
    return (
      <>
        {laps !== null ? (
          formatLaps(laps, locale)
        ) : (
          <span title={t("noLaps")}>{km?.number}</span>
        )}
        {laps !== null && km && !compact && (
          <span className="block text-xs font-normal text-fg-muted">
            {km.text}
          </span>
        )}
      </>
    );
  }
  if (row.result?.kind === "distance") {
    const km = formatDistance(row.result.value, locale);
    return (
      <>
        {km?.number}
        {compact ? (
          <span className="sr-only"> {km?.unit}</span>
        ) : (
          <span className="ms-1 text-xs font-normal text-fg-muted">
            {km?.unit}
          </span>
        )}
      </>
    );
  }
  return <>{formatPerformanceText(e.Perf, locale)}</>;
}

function GapBar({ row, scale }: { row: RankRow; scale: GapScale | null }) {
  if (row.gap === null || !scale)
    return <span className="inline-block w-24 xl:w-32" />;
  const pct = gapPercent(row.gap, scale);
  return (
    <span
      aria-hidden
      className="relative inline-block h-2.5 w-24 align-middle xl:w-32"
    >
      <span
        className="absolute start-0 top-1 h-0.5 bg-border"
        style={{ width: `${pct}%` }}
      />
      <span
        className="absolute top-px size-2 rounded-full bg-brand"
        style={{ insetInlineStart: `calc(${pct}% - 0.25rem)` }}
      />
    </span>
  );
}

/** "01", "12", "128": plain places get at least two digits (Swiss Grid ranks). */
function twoDigits(rank: string): string {
  const text = rank.trim();
  return /^\d+$/.test(text) ? text.padStart(2, "0") : text;
}

function Rank({ row, t }: { row: RankRow; t: T }) {
  if (!row.repeat) return <span className={cn(/^0*1$/.test(row.rank.trim()) && "text-brand-ink")}>{twoDigits(row.rank)}</span>;
  const n = row.rank.replace(/\D/g, "");
  return (
    <span className="text-fg-muted" title={t("repeat", { n })}>
      <span aria-hidden>{row.rank}</span>
      <span className="sr-only">{t("repeat", { n })}</span>
    </span>
  );
}

/** Folded performances named in a row; the rest are counted. */
const ALSO_SHOWN = 2;

function Also({ row, locale, t }: { row: RankRow; locale: string; t: T }) {
  if (!row.also.length) return null;
  return (
    <span className="block text-xs text-fg-muted" title={t("alsoLabel")}>
      {t("also")}{" "}
      {row.also.slice(0, ALSO_SHOWN).map((e, i) => (
        <span key={e.PerfID}>
          {i > 0 && ", "}
          <Link href={`/events/${e.EventID}`} className="tabular">
            {formatPerformanceText(e.Perf, locale)}
          </Link>
        </span>
      ))}
      {row.also.length > ALSO_SHOWN && (
        <> {t("alsoMore", { count: row.also.length - ALSO_SHOWN })}</>
      )}
    </span>
  );
}

function gapText(row: RankRow, locale: string, t: T, withUnit: boolean) {
  if (!row.result || row.gap === null) return "";
  const text = formatGap(row.gap, row.result.kind, locale);
  // Read aloud without the sign: "4 laps behind the leader".
  return text && withUnit
    ? spoken(text.replace(/^[+\u2212]/, ""), row, locale, t)
    : text;
}

function spoken(text: string, row: RankRow, locale: string, t: T) {
  if (!row.result || row.gap === null) return text;
  if (row.result.kind === "laps")
    return `${text} ${t("lapsUnit", { count: row.gap })}`;
  if (row.result.kind === "distance")
    return `${text} ${formatDistance(row.gap, locale)?.unit ?? ""}`;
  return text;
}

const th =
  "label-caps border-b-[length:var(--rule-mid)] border-fg px-2 py-2 text-start text-fg first:ps-0 last:pe-0 lg:px-3";
const td =
  "border-b border-border px-2 py-2 align-baseline first:ps-0 last:pe-0 lg:px-3";

/**
 * The ranking, result first: rank, result, gap to the leader (bar and figure),
 * then runner, age group, race and date. A table from md, a two-line list on phones.
 */
export function RankingList({ rows, kind, scale, caption }: ListProps) {
  const t = useTranslations("rankings");
  const tags = useTranslations("tags");
  const locale = useLocale();
  const backyard = kind === "backyard";
  const distanceList =
    rows.some((r) => r.result?.kind === "distance") && !backyard;
  const resultHead = backyard
    ? t("laps")
    : distanceList
      ? t("distance")
      : t("result");
  const gapKind = rows.find((r) => r.result)?.result?.kind ?? "time";
  const axis = scale
    ? [scale.lo, (scale.lo + scale.hi) / 2, scale.hi].map((g) =>
        g === 0
          ? "0"
          : formatGap(gapKind === "laps" ? Math.round(g) : g, gapKind, locale),
      )
    : null;

  return (
    <>
      {/* Scrolls inside its own box rather than widening the page if a row is ever too long. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm lg:text-[0.9375rem]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className={cn(th, "w-10 text-end")}>
                <abbr title={t("rank")} className="no-underline">
                  #
                </abbr>
              </th>
              <th scope="col" className={cn(th, "text-end")}>
                {resultHead}
              </th>
              <th scope="col" className={th}>
                {backyard ? t("lapsBehind") : t("behind")}
                {axis && (
                  <span
                    aria-hidden
                    className="mt-1 flex w-24 justify-between font-normal tracking-normal normal-case tabular xl:w-32"
                  >
                    {axis.map((a, i) => (
                      <span key={i}>{a}</span>
                    ))}
                  </span>
                )}
              </th>
              <th scope="col" className={th}>
                {t("runner")}
              </th>
              <th scope="col" className={th}>
                {t("cat")}
              </th>
              <th scope="col" className={th}>
                {t("race")}
              </th>
              <th scope="col" className={cn(th, "text-end")}>
                {t("date")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const e = row.entry;
              const gap = gapText(row, locale, t, false);
              const c = cat(e);
              const iau = (e.IAULabel ?? "").trim().toUpperCase();
              return (
                <tr key={e.PerfID}>
                  <td className={cn(td, "text-end font-display text-[1.375rem] leading-none font-extrabold tabular")}>
                    <Rank row={row} t={t} />
                  </td>
                  <td
                    className={cn(
                      td,
                      "text-end text-base font-semibold whitespace-nowrap tabular",
                      row.repeat && "font-normal",
                    )}
                  >
                    <Result row={row} kind={kind} locale={locale} t={t} />
                  </td>
                  <td className={cn(td, "whitespace-nowrap")}>
                    <GapBar row={row} scale={scale} />
                    {gap && (
                      <span className="ms-2 text-xs text-fg-muted tabular">
                        <span aria-hidden>{gap}</span>
                        <span className="sr-only">
                          {t("behindLeader", {
                            gap: gapText(row, locale, t, true),
                          })}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className={td}>
                    <Link
                      href={`/runners/${e.PersonID}`}
                      title={e.OrigName || undefined}
                      className="font-medium"
                    >
                      {name(e, locale)}
                    </Link>{" "}
                    <span className="text-xs text-fg-muted tabular">
                      {e.Nationality}
                    </span>
                    <Also row={row} locale={locale} t={t} />
                  </td>
                  <td className={cn(td, "whitespace-nowrap tabular")}>
                    {c && (
                      <>
                        {c}
                        <span className="text-fg-muted"> {e.CatRank}</span>
                      </>
                    )}
                  </td>
                  <td className={cn(td, "whitespace-nowrap")}>
                    <Link
                      href={`/events/${e.EventID}`}
                      title={e.City}
                      className="inline-block max-w-28 truncate align-bottom xl:max-w-36"
                    >
                      {e.City}
                    </Link>{" "}
                    <span className="text-xs text-fg-muted">{e.Country}</span>
                    {IAU.has(iau) && (
                      <span className="ms-1.5 hidden text-xs text-fg-muted 2xl:inline">
                        {tags(`iau.${iau as "G" | "S" | "B" | "T"}`)}
                      </span>
                    )}
                  </td>
                  <td
                    className={cn(
                      td,
                      "text-end whitespace-nowrap text-fg-muted",
                    )}
                  >
                    <DateText
                      value={e.EvtdateShort || e.EvtdateShortIso}
                      locale={locale}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ol className="md:hidden" aria-label={caption}>
        {rows.map((row) => {
          const e = row.entry;
          const c = cat(e);
          // No column header on phones: name the laps ("−4 laps").
          const bare = gapText(row, locale, t, false);
          const gap =
            bare && row.result?.kind === "laps"
              ? `${bare} ${t("lapsUnit", { count: row.gap ?? 0 })}`
              : bare;
          return (
            <li
              key={e.PerfID}
              className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-baseline gap-x-2 border-b border-border py-2"
            >
              <span className="text-end font-display text-lg leading-none font-extrabold tabular">
                <Rank row={row} t={t} />
              </span>
              <div className="min-w-0">
                <div className="flex min-w-0 items-baseline gap-2">
                  <b
                    className={cn(
                      "shrink-0 text-[0.9375rem] tabular",
                      row.repeat ? "font-normal" : "font-semibold",
                    )}
                  >
                    <Result
                      row={row}
                      kind={kind}
                      locale={locale}
                      t={t}
                      compact
                    />
                  </b>
                  <Link
                    href={`/runners/${e.PersonID}`}
                    className="truncate font-medium"
                  >
                    {name(e, locale)}
                  </Link>
                </div>
                <p className="truncate text-xs text-fg-muted">
                  {[e.Nationality, c && `${c} ${e.CatRank}`, e.City]
                    .filter(Boolean)
                    .join(" · ")}
                  {" · "}
                  <DateText
                    value={e.EvtdateShort || e.EvtdateShortIso}
                    locale={locale}
                  />
                </p>
              </div>
              <span className="text-xs text-fg-muted tabular">
                {gap && (
                  <>
                    <span aria-hidden>{gap}</span>
                    <span className="sr-only">
                      {t("behindLeader", {
                        gap: gapText(row, locale, t, true),
                      })}
                    </span>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
}
