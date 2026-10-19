import { Metadata } from "next";
import { notFound } from "next/navigation";
import { WinnersTable } from "@/components/features/events/WinnersTable";
import { loadRace } from "@/components/features/race/loadRace";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const data = await loadRace(eventId).catch(() => null);
  return { title: data ? `Editions · ${data.raceDetails.EventName}` : "Editions" };
}

/** Editions tab: every edition of this race with its winners. */
export default async function RaceEditionsPage({ params }: PageProps) {
  const { eventId } = await params;
  const data = await loadRace(eventId);
  if (!data) notFound();
  return <WinnersTable winners={data.winnerList ?? []} currentEventId={data.raceDetails.EventID} />;
}
