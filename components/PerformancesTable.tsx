"use client";

import React, { useState } from "react";
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

interface Performance {
  EvtDate: string;
  EvtName: string;
  EvtDist: string;
  Perf: string;
  RankOverall: string;
  Gender: string;
  RankMW: string;
  Cat: string;
  RankCat: string;
}

interface YearPerformances {
  Year: string;
  EvtCnt: string;
  KmSum: string;
  PerfsPerYear: Performance[];
}

export default function PerformancesTable({
  performances,
}: {
  performances: YearPerformances[];
}) {
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>(
    {}
  );

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  return (
    <div className="space-y-4">
      {performances.map((yearPerf) => (
        <div key={yearPerf.Year} className="border rounded-lg overflow-hidden">
          <div
            className="bg-gray-100 dark:bg-gray-800 p-4 flex justify-between items-center cursor-pointer"
            onClick={() => toggleYear(yearPerf.Year)}
          >
            <h3 className="text-lg font-semibold">{yearPerf.Year}</h3>
            <div className="flex items-center space-x-4">
              <span>Events: {yearPerf.EvtCnt}</span>
              <span>Total: {yearPerf.KmSum}</span>
              <Button variant="ghost" size="sm">
                {expandedYears[yearPerf.Year] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {expandedYears[yearPerf.Year] && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Overall Rank</TableHead>
                  <TableHead>Gender Rank</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Category Rank</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearPerf.PerfsPerYear.map((perf, index) => (
                  <TableRow key={index}>
                    <TableCell>{perf.EvtDate}</TableCell>
                    <TableCell>{perf.EvtName}</TableCell>
                    <TableCell>{perf.EvtDist}</TableCell>
                    <TableCell>{perf.Perf}</TableCell>
                    <TableCell>{perf.RankOverall}</TableCell>
                    <TableCell>{perf.RankMW}</TableCell>
                    <TableCell>{perf.Cat}</TableCell>
                    <TableCell>{perf.RankCat}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ))}
    </div>
  );
}
