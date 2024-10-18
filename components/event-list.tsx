"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  RulerIcon,
  ClockIcon,
  TimerIcon,
  InfoIcon,
  BarChartIcon,
  CircleIcon,
  HomeIcon,
  TreePineIcon,
  RouteIcon,
  FootprintsIcon,
} from "lucide-react";
import {
  Event,
  getTypeColor,
  getDurationLengthColor,
  iauLabelColors,
  mapEventType,
} from "@/lib/event-utils";
import { EventFilter } from "@/components/event-filter";
import { DateRange } from "react-day-picker";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WindowWithHandlers extends Window {
  handleEventTypeChange: (value: string) => void;
  handleDateRangeChange: (range: DateRange | undefined) => void;
}

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [eventType, setEventType] = useState(searchParams.get("dist") || "all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from && to) {
      return {
        from: new Date(from),
        to: new Date(to),
      };
    }
    return undefined;
  });

  const [currentPage, setCurrentPage] = useState(() => {
    return Number(searchParams.get("page")) || 1;
  });
  const [eventsPerPage, setEventsPerPage] = useState(() => {
    return Number(searchParams.get("perpage")) || 20;
  });
  const [totalPages, setTotalPages] = useState(1);

  const handleEventTypeChange = useCallback((value: string) => {
    setEventType(value);
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/events?`;
      const params = new URLSearchParams(searchParams);

      if (dateRange?.from && dateRange?.to) {
        params.set("from", dateRange.from.toISOString().split("T")[0]);
        params.set("to", dateRange.to.toISOString().split("T")[0]);
        params.set("order", "asc"); // You can change this to 'desc' if needed
      } else if (!params.has("year")) {
        params.set("year", "futur");
      }

      if (eventType !== "all") {
        params.set("dist", eventType);
      } else {
        params.delete("dist");
      }

      params.set("page", currentPage.toString());
      params.set("perpage", eventsPerPage.toString());

      url += params.toString();

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Received data is not an array");
      }
      setEvents(data);
      // For now, we'll set a placeholder value for totalEvents
      const estimatedTotalEvents = data.length * 10; // Assuming there are 10 times more events than what's returned
      setTotalPages(Math.ceil(estimatedTotalEvents / eventsPerPage));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to load events: ${errorMessage}`);
      console.error("Error details:", err);
    } finally {
      setLoading(false);
    }
  }, [searchParams, eventType, dateRange, currentPage, eventsPerPage]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (eventType !== "all") {
      params.set("dist", eventType);
    } else {
      params.delete("dist");
    }
    if (dateRange?.from && dateRange.to) {
      params.set("from", dateRange.from.toISOString().split("T")[0]);
      params.set("to", dateRange.to.toISOString().split("T")[0]);
    } else {
      params.delete("from");
      params.delete("to");
    }
    params.set("page", currentPage.toString());
    params.set("perpage", eventsPerPage.toString());
    router.push(`/events?${params.toString()}`, { scroll: false });
  }, [eventType, dateRange, router, searchParams, currentPage, eventsPerPage]);

  useEffect(() => {
    (window as unknown as WindowWithHandlers).handleEventTypeChange =
      handleEventTypeChange;
    (window as unknown as WindowWithHandlers).handleDateRangeChange =
      handleDateRangeChange;
  }, [handleEventTypeChange, handleDateRangeChange]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEventsPerPageChange = (value: string) => {
    setEventsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing events per page
  };

  return (
    <div className="space-y-4">
      <EventFilter
        eventType={eventType}
        onEventTypeChange="handleEventTypeChange"
        dateRange={dateRange}
        onDateRangeChange="handleDateRangeChange"
      />

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center">
          Loading events...
        </div>
      ) : error ? (
        <div className="min-h-[200px] flex items-center justify-center">
          Error: {error}
        </div>
      ) : events.length === 0 ? (
        <div className="min-h-[200px] flex items-center justify-center">
          No events found.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.EventID} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-48 p-4 bg-primary/10 flex flex-col items-center justify-center text-center dark:text-foreground">
                    <div className="text-base font-semibold mb-3">
                      {event.Startdate}
                    </div>
                    <div className="flex items-center text-sm">
                      {/* <MapPinIcon className="h-4 w-4 mr-2 text-accent flex-shrink-0" /> */}
                      <div>
                        <div className="font-medium text-xs sm:text-sm mb-1">
                          {event.City}
                        </div>
                        <div className="text-xs sm:text-sm opacity-80">
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
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
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
                          {getEventTypeIcon(mapEventType(event))}
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
                          {getSurfaceIcon(mapEventType(event).surface)}
                          <span>{mapEventType(event).surface}</span>
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
      )}

      <div className="flex justify-between items-center">
        <Select
          value={eventsPerPage.toString()}
          onValueChange={handleEventsPerPageChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Events per page" />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((value) => (
              <SelectItem key={value} value={value.toString()}>
                {value} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(Math.max(1, currentPage - 1));
                }}
                aria-disabled={currentPage === 1}
              />
            </PaginationItem>
            {totalPages <= 7 ? (
              [...Array(totalPages)].map((_, index) => (
                <PaginationItem key={index + 1}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(index + 1);
                    }}
                    isActive={currentPage === index + 1}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))
            ) : (
              <>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(1);
                    }}
                    isActive={currentPage === 1}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {currentPage > 3 && <PaginationEllipsis />}
                {currentPage === totalPages && (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(totalPages - 2);
                      }}
                    >
                      {totalPages - 2}
                    </PaginationLink>
                  </PaginationItem>
                )}
                {currentPage > 2 && currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                      }}
                    >
                      {currentPage - 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                {currentPage !== 1 && currentPage !== totalPages && (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage);
                      }}
                      isActive
                    >
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>
                )}
                {currentPage < totalPages - 1 && currentPage > 1 && (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage + 1);
                      }}
                    >
                      {currentPage + 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                {currentPage === 1 && (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(3);
                      }}
                    >
                      3
                    </PaginationLink>
                  </PaginationItem>
                )}
                {currentPage < totalPages - 2 && <PaginationEllipsis />}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(totalPages);
                    }}
                    isActive={currentPage === totalPages}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(Math.min(totalPages, currentPage + 1));
                }}
                aria-disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

function getEventTypeIcon(eventType: { type: string; surface: string }) {
  switch (eventType.type) {
    case "Backyard Ultra":
      return <TimerIcon className="h-3 w-3 mr-1 inline" />;
    case "Stage Race":
      return <RouteIcon className="h-3 w-3 mr-1 inline" />;
    case "Walking":
      return <FootprintsIcon className="h-3 w-3 mr-1 inline" />;
    default:
      return null;
  }
}

function getEventTypeLabel(eventType: { type: string; surface: string }) {
  return ["Backyard Ultra", "Stage Race", "Walking"].includes(eventType.type)
    ? eventType.type
    : "";
}

function getSurfaceIcon(surface: string) {
  switch (surface) {
    case "Road":
      return <RouteIcon className="h-3 w-3 mr-1 inline" />;
    case "Trail":
      return <TreePineIcon className="h-3 w-3 mr-1 inline" />;
    case "Track":
      return <CircleIcon className="h-3 w-3 mr-1 inline" />;
    case "Indoor":
      return <HomeIcon className="h-3 w-3 mr-1 inline" />;
    default:
      return null;
  }
}

function getSurfaceColor(surface: string) {
  switch (surface) {
    case "Road":
      return "bg-gray-200/50 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200";
    case "Trail":
      return "bg-green-200/50 text-green-800 dark:bg-green-800/50 dark:text-green-200";
    case "Track":
      return "bg-red-200/50 text-red-800 dark:bg-red-800/50 dark:text-red-200";
    case "Indoor":
      return "bg-purple-200/50 text-purple-800 dark:bg-purple-800/50 dark:text-purple-200";
    default:
      return "bg-neutral-200/50 text-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-200";
  }
}
