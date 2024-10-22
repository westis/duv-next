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
import { LayoutGrid, List, Rows, Table as TableIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { shouldShowSurface } from "@/lib/eventUtils";

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
  const [layout, setLayout] = useState<
    "large" | "normal" | "compact" | "table"
  >("normal");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

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

  const { events, loading, error, totalPages, totalEvents } =
    useEventsFetcher(filters);

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

  const toggleRowExpanded = useCallback((eventId: string) => {
    setExpandedRows((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
  }, []);

  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const isMediumScreen = useMediaQuery("(min-width: 768px)");
  const isMobileScreen = useMediaQuery("(max-width: 640px)");

  return (
    <div className="space-y-4">
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

        <ToggleGroup
          type="single"
          value={layout}
          onValueChange={(value) =>
            setLayout(value as "large" | "normal" | "compact" | "table")
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
          <ToggleGroupItem value="table" aria-label="Table layout">
            <TableIcon className="h-4 w-4" />
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
      ) : layout === "table" ? (
        <Table className="bg-background rounded border">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Distance/Duration</TableHead>
              <TableHead className="hidden md:table-cell">Surface</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="hidden lg:table-cell">Labels</TableHead>
              <TableHead>Results</TableHead>
              {(!isLargeScreen || !isMediumScreen) && (
                <TableHead>More</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const hasExpandableContent: boolean =
                !isLargeScreen &&
                ((!isMediumScreen && Boolean(event.City || event.Country)) ||
                  (!isMediumScreen && shouldShowSurface(event.EventType)) ||
                  (!isLargeScreen && ["G", "S", "B"].includes(event.IAULabel)));

              console.log(
                `Event ${event.EventID} expandable:`,
                hasExpandableContent,
                {
                  isLargeScreen,
                  isMediumScreen,
                  city: event.City,
                  country: event.Country,
                  showSurface: shouldShowSurface(event.EventType),
                  iauLabel: event.IAULabel,
                }
              );

              return (
                <EventCard
                  key={event.EventID}
                  event={event}
                  variant="table"
                  isExpanded={!!expandedRows[event.EventID]}
                  onToggleExpand={() => toggleRowExpanded(event.EventID)}
                  hasExpandableContent={hasExpandableContent}
                />
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div
          className={
            layout === "compact" ? "border rounded-lg divide-y" : "space-y-4"
          }
        >
          {events.map((event) => (
            <EventCard
              key={event.EventID}
              event={event}
              variant={layout}
              hasExpandableContent={false}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * eventsPerPage + 1}-
          {Math.min(currentPage * eventsPerPage, totalEvents)} of {totalEvents}{" "}
          events
        </div>

        <div className="sm:ml-auto">
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
              {isMobileScreen ? (
                // Simplified mobile pagination
                <>
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
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(Math.min(totalPages, currentPage + 1));
                      }}
                    >
                      {Math.min(totalPages, currentPage + 1)}
                    </PaginationLink>
                  </PaginationItem>
                  {currentPage < totalPages - 1 && <PaginationEllipsis />}
                </>
              ) : totalPages <= 7 ? (
                // Desktop pagination for 7 or fewer pages
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
                // Desktop pagination for more than 7 pages
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
                  {currentPage > 2 && (
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
                  {currentPage < totalPages - 1 && (
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
    </div>
  );
}
