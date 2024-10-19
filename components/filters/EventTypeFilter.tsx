// components/filters/EventTypeFilter.tsx

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        <SelectValue placeholder="All Events" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Events</SelectItem>
        {/* Add other event type options here */}
      </SelectContent>
    </Select>
  );
}
