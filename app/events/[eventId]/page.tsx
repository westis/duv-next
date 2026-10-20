import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { loadRace, loadRaceResults } from "@/components/features/race/loadRace";
import { RaceResults } from "@/components/features/race/RaceResults";
import { raceMarkers } from "@/components/features/race/markers";
import { raceFamily, readFinisher, resultKind, splitByGender } from "@/components/features/race/raceModel";
import { resolveDuvLink } from "@/components/features/events/eventDetailUtils";
import { getDuvBaseUrl } from "@/lib/duv";
import { parseDuvDate } from "@/lib/format";
import { raceTypeOf } from "@/lib/tags";

export const revalidate = 3600;
/** A cold record cache (IAU, GOMU, DUV lists) can take a while; see `raceMarkers`. */
export const maxDuration = 60;

interface PageProps {
  params: Promise<{ eventId: string }>;
}

/** The Results tab: the women's and the men's list, with category, nation and name filters. */
export default async function RaceResultsPage({ params }: PageProps) {
  const { eventId } = await params;
  const race = await loadRace(eventId);
  if (!race) notFound();

  const t = await getTranslations("race");
  const locale = await getLocale();
  const event = race.raceDetails;
  const results = await loadRaceResults(event.EventID);
  const finishers = results.rows.map(readFinisher);
  const kind = resultKind(finishers);
  const lists = splitByGender(finishers);
  const family = raceFamily(event, race.winnerList);
  const date = parseDuvDate(event.Startdate)?.start ?? null;
  const markers = await raceMarkers(event.EventID, [...lists.W, ...lists.M], date, locale);
  const total = finishers.length;
  const duvTotal = Number.parseInt(results.header?.FinisherCnt ?? "", 10) || 0;
  const oldResults = race.LinkURLs?.ResultLink ? resolveDuvLink(race.LinkURLs.ResultLink, getDuvBaseUrl()) : null;

  if (total === 0) return <p className="mt-8 text-fg-muted">{t("results.none")}</p>;
  return (
    <RaceResults
      eventId={event.EventID}
      lists={lists}
      kind={kind}
      markers={markers}
      trail={raceTypeOf(event.EventType)?.surface === "trail"}
      classifications={family.classifications}
      truncated={
        results.truncated && oldResults ? { shown: total, total: Math.max(duvTotal, total), href: oldResults } : null
      }
    />
  );
}
