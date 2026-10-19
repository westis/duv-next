import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDuvBaseUrl } from "@/lib/duv";
import { CourseCard, OrganizerCard } from "@/components/features/events/EventInfoCards";
import { WinnersTable } from "@/components/features/events/WinnersTable";
import { EventLinksCard, type OldSiteLink } from "@/components/features/events/EventLinksCard";
import { getLocale } from "next-intl/server";
import { resolveDuvLink } from "@/components/features/events/eventDetailUtils";
import { formatDateRange } from "@/lib/format";
import { loadRace } from "@/components/features/race/loadRace";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ eventId: string }>;
}

// Old-site pages that have no equivalent here yet
const oldSiteLinkLabels: Record<string, string> = {
  AllTimeLink: "All-time results of this event",
  MultFinishLink: "Multiple finishers",
  StartPosLink: "Start positions",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  try {
    const data = await loadRace(eventId);
    if (!data) return { title: "Event" };
    const event = data.raceDetails;
    const dates = formatDateRange(event.Startdate, await getLocale(), event.Enddate)?.text;
    const place = [event.City, event.CountryName || event.Country].filter(Boolean).join(", ");
    return {
      title: event.EventName,
      description: `${event.EventName}${dates ? `, ${dates}` : ""}${
        place ? ` in ${place}` : ""
      }: race information, organizer and winners of all editions.`,
    };
  } catch (error) {
    console.error("Error generating event metadata:", error);
    return { title: "Event" };
  }
}

/** Overview tab: race info, organiser, links and the latest editions. */
export default async function RaceOverviewPage({ params }: PageProps) {
  const { eventId } = await params;
  const data = await loadRace(eventId);
  if (!data) notFound();

  const event = data.raceDetails;
  const oldSiteLinks: OldSiteLink[] = Object.entries(data.LinkURLs ?? {}).flatMap(([key, link]) => {
    const label = oldSiteLinkLabels[key];
    const href = label && link ? resolveDuvLink(link, getDuvBaseUrl()) : null;
    return label && href ? [{ label, href }] : [];
  });

  // Shape of valuation entries is unknown (samples are empty); show their text
  const status = (data.valuation ?? [])
    .map((entry) =>
      Object.values(entry)
        .filter((v) => typeof v === "string" && v.trim() && !/^\d+$/.test(v))
        .join(" ")
    )
    .filter(Boolean)
    .join("; ");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <CourseCard event={event} status={status} />
        <OrganizerCard event={event} />
      </div>
      <WinnersTable winners={(data.winnerList ?? []).slice(0, 5)} currentEventId={event.EventID} />
      <EventLinksCard reports={data.raceReports ?? []} gpsTracks={data.gpsTracks ?? []} oldSiteLinks={oldSiteLinks} />
    </div>
  );
}
