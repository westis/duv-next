import useSWR from "swr";
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

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

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

  const {
    data: eventsData,
    error: eventsError,
    mutate,
  } = useSWR(`/api/events?${params.toString()}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const { data: countriesData, error: countriesError } = useSWR(
    "/api/countries",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );

  const optimisticUpdate = (newFilters: Partial<Filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    const updatedParams = new URLSearchParams();

    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        if (
          key === "dateRange" &&
          value instanceof Object &&
          "from" in value &&
          "to" in value
        ) {
          updatedParams.set(
            "from",
            (value as DateRange).from?.toISOString().split("T")[0] || ""
          );
          updatedParams.set(
            "to",
            (value as DateRange).to?.toISOString().split("T")[0] || ""
          );
        } else if (key === "recordEligible" && value) {
          updatedParams.set("rproof", "1");
        } else if (key === "withoutResults" && value) {
          updatedParams.set("norslt", "1");
        } else {
          updatedParams.set(key, value.toString());
        }
      }
    });

    mutate(`/api/events?${updatedParams.toString()}`, {
      optimisticData: eventsData,
      revalidate: true,
    });
  };

  return {
    events: eventsData?.events as Event[],
    loading:
      (!eventsError && !eventsData) || (!countriesError && !countriesData),
    error: eventsError ? eventsError.message : null,
    totalPages: eventsData?.totalPages || 1,
    totalEvents: eventsData?.totalEvents || 0,
    countries: countriesData?.countries || [],
    optimisticUpdate,
  };
}
