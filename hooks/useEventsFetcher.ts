//hooks/useEventsFetcher.ts

import { useState, useEffect, useRef } from "react";
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

  const previousFilters = useRef<Filters | null>(null);

  useEffect(() => {
    if (JSON.stringify(previousFilters.current) === JSON.stringify(filters)) {
      return;
    }
    previousFilters.current = { ...filters }; // Create a shallow copy

    const fetchEvents = async () => {
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
        if (!Array.isArray(data)) {
          throw new Error("Received data is not an array");
        }
        setEvents(data);
        const estimatedTotalEvents = data.length * 10;
        setTotalPages(Math.ceil(estimatedTotalEvents / eventsPerPage));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to load events: ${errorMessage}`);
        console.error("Error details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [
    filters,
    country,
    currentPage,
    dateRange,
    eventType,
    eventsPerPage,
    recordEligible,
    sortOrder,
    withoutResults,
  ]);

  return { events, loading, error, totalPages };
}
