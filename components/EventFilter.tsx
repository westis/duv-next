// components/EventFilter.tsx

import React from "react";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { CountrySelectFilter } from "@/components/filters/CountrySelectFilter";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EventTypeFilter } from "@/components/filters/EventTypeFilter";
import { SortOrderFilter } from "@/components/filters/SortOrderFilter";

interface EventFilterProps {
  eventType: string;
  onEventTypeChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  country: string;
  onCountryChange: (value: string) => void;
  recordEligible: boolean;
  onRecordEligibleChange: (checked: boolean) => void;
  withoutResults: boolean;
  onWithoutResultsChange: (checked: boolean) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
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
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <EventTypeFilter
        eventType={eventType}
        onEventTypeChange={onEventTypeChange}
      />

      <div className="font-medium">
        <DateRangePicker
          initialDateFrom={dateRange?.from}
          initialDateTo={dateRange?.to}
          onUpdate={onDateRangeChange}
        />
      </div>

      <CountrySelectFilter
        country={country}
        onCountryChange={onCountryChange}
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
                onCheckedChange={onRecordEligibleChange}
              />
              <label htmlFor="record-eligible">Record Eligible</label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="without-results"
                checked={withoutResults}
                onCheckedChange={onWithoutResultsChange}
              />
              <label htmlFor="without-results">Without Results</label>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <SortOrderFilter
        sortOrder={sortOrder}
        onSortOrderChange={onSortOrderChange}
      />
    </div>
  );
}

EventFilter.displayName = "EventFilter";
