import { Suspense } from "react";
import EventList from "@/components/EventList";
import { Event } from "@/lib/eventUtils";
import { getBaseUrl } from "@/lib/utils";

export const revalidate = 60;

async function getInitialEvents(year: string): Promise<Event[]> {
  const params = new URLSearchParams({
    year,
    page: "1",
    perpage: "10",
  });

  const res = await fetch(`${getBaseUrl()}/api/events?${params.toString()}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch events");
  }

  const data = await res.json();
  return data.events;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await the searchParams
  const params = await searchParams;
  const year = typeof params.year === "string" ? params.year : "futur";
  const initialEvents = await getInitialEvents(year);
  const title = year === "futur" ? "Upcoming Events" : "Past Events";

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <Suspense fallback={<div>Loading events...</div>}>
        <EventList initialEvents={initialEvents} />
      </Suspense>
    </div>
  );
}
