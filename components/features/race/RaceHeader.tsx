import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { MetaDot, OutLink, PageHeader, StatStrip, StatTile, TagList } from "@/components/design";
import { toExternalUrl } from "@/components/features/events/eventDetailUtils";
import {
  COURSE_SEPARATOR,
  DateText,
  cleanDuv,
  formatClimb,
  formatCount,
  formatRunnerName,
  formatStartTime,
  parseDuvDate,
} from "@/lib/format";
import { formatRaceLength, raceTags } from "@/lib/tags";
import type { LoadedRace } from "./loadRace";
import { resultKind, type Finisher, type Gender, type GenderLists, type WinnerRow } from "./raceModel";
import { resultText } from "./raceText";

export interface RaceHeaderProps {
  race: LoadedRace;
  lists: GenderLists;
  parent: WinnerRow | null;
  /** This event is a classification (same distance) of the parent, not a split. */
  parentIsClassification: boolean;
  /** Other DUV events held the same day (another distance, a relay). */
  sameDay: WinnerRow[];
}

/** "50 km", "6 h": the split's own distance or time. */
function sizeOf(e: { Length?: string | null; Duration?: string | null }): string {
  return formatRaceLength(cleanDuv(e.Duration) || cleanDuv(e.Length)) ?? "";
}

/** DUV's edition text ("12ème", "19^", "3.") as a number, or 0. */
function editionNumber(value: string | null | undefined): number {
  const n = Number.parseInt(cleanDuv(value), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * The top of the race page, kept short: championship kicker, the name, date,
 * start and place, tags (length and climb together), one muted line of key
 * facts (race type, time limit), the website, the other races of the same day,
 * and the podium strip (women's winner, men's winner, finishers). Everything
 * else is on the Information tab.
 */
export async function RaceHeader({ race, lists, parent, parentIsClassification, sameDay }: RaceHeaderProps) {
  const t = await getTranslations("race");
  const locale = await getLocale();
  const event = race.raceDetails;
  const start = parseDuvDate(event.Startdate);
  const end = parseDuvDate(event.Enddate);
  const startTime = formatStartTime(event.Startdate);
  const website = toExternalUrl(event.URL ?? "");
  const year = start?.start.slice(0, 4);
  const edition = editionNumber(event.Edition);
  // Trail is first-class: the climb sits with the length ("117 km · 6 500 m+").
  const climb = formatClimb(event.AltitudeDiff, locale);
  const tags = raceTags(event, { rankingEligible: true }).map((tag) =>
    climb && tag.family === "distance" ? { ...tag, text: `${tag.text}${COURSE_SEPARATOR}${climb}` } : tag
  );
  const kicker = ((race.valuation ?? []) as unknown[])
    .map((v) =>
      typeof v === "string"
        ? v
        : Object.values((v ?? {}) as Record<string, unknown>)
            .filter((x) => typeof x === "string")
            .join(" ")
    )
    .map((v) => cleanDuv(v))
    .filter(Boolean)
    .join(" · ");
  const finishers = lists.W.length + lists.M.length;
  const timeLimit = cleanDuv(event.TimeLimit);
  // DUV's race type adds to the tags only when it says more than the surface ("road race on a loop < 5km").
  const raceType = cleanDuv(event.RaceType);
  const facts = [
    !/^(road|trail|track|indoor)( race)?$/i.test(raceType) && raceType,
    timeLimit && t("timeLimit", { time: timeLimit }),
  ].filter(Boolean) as string[];

  // The podium strip: women's winner first (never men alone or first), then men's, then finishers.
  const kind = resultKind([...lists.W, ...lists.M]);
  const winnerTile = (g: Gender, f: Finisher | undefined) => {
    if (!f) return null;
    const r = f.row;
    const name = formatRunnerName({ first: r.FirstName, last: r.LastName }, locale) || r.AthleteName;
    const nat = r.Nationality?.trim();
    return (
      <StatTile
        key={g}
        label={t(`podium.${g}`)}
        value={
          <>
            {resultText(r.Performance, kind, f.value, locale)}
            {kind === "distance" && <span className="ms-1 text-[1.375rem] font-semibold">km</span>}
          </>
        }
        delta={
          <>
            <Link href={`/runners/${r.PersonID}`}>{name}</Link>
            {nat && <span className="text-fg-muted">{` · ${nat}`}</span>}
          </>
        }
      />
    );
  };
  const podium =
    finishers > 0 ? (
      <StatStrip>
        {winnerTile("W", lists.W[0])}
        {winnerTile("M", lists.M[0])}
        <StatTile
          label={t("podium.finishers")}
          value={formatCount(finishers, locale)}
          delta={
            lists.W.length && lists.M.length
              ? t("podium.byGender", {
                  women: formatCount(lists.W.length, locale) ?? "",
                  men: formatCount(lists.M.length, locale) ?? "",
                })
              : undefined
          }
        />
      </StatStrip>
    ) : undefined;

  return (
    <PageHeader
      breadcrumb={[
        { label: t("breadcrumbRaces"), href: "/events" },
        ...(year ? [{ label: year, href: `/events?from=${year}-01-01&to=${year}-12-31` }] : []),
        ...(parent ? [{ label: cleanDuv(parent.EventName), href: `/events/${parent.EventID}` }] : []),
        { label: event.EventName },
      ]}
      notice={
        parent && (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-s-2 border-brand bg-surface-muted px-3 py-2 text-sm">
            <span>
              {t.rich(parentIsClassification ? "classificationOf" : "splitOf", {
                strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
                size: sizeOf(event) || "none",
                name: cleanDuv(parent.EventName),
              })}
            </span>
            <Link href={`/events/${parent.EventID}`} className="font-medium">
              {t("backToRace")}
            </Link>
          </p>
        )
      }
      kicker={kicker || undefined}
      title={event.EventName}
      subtitle={edition > 0 ? t("editionOrdinal", { n: edition }) : undefined}
      meta={
        <>
          {start && <DateText value={start.start} end={end?.start} locale={locale} variant="range" />}
          {startTime && (
            <>
              <MetaDot />
              <span className="tabular">{startTime}</span>
            </>
          )}
          {(event.City || event.Country) && (
            <>
              <MetaDot />
              <span>{[cleanDuv(event.City), cleanDuv(event.Country)].filter(Boolean).join(", ")}</span>
            </>
          )}
          {website && (
            <>
              <MetaDot />
              <OutLink href={website}>{t("website")}</OutLink>
            </>
          )}
        </>
      }
      tags={
        <>
          <TagList tags={tags} />
          {facts.length > 0 && <p className="mt-2 text-sm text-fg-muted">{facts.join(COURSE_SEPARATOR)}</p>}
          {sameDay.length > 0 && (
            <p className="mt-2 text-sm">
              <span className="text-fg-muted">{t("sameDay")}: </span>
              {sameDay.map((s, i) => (
                <span key={s.EventID}>
                  {i > 0 && COURSE_SEPARATOR}
                  <Link href={`/events/${s.EventID}`}>{cleanDuv(s.EventName)}</Link>
                </span>
              ))}
            </p>
          )}
        </>
      }
      facts={podium}
    />
  );
}
