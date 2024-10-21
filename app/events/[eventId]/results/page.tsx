import { Suspense } from "react";
import ResultsTable from "@/components/ResultsTable";

export default function EventResultsPage({
  params,
}: {
  params: { eventId: string };
}) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Event Results</h1>
      <Suspense fallback={<div>Loading results...</div>}>
        <ResultsTable eventId={params.eventId} />
      </Suspense>
    </div>
  );
}
