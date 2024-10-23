import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventHeader } from "@/components/EventHeader";
import ResultsTable from "@/components/ResultsTable";

export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  params: Promise<{ eventId: string }>;
}

async function getEventResults(eventId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/eventResults?eventId=${eventId}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("Failed to fetch event results");
  return res.json();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  try {
    const { eventInfo } = await getEventResults(eventId);
    return {
      title: `Results - ${eventInfo.EvtName}`,
      description: `Results for ${eventInfo.EvtName} held on ${eventInfo.EvtDate} in ${eventInfo.City}, ${eventInfo.Country}`,
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Event Results",
      description: "View the results for this ultramarathon event.",
    };
  }
}

export default async function EventResultsPage({ params }: PageProps) {
  const { eventId } = await params;

  try {
    const { eventInfo } = await getEventResults(eventId);

    return (
      <div className="container mx-auto px-4 py-8">
        <EventHeader eventInfo={eventInfo} />
        <ResultsTable eventId={eventId} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching event results:", error);
    notFound();
  }
}
