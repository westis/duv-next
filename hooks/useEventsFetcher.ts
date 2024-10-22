//hooks/useEventsFetcher.ts

import { useState, useEffect, useRef, useCallback } from "react";
import { Event } from "@/lib/eventUtils";
import { DateRange } from "react-day-picker";

interface Filters {
  eventType: string;
  dateRange: DateRange | undefined;
  currentPage: number;
  eventsPerPage: number;
  country: string;
  recordEligible: boolean;
  withoutResults: boolean;
  sortOrder: string;
}

export function useEventsFetcher(filters: Filters) {
  const {
    eventType,
    dateRange,
    currentPage,
    eventsPerPage,
    country,
    recordEligible,
    withoutResults,
    sortOrder,
  } = filters;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  const [isPageChange, setIsPageChange] = useState(false);
  const previousEvents = useRef<Event[]>([]);
  const previousFilters = useRef<Filters | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("perpage", eventsPerPage.toString());
      params.set("page", currentPage.toString());
      params.set("order", sortOrder);

      if (eventType !== "all") params.set("dist", eventType);
      if (dateRange?.from && dateRange.to) {
        params.set("from", dateRange.from.toISOString().split("T")[0]);
        params.set("to", dateRange.to.toISOString().split("T")[0]);
      }
      if (country) params.set("country", country);
      if (recordEligible) params.set("rproof", "1");
      if (withoutResults) params.set("norslt", "1");

      const url = `/api/events?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data.events)) {
        throw new Error("Received data is not an array");
      }

      if (isPageChange) {
        // If it's a page change, update the events immediately
        setEvents(data.events);
      } else {
        // For other changes, keep the old data until new data is ready
        previousEvents.current = events;
        setEvents(data.events);
      }
      setTotalPages(data.totalPages);
      setTotalEvents(data.totalEvents);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to load events: ${errorMessage}`);
      console.error("Error details:", err);
    } finally {
      setLoading(false);
      setIsPageChange(false);
    }
  }, [
    eventType,
    dateRange,
    currentPage,
    eventsPerPage,
    country,
    recordEligible,
    withoutResults,
    sortOrder,
    isPageChange,
    events, // Add events to the dependency array
  ]);

  useEffect(() => {
    if (
      previousFilters.current &&
      JSON.stringify(previousFilters.current) === JSON.stringify(filters)
    ) {
      return;
    }

    // Check if only the page number has changed
    const onlyPageChanged =
      previousFilters.current &&
      Object.keys(filters).every((key) => {
        if (key === "currentPage") return true;
        return (
          previousFilters.current?.[key as keyof Filters] ===
          filters[key as keyof Filters]
        );
      });

    setIsPageChange(!!onlyPageChanged);
    previousFilters.current = { ...filters };

    fetchEvents();
  }, [filters, fetchEvents]);

  return {
    events: isPageChange ? previousEvents.current : events,
    loading,
    error,
    totalPages,
    totalEvents,
  };
}
