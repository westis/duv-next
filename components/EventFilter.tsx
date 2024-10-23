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

interface Country {
  value: string;
  label: string;
}

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
  countries: Country[];
  isLoadingCountries: boolean;
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
  countries,
  isLoadingCountries,
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
        countries={countries}
        isLoading={isLoadingCountries}
      />

      <div className="flex items-center space-x-2">
        <Switch
          id="record-eligible"
          checked={recordEligible}
          onCheckedChange={onRecordEligibleChange}
        />
        <label
          htmlFor="record-eligible"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Record Eligible
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="without-results"
          checked={withoutResults}
          onCheckedChange={onWithoutResultsChange}
        />
        <label
          htmlFor="without-results"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Without Results
        </label>
      </div>

      <SortOrderFilter
        sortOrder={sortOrder}
        onSortOrderChange={onSortOrderChange}
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">More Filters</Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <h4 className="font-medium leading-none">Additional Filters</h4>
            <div className="grid gap-2">
              {/* Add more filters here if needed */}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
