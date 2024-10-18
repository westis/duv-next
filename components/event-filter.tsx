// components/event-filter.tsx
"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { CountryFilter } from "@/components/country-filter";

interface EventFilterProps {
  eventType: string;
  onEventTypeChange: string;
  dateRange: DateRange | undefined;
  onDateRangeChange: string;
  country: string;
  onCountryChange: string;
}

interface WindowWithHandlers extends Window {
  [key: string]:
    | ((value: string) => void)
    | ((range: DateRange | undefined) => void)
    | Window[keyof Window];
}

export function EventFilter({
  eventType,
  onEventTypeChange,
  dateRange,
  onDateRangeChange,
  country,
  onCountryChange,
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

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Event Type Filter */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-type">Event Type</Label>
        <Select value={eventType} onValueChange={handleEventTypeChange}>
          <SelectTrigger id="event-type" className="w-full sm:w-[180px]">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectGroup>
              <SelectLabel>Distance</SelectLabel>
              <SelectItem value="1">45-79km</SelectItem>
              <SelectItem value="2">80-119km</SelectItem>
              <SelectItem value="4">120-179km</SelectItem>
              <SelectItem value="8">180km+</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Duration</SelectLabel>
              <SelectItem value="6h">6 hours</SelectItem>
              <SelectItem value="12h">12 hours</SelectItem>
              <SelectItem value="24h">24 hours</SelectItem>
              <SelectItem value="48h">48 hours</SelectItem>
              <SelectItem value="72h">72 hours</SelectItem>
              <SelectItem value="6d">6 days</SelectItem>
              <SelectItem value="10d">10 days</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Event Type</SelectLabel>
              <SelectItem value="Backy">Backyard Ultra</SelectItem>
              <SelectItem value="Elim">Elimination Race</SelectItem>
              <SelectItem value="Stage">Stage Race</SelectItem>
              <SelectItem value="Walk">Walking</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Surface</SelectLabel>
              <SelectItem value="Trail">Trail</SelectItem>
              <SelectItem value="Road">Road</SelectItem>
              <SelectItem value="Track">Track</SelectItem>
              <SelectItem value="Indoor">Indoor</SelectItem>
            </SelectGroup>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date-range">Date Range</Label>
        <DateRangePicker
          initialDateFrom={dateRange?.from}
          initialDateTo={dateRange?.to}
          onUpdate={handleDateRangeChange}
        />
      </div>

      {/* Country Filter */}
      <CountryFilter country={country} onCountryChange={handleCountryChange} />
    </div>
  );
}

EventFilter.displayName = "EventFilter";
