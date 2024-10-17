import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateInput } from "./date-input";

export function DateRangePicker({
  className,
  align = "center",
  dateRange,
  onUpdate,
}: React.HTMLAttributes<HTMLDivElement> & {
  align?: "center" | "start" | "end";
  dateRange: DateRange | undefined;
  onUpdate: (dateRange: DateRange | undefined) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
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
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onUpdate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <DateInput
            value={dateRange?.from}
            onChange={(date) =>
              onUpdate({
                from: date,
                to: dateRange?.to,
              })
            }
          />
          <DateInput
            value={dateRange?.to}
            onChange={(date) =>
              onUpdate({
                from: dateRange?.from,
                to: date,
              })
            }
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              const today = new Date();
              onUpdate({
                from: today,
                to: addDays(today, 7),
              });
              setIsOpen(false);
            }}
          >
            Next 7 Days
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              const today = new Date();
              onUpdate({
                from: addDays(today, -30),
                to: today,
              });
              setIsOpen(false);
            }}
          >
            Last 30 Days
          </Button>
        </div>
      </div>
    </div>
  );
}
