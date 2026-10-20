import { notFound } from "next/navigation";
import { loadRace } from "@/components/features/race/loadRace";
import { RaceEditions } from "@/components/features/race/RaceSections";
import { raceFamily } from "@/components/features/race/raceModel";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ eventId: string }>;
}

/** The Editions tab: winners of every edition, and their marks over the years. */
export default async function RaceEditionsPage({ params }: PageProps) {
  const { eventId } = await params;
  const race = await loadRace(eventId);
  if (!race) notFound();
  const family = raceFamily(race.raceDetails, race.winnerList);
  return <RaceEditions race={race} editions={family.editions} />;
}
