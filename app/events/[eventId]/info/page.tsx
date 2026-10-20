import { notFound } from "next/navigation";
import { loadRace, loadRaceResults } from "@/components/features/race/loadRace";
import { RaceFacts } from "@/components/features/race/RaceSections";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ eventId: string }>;
}

/** The Information tab: course, organiser, contact, result source and links. */
export default async function RaceInfoPage({ params }: PageProps) {
  const { eventId } = await params;
  const race = await loadRace(eventId);
  if (!race) notFound();
  const results = await loadRaceResults(race.raceDetails.EventID);
  return <RaceFacts race={race} header={results.header} />;
}
