import EventList from "@/components/EventList";
import { Event } from "@/lib/eventUtils";

export const revalidate = 60;

async function getInitialEvents(year: string): Promise<Event[]> {
  const url = `${
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  }/api/events?year=${year}&page=1&perpage=10`;
  console.log("Fetching events from:", url);

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error("Failed to fetch events. Status:", res.status);
      console.error("Response text:", await res.text());
      throw new Error(`Failed to fetch events. Status: ${res.status}`);
    }

    const data = await res.json();
    return data.events;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const year = typeof params.year === "string" ? params.year : "futur";

  let initialEvents: Event[] = [];
  try {
    initialEvents = await getInitialEvents(year);
  } catch (error) {
    console.error("Failed to get initial events:", error);
    // You might want to add some error handling UI here
  }

  const title = year === "futur" ? "Upcoming Events" : "Past Events";

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <EventList initialEvents={initialEvents} />
    </div>
  );
}
