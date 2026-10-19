import { notFound, permanentRedirect } from "next/navigation";
import { loadRace } from "@/components/features/race/loadRace";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

/** Old results tab: the race page is one long page now, so this sends links to its #results section. */
export default async function RaceResultsRedirect({ params }: PageProps) {
  const { eventId } = await params;
  const race = await loadRace(eventId);
  if (!race) notFound();
  permanentRedirect(`/events/${race.raceDetails.EventID}#results`);
}
