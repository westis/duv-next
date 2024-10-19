// components/EventFilter.tsx

import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { CountrySelectFilter } from "@/components/filters/CountrySelectFilter";
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
  const handleEventTypeChange = (value: string) => {
    onEventTypeChange(value);
  };

  const handleCountryChange = (value: string) => {
    onCountryChange(value);
  };

  const handleRecordEligibleChange = (checked: boolean) => {
    onRecordEligibleChange(checked);
  };

  const handleWithoutResultsChange = (checked: boolean) => {
    onWithoutResultsChange(checked);
  };

  const handleSortOrderChange = () => {
    onSortOrderChange(sortOrder === "asc" ? "desc" : "asc");
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
          onUpdate={onDateRangeChange}
        />
      </div>

      <CountrySelectFilter
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
