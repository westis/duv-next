import Link from "next/link";
import {
  BarChartIcon,
  CalendarDays,
  ClockIcon,
  Link as LinkIcon,
  MapPin,
  RulerIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { EventDetails } from "@/lib/duv";
import {
  getDurationLengthColor,
  getEventTypeColor,
  getEventTypeIcon,
  getEventTypeLabel,
  getSurfaceIcon,
  getTypeColor,
  iauLabelColors,
  mapEventType,
  shouldShowDistanceOrDuration,
  shouldShowSurface,
} from "@/lib/eventUtils";
import { formatEventDates, formatStartTime, toExternalUrl } from "./eventDetailUtils";

const iauLabelNames: Record<string, string> = {
  G: "IAU Gold Label",
  S: "IAU Silver Label",
  B: "IAU Bronze Label",
  T: "IAU Trail Label",
};

const resultsStatus: Record<string, string> = {
  C: "Results complete",
  P: "Results partial",
  S: "Results with splits",
  N: "No results yet",
};

export function hasResults(results: string) {
  return ["C", "P", "S"].includes(results);
}

export function EventDetailHeader({ event }: { event: EventDetails }) {
  const typeInput = { EventType: event.EventType, Length: event.Length, Duration: event.Duration };
  const eventType = mapEventType(typeInput);
  const SurfaceIcon = getSurfaceIcon(eventType.surface);
  const EventTypeIcon = getEventTypeIcon(eventType);
  const typeLabel = getEventTypeLabel(eventType);
  const startTime = formatStartTime(event.Startdate);
  const website = toExternalUrl(event.URL);
  const place = [event.City, event.CountryName || event.Country].filter(Boolean).join(", ");

  return (
    <Card>
      <CardHeader className="bg-yellow-500 text-black p-2 sm:p-3">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-center">
          {event.Edition && <span className="font-normal">{event.Edition} </span>}
          {event.EventName}
        </h1>
      </CardHeader>
      <CardContent className="p-4 sm:pt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            <span className="text-sm sm:text-base">
              {formatEventDates(event.Startdate, event.Enddate)}
              {startTime && <span className="text-muted-foreground"> · start {startTime}</span>}
            </span>
          </div>
          {place && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span className="text-sm sm:text-base text-muted-foreground">{place}</span>
            </div>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm sm:text-base text-yellow-600 dark:text-yellow-500 hover:underline sm:ml-auto"
            >
              <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Official race website</span>
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {shouldShowDistanceOrDuration(typeInput) && (
            <Badge
              variant="secondary"
              className={`${getDurationLengthColor(typeInput)} text-xs sm:text-sm px-2 py-1 rounded-full`}
            >
              {event.Length ? (
                <RulerIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
              ) : (
                <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
              )}
              <span>{event.Length || event.Duration}</span>
            </Badge>
          )}
          {shouldShowSurface(event.EventType) && (
            <Badge
              variant="secondary"
              className={`${getTypeColor(event.EventType)} text-xs sm:text-sm px-2 py-1 rounded-full`}
            >
              {SurfaceIcon && <SurfaceIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />}
              <span>{eventType.surface}</span>
            </Badge>
          )}
          {typeLabel && (
            <Badge
              variant="secondary"
              className={`${getEventTypeColor(eventType)} text-xs sm:text-sm px-2 py-1 rounded-full`}
            >
              {EventTypeIcon && <EventTypeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />}
              <span>{typeLabel}</span>
            </Badge>
          )}
          {iauLabelNames[event.IAULabel] && (
            <Badge
              className={`${iauLabelColors[event.IAULabel] ?? ""} text-xs sm:text-sm px-2 py-1 rounded-full`}
            >
              {iauLabelNames[event.IAULabel]}
            </Badge>
          )}
          <Badge
            variant="secondary"
            className={`text-xs sm:text-sm px-2 py-1 rounded-full ${
              event.RecordProof === "Y"
                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
            }`}
          >
            {event.RecordProof === "Y" ? "Ranking eligible" : "Not ranking eligible"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            {resultsStatus[event.Results] ?? ""}
          </span>
          {hasResults(event.Results) && (
            <Button size="sm" asChild>
              <Link href={`/events/${event.EventID}/results`}>
                <BarChartIcon className="h-4 w-4 mr-2" /> Results
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
