import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { MetaDot, OutLink, PageHeader, TagList } from "@/components/design";
import { toExternalUrl } from "@/components/features/events/eventDetailUtils";
import { COURSE_SEPARATOR, DateText, cleanDuv, formatClimb, formatStartTime, parseDuvDate } from "@/lib/format";
import { raceTags } from "@/lib/tags";
import type { LoadedRace } from "./loadRace";
import type { GenderLists, WinnerRow } from "./raceModel";

export interface RaceHeaderProps {
  race: LoadedRace;
  lists: GenderLists;
  parent: WinnerRow | null;
  /** This event is a classification (same distance) of the parent, not a split. */
  parentIsClassification: boolean;
  /** Other DUV events held the same day (another distance, a relay). */
  sameDay: WinnerRow[];
}

/** DUV's edition text ("12ème", "19^", "3.") as a number, or 0. */
function editionNumber(value: string | null | undefined): number {
  const n = Number.parseInt(cleanDuv(value), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * The top of the race page, kept short: championship kicker, serif name,
 * date, start and place, tags (length and climb together), one muted line of
 * key facts (race type, time limit, finishers women and men), the website,
 * and the other races of the same day. Everything else is on the Information tab.
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
    finishers > 0 &&
      (lists.W.length && lists.M.length
        ? t("finishersByGender", { count: finishers, women: lists.W.length, men: lists.M.length })
        : t("finishers", { count: finishers })),
  ].filter(Boolean) as string[];

  return (
    <PageHeader
      breadcrumb={[
        { label: t("breadcrumbRaces"), href: "/events" },
        ...(year ? [{ label: year, href: `/events?from=${year}-01-01&to=${year}-12-31` }] : []),
        { label: event.EventName },
      ]}
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
          {parent && (
            <p className="mt-2 text-sm">
              {t.rich(parentIsClassification ? "classificationOf" : "splitOf", {
                race: (chunks) => <Link href={`/events/${parent.EventID}`}>{chunks}</Link>,
                name: parent.EventName,
              })}
            </p>
          )}
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
    />
  );
}
