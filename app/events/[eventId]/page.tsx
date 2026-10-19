import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DuvApiError, getDuvBaseUrl, getEventDetail } from "@/lib/duv";
import { EventDetailHeader } from "@/components/features/events/EventDetailHeader";
import { CourseCard, OrganizerCard } from "@/components/features/events/EventInfoCards";
import { WinnersTable } from "@/components/features/events/WinnersTable";
import {
  EventLinksCard,
  type OldSiteLink,
} from "@/components/features/events/EventLinksCard";
import {
  blankEmptyFields,
  formatEventDates,
  resolveDuvLink,
} from "@/components/features/events/eventDetailUtils";

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

const loadEvent = cache(async (eventId: string) => {
  if (!/^\d+$/.test(eventId)) return null;
  let data;
  try {
    data = await getEventDetail({ event: eventId });
  } catch (error) {
    // DUV answers HTTP 404 for events it does not have or does not show
    if (error instanceof DuvApiError && error.status === 404) return null;
    throw error;
  }
  if (!data?.raceDetails?.EventID) return null;
  return {
    ...data,
    raceDetails: blankEmptyFields(data.raceDetails),
    winnerList: data.winnerList?.map(blankEmptyFields) ?? null,
    raceReports: data.raceReports?.map(blankEmptyFields) ?? null,
    gpsTracks: data.gpsTracks?.map(blankEmptyFields) ?? null,
    valuation: data.valuation?.map(blankEmptyFields) ?? null,
  };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  try {
    const data = await loadEvent(eventId);
    if (!data?.raceDetails) return { title: "Event" };
    const event = data.raceDetails;
    const place = [event.City, event.CountryName || event.Country].filter(Boolean).join(", ");
    return {
      title: event.EventName,
      description: `${event.EventName}, ${formatEventDates(event.Startdate, event.Enddate)}${
        place ? ` in ${place}` : ""
      }: race information, organizer and winners of all editions.`,
    };
  } catch (error) {
    console.error("Error generating event metadata:", error);
    return { title: "Event" };
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const { eventId } = await params;
  const data = await loadEvent(eventId);
  if (!data?.raceDetails) notFound();

  const event = data.raceDetails;
  const oldSiteLinks: OldSiteLink[] = Object.entries(data.LinkURLs ?? {}).flatMap(
    ([key, link]) => {
      const label = oldSiteLinkLabels[key];
      const href = label && link ? resolveDuvLink(link, getDuvBaseUrl()) : null;
      return label && href ? [{ label, href }] : [];
    }
  );

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
    <div className="container mx-auto px-4 py-8 space-y-6">
      <EventDetailHeader event={event} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CourseCard event={event} status={status} />
        <OrganizerCard event={event} />
      </div>
      <WinnersTable winners={data.winnerList ?? []} currentEventId={event.EventID} />
      <EventLinksCard
        reports={data.raceReports ?? []}
        gpsTracks={data.gpsTracks ?? []}
        oldSiteLinks={oldSiteLinks}
      />
    </div>
  );
}
