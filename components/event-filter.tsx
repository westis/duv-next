// components/event-filter.tsx
"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { CountryFilter } from "@/components/country-filter";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SortAsc, SortDesc, Filter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EventFilterProps {
  eventType: string;
  onEventTypeChange: string;
  dateRange: DateRange | undefined;
  onDateRangeChange: string;
  country: string;
  onCountryChange: string;
  recordEligible: boolean;
  onRecordEligibleChange: string;
  withoutResults: boolean;
  onWithoutResultsChange: string;
  sortOrder: string;
  onSortOrderChange: string;
}

interface WindowWithHandlers extends Window {
  [key: string]:
    | ((value: string) => void)
    | ((range: DateRange | undefined) => void)
    | ((checked: boolean) => void)
    | Window[keyof Window];
}

export function EventFilter({
  eventType,
  onEventTypeChange,
  dateRange,
  onDateRangeChange,
  country,
  onCountryChange,
  recordEligible,
  onRecordEligibleChange,
  withoutResults,
  onWithoutResultsChange,
  sortOrder,
  onSortOrderChange,
}: EventFilterProps) {
  const handleEventTypeChange = (value: string) => {
    if (typeof window !== "undefined") {
      (window as unknown as WindowWithHandlers)[onEventTypeChange](value);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (typeof window !== "undefined") {
      (window as unknown as WindowWithHandlers)[onDateRangeChange](range);
    }
  };

  const handleCountryChange = (value: string) => {
    if (typeof window !== "undefined") {
      (window as unknown as WindowWithHandlers)[onCountryChange](value);
    }
  };

  const handleRecordEligibleChange = (checked: boolean) => {
    if (typeof window !== "undefined") {
      (window as unknown as WindowWithHandlers)[onRecordEligibleChange](
        checked
      );
    }
  };

  const handleWithoutResultsChange = (checked: boolean) => {
    if (typeof window !== "undefined") {
      (window as unknown as WindowWithHandlers)[onWithoutResultsChange](
        checked
      );
    }
  };

  const handleSortOrderChange = () => {
    if (typeof window !== "undefined") {
      (window as unknown as WindowWithHandlers)[onSortOrderChange](
        sortOrder === "asc" ? "desc" : "asc"
      );
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <Select value={eventType} onValueChange={handleEventTypeChange}>
        <SelectTrigger className="w-[180px] h-10 font-medium">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="All Events" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Events</SelectItem>
          <SelectGroup>
            <SelectItem value="1">45-79km</SelectItem>
            <SelectItem value="2">80-119km</SelectItem>
            <SelectItem value="4">120-179km</SelectItem>
            <SelectItem value="8">180km+</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectItem value="6h">6 hours</SelectItem>
            <SelectItem value="12h">12 hours</SelectItem>
            <SelectItem value="24h">24 hours</SelectItem>
            <SelectItem value="48h">48 hours</SelectItem>
            <SelectItem value="72h">72 hours</SelectItem>
            <SelectItem value="6d">6 days</SelectItem>
            <SelectItem value="10d">10 days</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectItem value="Backy">Backyard Ultra</SelectItem>
            <SelectItem value="Elim">Elimination Race</SelectItem>
            <SelectItem value="Stage">Stage Race</SelectItem>
            <SelectItem value="Walk">Walking</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectItem value="Trail">Trail</SelectItem>
            <SelectItem value="Road">Road</SelectItem>
            <SelectItem value="Track">Track</SelectItem>
            <SelectItem value="Indoor">Indoor</SelectItem>
          </SelectGroup>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>

      <div className="font-medium">
        <DateRangePicker
          initialDateFrom={dateRange?.from}
          initialDateTo={dateRange?.to}
          onUpdate={handleDateRangeChange}
        />
      </div>

      <CountryFilter
        country={country}
        onCountryChange={handleCountryChange}
        placeholder="All Countries"
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-10">
            More Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px]">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="record-eligible"
                checked={recordEligible}
                onCheckedChange={handleRecordEligibleChange}
              />
              <span>Record Eligible</span>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="without-results"
                checked={withoutResults}
                onCheckedChange={handleWithoutResultsChange}
              />
              <span>Without Results</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10"
        onClick={handleSortOrderChange}
      >
        {sortOrder === "asc" ? (
          <SortAsc className="h-4 w-4" />
        ) : (
          <SortDesc className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

EventFilter.displayName = "EventFilter";
