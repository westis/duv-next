import { notFound, permanentRedirect } from "next/navigation";
import { loadRace } from "@/components/features/race/loadRace";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

/** Old results address: the Results tab is the race page itself. */
export default async function RaceResultsRedirect({ params }: PageProps) {
  const { eventId } = await params;
  const race = await loadRace(eventId);
  if (!race) notFound();
  permanentRedirect(`/events/${race.raceDetails.EventID}`);
}
