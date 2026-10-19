import { ExternalLink } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { MetaDot, PageHeader, StatStrip, StatTile, TagList } from "@/components/design";
import { toExternalUrl, parseWinner } from "@/components/features/events/eventDetailUtils";
import {
  COURSE_SEPARATOR,
  DateText,
  formatClimb,
  formatCount,
  formatPerformanceText,
  formatStartTime,
  parseDuvDate,
} from "@/lib/format";
import { raceTags } from "@/lib/tags";
import type { LoadedRace } from "./loadRace";

/** Header shared by every tab of the race page. */
export async function RaceHeader({ race }: { race: LoadedRace }) {
  const t = await getTranslations("race");
  const locale = await getLocale();
  const event = race.raceDetails;
  const start = parseDuvDate(event.Startdate);
  const end = parseDuvDate(event.Enddate);
  const startTime = formatStartTime(event.Startdate);
  const website = toExternalUrl(event.URL ?? "");
  const year = start?.start.slice(0, 4);

  const winners = race.winnerList ?? [];
  const thisEdition = winners.find((w) => w.EventID === event.EventID);
  const men = parseWinner(thisEdition?.Winner_M);
  const women = parseWinner(thisEdition?.Winner_W);
  const finishers = (Number(event.FinisherM) || 0) + (Number(event.FinisherW) || 0);
  const edition = Number.parseInt(event.Edition ?? "", 10);
  // Trail is first-class: the climb sits with the length ("117 km · 6 500 m+").
  const climb = formatClimb(event.AltitudeDiff, locale);
  const tags = raceTags(event, { rankingEligible: true }).map((tag) =>
    climb && tag.family === "distance" ? { ...tag, text: `${tag.text}${COURSE_SEPARATOR}${climb}` } : tag
  );

  return (
    <PageHeader
      breadcrumb={[
        { label: t("breadcrumbRaces"), href: "/events" },
        ...(year ? [{ label: year, href: `/events?from=${year}-01-01&to=${year}-12-31` }] : []),
        { label: event.EventName },
      ]}
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
              <span>{[event.City, event.Country].filter(Boolean).join(", ")}</span>
            </>
          )}
          {website && (
            <>
              <MetaDot />
              <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                {t("website")}
                <ExternalLink className="size-3.5" strokeWidth={1.75} aria-hidden />
              </a>
            </>
          )}
        </>
      }
      tags={<TagList tags={tags} />}
      facts={
        (finishers > 0 || men || women || winners.length > 1) && (
          <StatStrip>
            {finishers > 0 && <StatTile label={t("facts.finishers")} value={formatCount(finishers, locale)} />}
            {men?.performance && <StatTile label={t("facts.menWinner")} value={formatPerformanceText(men.performance, locale)} />}
            {women?.performance && <StatTile label={t("facts.womenWinner")} value={formatPerformanceText(women.performance, locale)} />}
            {winners.length > 1 && <StatTile label={t("facts.editions")} value={formatCount(winners.length, locale)} />}
          </StatStrip>
        )
      }
    />
  );
}
