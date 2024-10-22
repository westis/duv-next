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
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialExpandedState = performances.reduce((acc, yearPerf) => {
      acc[yearPerf.Year] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setExpandedYears(initialExpandedState);
  }, [performances]);

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleRow = (rowId: string) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
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
                  <TableHead className="hidden md:table-cell">
                    Distance
                  </TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Overall Rank
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Gender Rank
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Category
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Category Rank
                  </TableHead>
                  <TableHead>More</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearPerf.PerfsPerYear.map((perf, index) => (
                  <React.Fragment key={index}>
                    <TableRow>
                      <TableCell>{perf.EvtDate}</TableCell>
                      <TableCell>{perf.EvtName}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {perf.EvtDist}
                      </TableCell>
                      <TableCell>{perf.Perf}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {perf.RankOverall}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {perf.RankMW}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {perf.Cat}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {perf.RankCat}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(`${yearPerf.Year}-${index}`)}
                        >
                          {expandedRows[`${yearPerf.Year}-${index}`] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRows[`${yearPerf.Year}-${index}`] && (
                      <TableRow>
                        <TableCell colSpan={9}>
                          <div className="p-2">
                            <p className="md:hidden">
                              Distance: {perf.EvtDist}
                            </p>
                            <p className="lg:hidden">
                              Overall Rank: {perf.RankOverall}
                            </p>
                            <p className="lg:hidden">
                              Gender Rank: {perf.RankMW}
                            </p>
                            <p className="md:hidden">Category: {perf.Cat}</p>
                            <p className="md:hidden">
                              Category Rank: {perf.RankCat}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ))}
    </div>
  );
}
