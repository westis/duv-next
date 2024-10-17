"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPinIcon,
  RulerIcon,
  ClockIcon,
  TimerIcon,
  InfoIcon,
  BarChartIcon,
} from "lucide-react";
import {
  Event,
  getTypeColor,
  getDurationLengthColor,
  iauLabelColors,
  mapEventType,
} from "@/lib/event-utils";

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const year = searchParams.get("year") || "futur";
        const response = await fetch(`/api/events?year=${year}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Received data is not an array");
        }
        setEvents(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to load events: ${errorMessage}`);
        console.error("Error details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [searchParams]);

  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error}</div>;
  if (events.length === 0) return <div>No events found.</div>;

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.EventID}>
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-40 p-4 bg-gray-50 flex flex-col justify-center items-start">
                <div className="text-base font-semibold text-gray-800">
                  {event.Startdate}
                </div>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {event.City}, {event.Country}
                </div>
              </div>
              <div className="flex-grow p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-800 mr-2">
                      {event.EventName}
                    </h3>
                    {["G", "S", "B"].includes(event.IAULabel) && (
                      <Badge
                        className={`${
                          iauLabelColors[event.IAULabel]
                        } text-xs px-2 py-1 rounded-full`}
                      >
                        IAU {event.IAULabel}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge
                    variant="secondary"
                    className={`${getDurationLengthColor(
                      event
                    )} text-xs px-2 py-1 rounded-full`}
                  >
                    {mapEventType(event).type === "Backyard Ultra" ||
                    mapEventType(event).type === "Elimination Race" ? (
                      <>
                        <TimerIcon className="h-3 w-3 mr-1 inline" />
                        <span>{mapEventType(event).type}</span>
                      </>
                    ) : (
                      <>
                        {event.Length ? (
                          <RulerIcon className="h-3 w-3 mr-1 inline" />
                        ) : (
                          <ClockIcon className="h-3 w-3 mr-1 inline" />
                        )}
                        <span>{event.Length || event.Duration}</span>
                      </>
                    )}
                  </Badge>
                  {(mapEventType(event).type === "Stage Race" ||
                    mapEventType(event).surface !== "Unknown") && (
                    <Badge
                      variant="secondary"
                      className={`${getTypeColor(
                        event.EventType
                      )} text-xs px-2 py-1 rounded-full`}
                    >
                      {mapEventType(event).type === "Stage Race"
                        ? "Stage Race"
                        : mapEventType(event).surface}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex sm:flex-col justify-end p-4 space-y-2 space-x-2 sm:space-x-0">
                <Button className="flex-1 sm:w-full" variant="outline">
                  <InfoIcon className="h-4 w-4 mr-2" />
                  Details
                </Button>
                <Button className="flex-1 sm:w-full">
                  <BarChartIcon className="h-4 w-4 mr-2" />
                  Results
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
