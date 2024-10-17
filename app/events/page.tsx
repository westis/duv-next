import EventList from "@/components/event-list";

export default function EventsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const year = (searchParams.year as string) || "futur";
  const title = year === "futur" ? "Upcoming Events" : "Past Events";

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <EventList />
    </div>
  );
}
