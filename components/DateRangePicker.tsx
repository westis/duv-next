"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarIcon } from "@radix-ui/react-icons";
import {
  addMonths,
  addYears,
  format,
  subMonths,
  subYears,
  startOfYear,
  endOfYear,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { formatDateRange } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const t = useTranslations("dateRange");
  const locale = useLocale();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: initialDateFrom,
    to: initialDateTo,
  });
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempDateRange, setTempDateRange] = React.useState<
    DateRange | undefined
  >(dateRange);

  React.useEffect(() => {
    setDateRange({
      from: initialDateFrom,
      to: initialDateTo,
    });
    setTempDateRange({
      from: initialDateFrom,
      to: initialDateTo,
    });
  }, [initialDateFrom, initialDateTo]);

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

  // Back to the default view: every race from today on.
  const handleUpcoming = () => {
    setDateRange(undefined);
    setTempDateRange(undefined);
    onUpdate(undefined);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDateRange(dateRange);
    setIsOpen(false);
  };

  const handleQuickSelect = (value: string) => {
    const now = new Date();
    let from: Date, to: Date;
    switch (value) {
      case "lastYear":
        from = subYears(now, 1);
        to = now;
        break;
      case "nextYear":
        from = now;
        to = addYears(now, 1);
        break;
      case "lastMonth":
        from = subMonths(now, 1);
        to = now;
        break;
      case "nextMonth":
        from = now;
        to = addMonths(now, 1);
        break;
      default:
        // Handle year selection
        const year = parseInt(value, 10);
        if (!isNaN(year)) {
          from = startOfYear(new Date(year, 0, 1));
          to = endOfYear(new Date(year, 0, 1));
        } else {
          return;
        }
    }
    setTempDateRange({ from, to });
  };

  // Generate an array of the last 10 years and the next 5 years
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 33 }, (_, i) => currentYear - 30 + i);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className="w-[300px] max-w-full justify-start text-left font-medium"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              <span className="tabular-nums">
                {formatDateRange(
                  format(dateRange.from, "yyyy-MM-dd"),
                  locale,
                  dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined
                )?.text}
              </span>
            ) : (
              <span>{t("fromToday")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex flex-col sm:flex-row max-h-[80vh] overflow-auto">
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
                  aria-label={t("from")}
                  className="w-[130px] date-input-no-icon"
                />
                <span className="mx-2">{t("to")}</span>
                <Input
                  type="date"
                  value={
                    tempDateRange?.to
                      ? format(tempDateRange.to, "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) => handleInputChange("to", e.target.value)}
                  aria-label={t("until")}
                  className="w-[130px] date-input-no-icon"
                />
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={tempDateRange?.from}
                selected={tempDateRange}
                onSelect={handleDateChange}
                numberOfMonths={1}
                className="sm:hidden"
              />
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={tempDateRange?.from}
                selected={tempDateRange}
                onSelect={handleDateChange}
                numberOfMonths={2}
                className="hidden sm:block"
              />
            </div>
            <div className="p-3 border-l sm:border-t-0 border-t flex flex-col gap-2">
              <Button variant="outline" className="w-full" onClick={handleUpcoming}>
                {t("upcoming")}
              </Button>
              <Select onValueChange={handleQuickSelect}>
                <SelectTrigger aria-label={t("selectYear")}>
                  <SelectValue placeholder={t("selectYear")} />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="hidden sm:flex sm:flex-col sm:gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleQuickSelect("lastYear")}
                >
                  {t("lastYear")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleQuickSelect("nextYear")}
                >
                  {t("nextYear")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleQuickSelect("lastMonth")}
                >
                  {t("lastMonth")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleQuickSelect("nextMonth")}
                >
                  {t("nextMonth")}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end p-3 border-t sticky bottom-0 bg-background">
            <Button variant="outline" onClick={handleCancel} className="mr-2">
              {t("cancel")}
            </Button>
            <Button onClick={handleUpdate}>{t("apply")}</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
