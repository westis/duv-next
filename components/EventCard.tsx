import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RulerIcon, ClockIcon, InfoIcon, BarChartIcon } from "lucide-react";
import {
  Event,
  getTypeColor,
  getDurationLengthColor,
  iauLabelColors,
  mapEventType,
  getEventTypeIcon,
  getEventTypeLabel,
  getSurfaceIcon,
  getSurfaceColor,
} from "@/lib/event-utils";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const EventTypeIcon = getEventTypeIcon(mapEventType(event));
  const SurfaceIcon = getSurfaceIcon(mapEventType(event).surface);

  return (
    <Card key={event.EventID} className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-48 p-4 bg-primary/10 flex flex-row sm:flex-col items-center justify-between sm:justify-center text-center dark:text-foreground">
            <div className="w-1/3 sm:w-full text-base font-semibold sm:mb-3">
              {event.Startdate}
            </div>
            <div className="w-2/3 sm:w-full flex items-center text-sm">
              <div className="w-full">
                <div className="font-medium text-xs sm:text-sm sm:mb-1">
                  {event.City}
                  <span className="sm:hidden">, {event.Country}</span>
                </div>
                <div className="text-xs sm:text-sm opacity-80 hidden sm:block">
                  {event.Country}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-grow p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center flex-wrap">
                <h3 className="text-lg font-semibold text-foreground mr-2 mb-1">
                  {event.EventName}
                </h3>
                {["G", "S", "B"].includes(event.IAULabel) && (
                  <Badge
                    className={`${
                      iauLabelColors[event.IAULabel]
                    } text-xs px-2 py-1 rounded-full mb-1`}
                  >
                    IAU {event.IAULabel}
                  </Badge>
                )}
                {event.Results === "O" && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-200 text-yellow-800 ml-2"
                  >
                    Postponed
                  </Badge>
                )}
                {event.Results === "R" && (
                  <Badge
                    variant="secondary"
                    className="bg-red-200 text-red-800 ml-2"
                  >
                    Cancelled
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 ">
              {mapEventType(event).type !== "Backyard Ultra" && (
                <Badge
                  variant="secondary"
                  className={`${getDurationLengthColor(
                    event
                  )} text-xs px-2 py-1 rounded-full`}
                >
                  {event.Length ? (
                    <RulerIcon className="h-3 w-3 mr-1 inline" />
                  ) : (
                    <ClockIcon className="h-3 w-3 mr-1 inline" />
                  )}
                  <span>{event.Length || event.Duration}</span>
                </Badge>
              )}
              {getEventTypeLabel(mapEventType(event)) && (
                <Badge
                  variant="secondary"
                  className={`${getTypeColor(
                    event.EventType
                  )} text-xs px-2 py-1 rounded-full`}
                >
                  {EventTypeIcon && (
                    <EventTypeIcon className="h-3 w-3 mr-1 inline" />
                  )}
                  <span>{getEventTypeLabel(mapEventType(event))}</span>
                </Badge>
              )}
              {mapEventType(event).surface !== "Unknown" && (
                <Badge
                  variant="secondary"
                  className={`${getSurfaceColor(
                    mapEventType(event).surface
                  )} text-xs px-2 py-1 rounded-full`}
                >
                  {SurfaceIcon && (
                    <SurfaceIcon className="h-3 w-3 mr-1 inline" />
                  )}
                  <span>{mapEventType(event).surface}</span>
                </Badge>
              )}
            </div>
          </div>
          <div className="flex sm:flex-col justify-end p-4 space-x-2 sm:space-x-0 sm:space-y-2">
            <Button className="flex-1 sm:w-full" variant="outline">
              <InfoIcon className="h-4 w-4 mr-2" />
              Details
            </Button>
            {["C", "P", "S"].includes(event.Results) && (
              <Button className="flex-1 sm:w-full">
                <BarChartIcon className="h-4 w-4 mr-2" />
                Results
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
