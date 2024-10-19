import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";

interface DateRangeFilterProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function DateRangeFilter({
  dateRange,
  onDateRangeChange,
}: DateRangeFilterProps) {
  return (
    <DateRangePicker
      initialDateFrom={dateRange?.from}
      initialDateTo={dateRange?.to}
      onUpdate={onDateRangeChange}
    />
  );
}
