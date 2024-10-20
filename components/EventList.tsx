// components/EventList.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { DateRange } from "react-day-picker";
import { EventFilter } from "@/components/EventFilter";
import { EventCard } from "@/components/EventCard";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEventsFetcher } from "@/hooks/useEventsFetcher";
import { useUrlParamSync } from "@/hooks/useUrlParamSync";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List, Rows } from "lucide-react";

export default function EventList() {
  const searchParams = useSearchParams();

  const initialEventType = useCallback(
    () => searchParams.get("dist") || "all",
    [searchParams]
  );
  const initialDateRange = useCallback(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from && to) {
      return {
        from: new Date(from),
        to: new Date(to),
      };
    }
    return undefined;
  }, [searchParams]);
  const initialCurrentPage = useCallback(
    () => Number(searchParams.get("page")) || 1,
    [searchParams]
  );
  const initialEventsPerPage = useCallback(
    () => Number(searchParams.get("perpage")) || 20,
    [searchParams]
  );
  const initialCountry = useCallback(
    () => searchParams.get("country") || "",
    [searchParams]
  );
  const initialSortOrder = useCallback(
    () => searchParams.get("order") || "asc",
    [searchParams]
  );

  const [eventType, setEventType] = useState(initialEventType());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialDateRange()
  );
  const [currentPage, setCurrentPage] = useState(initialCurrentPage());
  const [eventsPerPage, setEventsPerPage] = useState(initialEventsPerPage());
  const [country, setCountry] = useState(initialCountry());
  const [recordEligible, setRecordEligible] = useState(false);
  const [withoutResults, setWithoutResults] = useState(false);
  const [sortOrder, setSortOrder] = useState(initialSortOrder());
  const [layout, setLayout] = useState<"large" | "normal" | "compact">(
    "normal"
  );

  const filters = {
    eventType,
    dateRange,
    currentPage,
    eventsPerPage,
    country,
    recordEligible,
    withoutResults,
    sortOrder,
  };

  const { events, loading, error, totalPages } = useEventsFetcher(filters);

  useUrlParamSync(filters);

  const handleEventTypeChange = useCallback((value: string) => {
    setEventType(value);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setCurrentPage(1);
  }, []);

  const handleCountryChange = useCallback((value: string) => {
    setCountry(value);
    setCurrentPage(1);
  }, []);

  const handleRecordEligibleChange = useCallback((checked: boolean) => {
    setRecordEligible(checked);
    setCurrentPage(1);
  }, []);

  const handleWithoutResultsChange = useCallback((checked: boolean) => {
    setWithoutResults(checked);
    setCurrentPage(1);
  }, []);

  const handleSortOrderChange = useCallback((value: string) => {
    setSortOrder(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEventsPerPageChange = (value: string) => {
    setEventsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <EventFilter
          eventType={eventType}
          onEventTypeChange={handleEventTypeChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          country={country}
          onCountryChange={handleCountryChange}
          recordEligible={recordEligible}
          onRecordEligibleChange={handleRecordEligibleChange}
          withoutResults={withoutResults}
          onWithoutResultsChange={handleWithoutResultsChange}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
        />
        <ToggleGroup
          type="single"
          value={layout}
          onValueChange={(value) =>
            setLayout(value as "large" | "normal" | "compact")
          }
        >
          <ToggleGroupItem value="large" aria-label="Large layout">
            <Rows className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="normal" aria-label="Normal layout">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="compact" aria-label="Compact layout">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

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
        <div
          className={
            layout === "compact" ? "border rounded-lg divide-y" : "space-y-4"
          }
        >
          {events.map((event) => (
            <EventCard key={event.EventID} event={event} variant={layout} />
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
