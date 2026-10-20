import { notFound } from "next/navigation";
import { loadRace } from "@/components/features/race/loadRace";
import { RaceSplits } from "@/components/features/race/RaceSections";
import { raceFamily } from "@/components/features/race/raceModel";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ eventId: string }>;
}

/** The Splits tab: the leaders at each split DUV keeps as its own event. */
export default async function RaceSplitsPage({ params }: PageProps) {
  const { eventId } = await params;
  const race = await loadRace(eventId);
  if (!race) notFound();
  const event = race.raceDetails;
  const family = raceFamily(event, race.winnerList);
  if (!family.splits.length) notFound();
  return <RaceSplits splits={family.splits} self={race.winnerList.find((w) => w.EventID === event.EventID)} />;
}
