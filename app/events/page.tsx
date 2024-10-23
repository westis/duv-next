import { Suspense } from "react";
import DefaultLayout from "@/app/layouts/DefaultLayout";
import EventList from "@/components/EventList";
import { Event } from "@/lib/eventUtils";
import { getBaseUrl } from "@/lib/utils";

// This is for Incremental Static Regeneration
export const revalidate = 60; // Revalidate this page every 60 seconds

async function getInitialEvents(year: string): Promise<Event[]> {
  const params = new URLSearchParams({
    year,
    page: "1",
    perpage: "10",
    // Add other default filter parameters as needed
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
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Await the searchParams object
  const params = await searchParams;
  const year = typeof params.year === "string" ? params.year : "futur";
  const initialEvents = await getInitialEvents(year);
  const title = year === "futur" ? "Upcoming Events" : "Past Events";

  return (
    <DefaultLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        <Suspense fallback={<div>Loading events...</div>}>
          <EventList initialEvents={initialEvents} />
        </Suspense>
      </div>
    </DefaultLayout>
  );
}
