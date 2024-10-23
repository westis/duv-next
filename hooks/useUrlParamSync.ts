// hooks/useUrlParamSync.ts

import { useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

export function useUrlParamSync(filters: Filters) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prevFiltersRef = useRef<Filters>();

  const updateUrl = useCallback(
    (newFilters: Filters) => {
      const params = new URLSearchParams();

      if (newFilters.dateRange?.from && newFilters.dateRange.to) {
        params.set(
          "from",
          newFilters.dateRange.from.toISOString().split("T")[0]
        );
        params.set("to", newFilters.dateRange.to.toISOString().split("T")[0]);
      } else {
        const yearParam = searchParams.get("year");
        if (yearParam) {
          params.set("year", yearParam);
        }
      }

      if (newFilters.eventType !== "all") {
        params.set("dist", newFilters.eventType);
      }

      if (newFilters.country) {
        params.set("country", newFilters.country);
      }

      if (newFilters.recordEligible) {
        params.set("rproof", "1");
      }

      if (newFilters.withoutResults) {
        params.set("norslt", "1");
      }

      params.set("page", newFilters.currentPage.toString());
      params.set("perpage", newFilters.eventsPerPage.toString());
      params.set("order", newFilters.sortOrder);

      const newSearchParams = params.toString();
      const currentSearchParams = searchParams.toString();

      if (newSearchParams !== currentSearchParams) {
        router.push(`/events?${newSearchParams}`, { scroll: false });
      }
    },
    [router, searchParams]
  );

  useEffect(() => {
    const hasFiltersChanged =
      JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);

    if (hasFiltersChanged) {
      const timeoutId = setTimeout(() => {
        updateUrl(filters);
      }, 300); // Debounce for 300ms

      prevFiltersRef.current = filters;

      return () => clearTimeout(timeoutId);
    }
  }, [filters, updateUrl]);
}
