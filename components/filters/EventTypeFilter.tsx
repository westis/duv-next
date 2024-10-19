// components/filters/EventTypeFilter.tsx

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

interface EventTypeFilterProps {
  eventType: string;
  onEventTypeChange: (value: string) => void;
}

export function EventTypeFilter({
  eventType,
  onEventTypeChange,
}: EventTypeFilterProps) {
  return (
    <Select value={eventType} onValueChange={onEventTypeChange}>
      <SelectTrigger className="w-[180px] h-10 font-medium">
        <Filter className="mr-2 h-4 w-4" />
        <SelectValue placeholder="All Events" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Events</SelectItem>
        <SelectGroup>
          <SelectLabel>Fixed Distance</SelectLabel>
          <SelectItem value="1">45-79km</SelectItem>
          <SelectItem value="2">80-119km</SelectItem>
          <SelectItem value="4">120-179km</SelectItem>
          <SelectItem value="8">180km+</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Fixed Time</SelectLabel>
          <SelectItem value="6h">6 hours</SelectItem>
          <SelectItem value="12h">12 hours</SelectItem>
          <SelectItem value="24h">24 hours</SelectItem>
          <SelectItem value="48h">48 hours</SelectItem>
          <SelectItem value="72h">72 hours</SelectItem>
          <SelectItem value="6d">6 days</SelectItem>
          <SelectItem value="10d">10 days</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Special Formats</SelectLabel>
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
  );
}
