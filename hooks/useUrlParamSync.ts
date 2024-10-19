// hooks/useUrlParamSync.ts

import { useEffect } from "react";
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

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams();

    if (dateRange?.from && dateRange.to) {
      params.set("from", dateRange.from.toISOString().split("T")[0]);
      params.set("to", dateRange.to.toISOString().split("T")[0]);
    } else {
      const yearParam = searchParams.get("year");
      if (yearParam) {
        params.set("year", yearParam);
      }
    }

    if (eventType !== "all") {
      params.set("dist", eventType);
    }

    if (country) {
      params.set("country", country);
    }

    if (recordEligible) {
      params.set("rproof", "1");
    }

    if (withoutResults) {
      params.set("norslt", "1");
    }

    params.set("page", currentPage.toString());
    params.set("perpage", eventsPerPage.toString());
    params.set("order", sortOrder);

    const newSearchParams = params.toString();
    const currentSearchParams = searchParams.toString();

    if (newSearchParams !== currentSearchParams) {
      router.push(`/events?${newSearchParams}`, { scroll: false });
    }
  }, [
    eventType,
    dateRange,
    router,
    currentPage,
    eventsPerPage,
    country,
    recordEligible,
    withoutResults,
    sortOrder,
    searchParams,
  ]);
}
