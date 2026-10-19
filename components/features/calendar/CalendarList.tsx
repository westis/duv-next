"use client";

import { Fragment, useEffect, useState } from "react";
import { LayoutGrid, List, Rows, Table as TableIcon } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { shouldShowSurface } from "@/lib/eventUtils";
import type { CalendarRace } from "@/lib/duv/types";

type Layout = "table" | "large" | "normal" | "compact";
const LAYOUTS: Layout[] = ["table", "large", "normal", "compact"];
const LAYOUT_KEY = "duv.calendar.layout";

function monthLabel(race: CalendarRace) {
  const date = new Date(Number(race.Year), Number(race.Month) - 1, 1);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("en", { month: "long", year: "numeric" });
}

export function CalendarList({ races }: { races: CalendarRace[] }) {
  const [layout, setLayout] = useState<Layout>("table");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const isMediumScreen = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY) as Layout | null;
      if (saved && LAYOUTS.includes(saved)) setLayout(saved);
    } catch {
      // storage unavailable: keep the default
    }
  }, []);

  const changeLayout = (value: string) => {
    if (!LAYOUTS.includes(value as Layout)) return;
    setLayout(value as Layout);
    try {
      localStorage.setItem(LAYOUT_KEY, value);
    } catch {
      // ignore
    }
  };

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  // Month headings between rows, like the printed DUV calendar.
  const withMonths = races.map((race, i) => ({
    race,
    month:
      i === 0 || monthLabel(races[i - 1]) !== monthLabel(race)
        ? monthLabel(race)
        : null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ToggleGroup
          type="single"
          value={layout}
          onValueChange={changeLayout}
          aria-label="View layout"
        >
          <ToggleGroupItem value="table" aria-label="Table layout">
            <TableIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="large" aria-label="Large layout">
            <Rows className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="normal" aria-label="Normal layout">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="compact" aria-label="Compact layout">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {layout === "table" ? (
        <Table className="bg-background rounded border">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Distance/Duration</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="hidden lg:table-cell">Labels</TableHead>
              <TableHead>Results</TableHead>
              {!isLargeScreen && <TableHead>More</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {withMonths.map(({ race, month }) => {
              const hasExpandableContent =
                !isLargeScreen &&
                ((!isMediumScreen && Boolean(race.City || race.Country)) ||
                  (!isMediumScreen && shouldShowSurface(race.EventType)) ||
                  ["G", "S", "B"].includes(race.IAULabel));
              return (
                <Fragment key={race.EventID}>
                  {month && (
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell
                        colSpan={8}
                        className="py-2 text-sm font-semibold"
                      >
                        {month}
                      </TableCell>
                    </TableRow>
                  )}
                  <EventCard
                    event={race}
                    variant="table"
                    isExpanded={!!expandedRows[race.EventID]}
                    onToggleExpand={() => toggleRow(race.EventID)}
                    hasExpandableContent={hasExpandableContent}
                  />
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="space-y-4">
          {withMonths.map(({ race, month }) => (
            <Fragment key={race.EventID}>
              {month && <h2 className="pt-2 text-lg font-semibold">{month}</h2>}
              <EventCard event={race} variant={layout} />
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
