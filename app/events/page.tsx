import { Suspense } from "react";
import DefaultLayout from "@/app/layouts/DefaultLayout";
import EventList from "@/components/EventList";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const year = (params.year as string) || "futur";
  const title = year === "futur" ? "Upcoming Events" : "Past Events";

  return (
    <DefaultLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        <Suspense fallback={<div>Loading events...</div>}>
          <EventList />
        </Suspense>
      </div>
    </DefaultLayout>
  );
}
