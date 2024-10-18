import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import {
  addDays,
  addMonths,
  addYears,
  format,
  subMonths,
  subYears,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export function DateRangePicker({
  className,
  align = "end",
  onUpdate,
  initialDateFrom,
  initialDateTo,
}: React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "center" | "end";
  onUpdate: (dateRange: DateRange | undefined) => void;
  initialDateFrom?: Date;
  initialDateTo?: Date;
}) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: initialDateFrom,
    to: initialDateTo,
  });
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempDateRange, setTempDateRange] = React.useState<
    DateRange | undefined
  >(dateRange);

  const handleDateChange = (newDateRange: DateRange | undefined) => {
    setTempDateRange(newDateRange);
  };

  const handleInputChange = (date: "from" | "to", value: string) => {
    const newDate = new Date(value);
    if (!isNaN(newDate.getTime())) {
      setTempDateRange((prev) => ({ ...prev, [date]: newDate } as DateRange));
    }
  };

  const handleUpdate = () => {
    setDateRange(tempDateRange);
    onUpdate(tempDateRange);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDateRange(dateRange);
    setIsOpen(false);
  };

  const handleQuickSelect = (range: DateRange) => {
    setTempDateRange(range);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-medium",
              !dateRange && "text-muted-foreground"
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
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex flex-col sm:flex-row">
            <div>
              <div className="flex items-center justify-between p-3 border-b">
                <Input
                  type="date"
                  value={
                    tempDateRange?.from
                      ? format(tempDateRange.from, "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) => handleInputChange("from", e.target.value)}
                  className="w-[130px] date-input-no-icon"
                />
                <span className="mx-2">to</span>
                <Input
                  type="date"
                  value={
                    tempDateRange?.to
                      ? format(tempDateRange.to, "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) => handleInputChange("to", e.target.value)}
                  className="w-[130px] date-input-no-icon"
                />
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={tempDateRange?.from}
                selected={tempDateRange}
                onSelect={handleDateChange}
                numberOfMonths={2}
              />
            </div>
            <div className="p-3 border-l sm:border-t-0 border-t flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  handleQuickSelect({
                    from: subYears(new Date(), 1),
                    to: new Date(),
                  })
                }
              >
                Last Year
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  handleQuickSelect({
                    from: new Date(),
                    to: addYears(new Date(), 1),
                  })
                }
              >
                Next Year
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  handleQuickSelect({
                    from: subMonths(new Date(), 1),
                    to: new Date(),
                  })
                }
              >
                Last Month
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  handleQuickSelect({
                    from: new Date(),
                    to: addMonths(new Date(), 1),
                  })
                }
              >
                Next Month
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-end p-3 border-t">
            <Button variant="outline" onClick={handleCancel} className="mr-2">
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
