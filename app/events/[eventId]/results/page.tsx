"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useEventResults } from "@/hooks/useEventResults";
import { EventHeader } from "@/components/EventHeader";
import ResultsTable from "@/components/ResultsTable";

export default function EventPage({ params }: { params: { eventId: string } }) {
  const [activeTab, setActiveTab] = useState("results");
  const { eventInfo, loading, error } = useEventResults(params.eventId);

  if (loading) return <div>Loading event details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!eventInfo) return <div>No event information found.</div>;

  return (
    <div className="w-full max-w-full mx-auto px-4 py-8">
      <EventHeader eventInfo={eventInfo} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="results" className="text-lg font-semibold">
            Results
          </TabsTrigger>
          <TabsTrigger value="details" className="text-lg font-semibold">
            Event Details
          </TabsTrigger>
        </TabsList>
        <TabsContent value="results">
          <Card className="bg-card border-t-4 border-t-primary shadow-none">
            <CardContent className="pt-6">
              <ResultsTable eventId={params.eventId} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="details">
          <Card className="bg-card border-t-4 border-t-secondary">
            <CardContent className="space-y-4 pt-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Event Information
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Results Source: {eventInfo.Resultsource}</li>
                  <li>Recorded By: {eventInfo.RecordedBy}</li>
                  <li>Event Type: {eventInfo.EvtType}</li>
                  {eventInfo.AltitudeDiff && (
                    <li>Altitude Difference: {eventInfo.AltitudeDiff}</li>
                  )}
                </ul>
              </div>
              {/* Add more event details here as needed */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
