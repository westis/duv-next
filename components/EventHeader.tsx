import React from "react";
import {
  CalendarDays,
  MapPin,
  Users,
  Link as LinkIcon,
  RulerIcon,
  ClockIcon,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  mapEventType,
  getTypeColor,
  getDurationLengthColor,
  getSurfaceIcon,
  getEventTypeIcon,
  EventTypeInput,
  shouldShowDistanceOrDuration,
  shouldShowSurface,
} from "@/lib/eventUtils";

interface EventInfo {
  EvtName: string;
  EvtDate: string;
  City: string;
  Country: string;
  FinisherCnt: string;
  EvtDist: string;
  EvtType: string;
  RecordEligible: string;
  URL?: string;
  EvtDetailLink: string;
}

export function EventHeader({ eventInfo }: { eventInfo: EventInfo }) {
  const eventTypeInput: EventTypeInput = {
    EventType: eventInfo.EvtType,
    Length: eventInfo.EvtDist,
  };

  const eventType = mapEventType(eventTypeInput);
  const SurfaceIcon = getSurfaceIcon(eventType.surface);
  const EventTypeIcon = getEventTypeIcon(eventType);

  return (
    <Card className="mb-8">
      <CardHeader className="bg-yellow-500 text-black p-2 sm:p-3">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-center">
          {eventInfo.EvtName}
        </h1>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6 bg-white dark:bg-[#1c1c1c] text-black dark:text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span className="text-sm sm:text-base">{eventInfo.EvtDate}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {eventInfo.City}, {eventInfo.Country}
              </span>
            </div>
          </div>
          {eventInfo.URL && (
            <Link
              href={eventInfo.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-sm sm:text-base text-yellow-600 dark:text-yellow-500 hover:underline"
            >
              <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Official Race Website</span>
            </Link>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {shouldShowDistanceOrDuration(eventTypeInput) && (
            <Badge
              variant="secondary"
              className={`${getDurationLengthColor(
                eventTypeInput
              )} text-xs sm:text-sm px-2 py-1 rounded-full`}
            >
              {eventInfo.EvtDist ? (
                <RulerIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
              ) : (
                <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
              )}
              <span>{eventInfo.EvtDist}</span>
            </Badge>
          )}
          {shouldShowSurface(eventInfo.EvtType) && (
            <Badge
              variant="secondary"
              className={`${getTypeColor(
                eventInfo.EvtType
              )} text-xs sm:text-sm px-2 py-1 rounded-full`}
            >
              {SurfaceIcon && (
                <SurfaceIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
              )}
              <span>{eventType.surface}</span>
            </Badge>
          )}
          {EventTypeIcon && (
            <Badge
              variant="secondary"
              className={`${getTypeColor(
                eventInfo.EvtType
              )} text-xs sm:text-sm px-2 py-1 rounded-full`}
            >
              <EventTypeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
              <span>{eventType.type}</span>
            </Badge>
          )}
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            <span className="text-sm sm:text-base">
              Finishers: {eventInfo.FinisherCnt}
            </span>
          </div>
          <Badge
            variant={
              eventInfo.RecordEligible === "Yes" ? "secondary" : "destructive"
            }
            className={`text-xs sm:text-sm ${
              eventInfo.RecordEligible === "Yes"
                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
            }`}
          >
            {eventInfo.RecordEligible === "Yes"
              ? "Ranking Eligible"
              : "Not Ranking Eligible"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
