import Link from "next/link";
import type { getTranslations } from "next-intl/server";
import { DateText, formatBirthDate, formatDate, formatDuration, formatPerformanceText, formatRunnerName, formatYear } from "@/lib/format";
import { discipline } from "@/lib/records/disciplines";
import { parseTimeValue } from "@/lib/records/perf";
import type { DisciplineKey, RecordScope } from "@/lib/records/types";
import { flagWords, type BoardCell, type MarkHolder } from "./cells";
import { MarkTag } from "./MarkTag";

export type RecordsT = Awaited<ReturnType<typeof getTranslations<"records">>>;

/** "319.614 km", "6:05:35", or "119 laps" for backyard. */
export function perfText(perf: string, dist: DisciplineKey, locale: string, t: RecordsT): string {
  if (dist === "backyard") {
    const laps = Number.parseInt(perf, 10);
    return Number.isFinite(laps) ? t("laps", { count: laps }) : perf;
  }
  if (discipline(dist).kind === "time") {
    // The IAU page writes some times with dots ("2.59.54"); multi-day times can carry days ("5d 12:00:00").
    const seconds = parseTimeValue(perf.trim().replace(/^(\d+)\.(\d\d)\.(\d\d)$/, "$1:$2:$3"));
    const text = seconds === null ? null : formatDuration(seconds);
    if (text) return text;
  }
  return formatPerformanceText(perf, locale);
}

export function holderName(h: Pick<MarkHolder, "first" | "last">, locale: string): string {
  return formatRunnerName({ first: h.first, last: h.last }, locale);
}

/** The runner's name, linked to the runner page when DUV knows the runner. */
export function HolderLink({ holder, locale, className }: { holder: MarkHolder; locale: string; className?: string }) {
  const name = holderName(holder, locale);
  if (!holder.personId) return <span className={className}>{name}</span>;
  return (
    <Link href={`/runners/${holder.personId}`} className={`text-fg no-underline hover:text-link hover:underline ${className ?? ""}`}>
      {name}
    </Link>
  );
}

/** WR, AR, NR, or WBP for the world's 6 days (the IAU's "world best performance"). */
export function kindOf(scope: RecordScope, dist: DisciplineKey): "WR" | "AR" | "NR" | "WBP" {
  if (scope === "world") return dist === "6d" ? "WBP" : "WR";
  return scope === "area" ? "AR" : "NR";
}

/**
 * The marker after a mark. `board` cells always get one; in the age table only
 * cells a body ratifies do, plus the class holding a national record.
 */
export function CellMarker({
  cell,
  t,
  locale,
  context,
  holds = false,
}: {
  cell: BoardCell;
  t: RecordsT;
  locale: string;
  context: "board" | "age";
  holds?: boolean;
}) {
  const kind = kindOf(cell.scope, cell.dist);
  const body = cell.body ?? "";
  const lines: string[] = [];
  let label = t(`kind.${kind}`);
  let variant: "solid" | "dashed" = "solid";

  switch (cell.status) {
    case "ratified":
      lines.push(t(cell.source === "ratified" ? "popRatifiedOnly" : "popRatified", { body }));
      break;
    case "pending":
      label = t("pending");
      variant = "dashed";
      lines.push(t("popPending", { body }));
      break;
    case "duvBest":
      label = t("best");
      variant = "dashed";
      lines.push(t("popDuvBest", { body }));
      break;
    case "unratified":
      // In the age table only the class holding the open record is marked.
      if (context === "age" && !holds) return null;
      if (cell.scope === "nation") {
        lines.push(t("popNation"));
      } else {
        label = t("best");
        variant = "dashed";
        lines.push(cell.scope === "area" && cell.dist !== "backyard" ? t("popArea") : t("popNone"));
      }
      break;
  }
  if (cell.previous) {
    lines.push(
      t("popPrevious", {
        perf: perfText(cell.previous.perf, cell.dist, locale, t),
        holder: holderName(cell.previous, locale),
        year: formatYear(cell.previous.date)?.text ?? "",
      })
    );
  }
  const updated = cell.sourceUpdated ? formatDate(cell.sourceUpdated, locale)?.text : null;
  if (cell.body && updated) lines.push(t("popSource", { body: cell.body, date: updated }));

  return (
    <MarkTag label={label} variant={variant}>
      <p className="font-semibold">{t(`kindName.${kind}`)}</p>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </MarkTag>
  );
}

/** "Verona (ITA)" from the IAU, "Kladno CZE" from DUV; linked to the race when DUV has it. */
export function PlaceLink({ cell, className }: { cell: BoardCell; className?: string }) {
  const place = [cell.place, cell.country].filter(Boolean).join(" ");
  if (!place) return null;
  if (!cell.eventId) return <span className={className}>{place}</span>;
  return (
    <Link href={`/events/${cell.eventId}`} title={cell.eventName || undefined} className={className}>
      {place}
    </Link>
  );
}

/** "split · track", for a mark set inside a longer race or on a track. */
export function flagText(cell: BoardCell, t: RecordsT): string {
  return flagWords(cell.flags)
    .map((w) => t(w))
    .join(" · ");
}

/** "born 02 MAY 1976"; nothing when DUV does not know the date. */
export function bornText(cell: BoardCell, locale: string, t: RecordsT): string | null {
  const born = formatBirthDate(cell.dob, locale);
  return born ? t("born", { date: born.text }) : null;
}

export function DateOf({ value, locale, variant = "day" }: { value: string | null; locale: string; variant?: "day" | "year" }) {
  if (!value) return null;
  return <DateText value={value} locale={locale} variant={variant} />;
}
