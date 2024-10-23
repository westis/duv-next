"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface RaceComparison {
  EvtID: string;
  EvtName: string;
  EvtCnt: string;
  [year: string]: string;
}

export default function RaceComparisonsTable({
  comparisons,
}: {
  comparisons: RaceComparison[];
}) {
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, [comparisons]);

  if (isLoading) {
    return <div>Loading race comparisons...</div>;
  }

  const toggleEvent = (eventId: string) => {
    setExpandedEvents((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  const getValidYears = (comparison: RaceComparison) => {
    return Object.entries(comparison)
      .filter(([key, value]) => !isNaN(Number(key)) && value !== "&nbsp;")
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year]) => year);
  };

  return (
    <div className="space-y-4">
      {comparisons.map((comparison) => {
        const validYears = getValidYears(comparison);
        return (
          <div
            key={comparison.EvtID}
            className="border rounded-lg overflow-hidden"
          >
            <div
              className="bg-gray-100 dark:bg-gray-800 p-4 flex justify-between items-center cursor-pointer"
              onClick={() => toggleEvent(comparison.EvtID)}
            >
              <h3 className="text-lg font-semibold">{comparison.EvtName}</h3>
              <div className="flex items-center space-x-4">
                <span>Participations: {comparison.EvtCnt}</span>
                <Button variant="ghost" size="sm">
                  {expandedEvents[comparison.EvtID] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {expandedEvents[comparison.EvtID] && validYears.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    {validYears.map((year) => (
                      <TableHead
                        key={year}
                        className="bg-primary text-primary-foreground"
                      >
                        {year}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    {validYears.map((year) => (
                      <TableCell key={year}>{comparison[year]}</TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>
        );
      })}
    </div>
  );
}
