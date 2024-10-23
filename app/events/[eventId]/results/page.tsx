import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventHeader } from "@/components/EventHeader";
import ResultsTable from "@/components/ResultsTable";

export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  params: Promise<{ eventId: string }>;
}

async function getEventResults(eventId: string) {
  const url = new URL(`/api/eventResults`, "http://localhost:3000");
  url.searchParams.set("eventId", eventId);
  console.log("Fetching event results from:", url.toString());

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error("Failed to fetch event results. Status:", res.status);
      console.error("Response text:", await res.text());
      throw new Error(`Failed to fetch event results. Status: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching event results:", error);
    throw error;
  }
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
