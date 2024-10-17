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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Label } from "@/components/ui/label";

interface EventFilterProps {
  eventType: string;
  onEventTypeChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function EventFilter({
  eventType,
  onEventTypeChange,
  dateRange,
  onDateRangeChange,
}: EventFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-type">Event Type</Label>
        <Select value={eventType} onValueChange={onEventTypeChange}>
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date-range">Date Range</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-range"
              variant={"outline"}
              className={cn(
                "w-full sm:w-[300px] justify-start text-left font-normal",
                !dateRange?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

EventFilter.displayName = "EventFilter";
