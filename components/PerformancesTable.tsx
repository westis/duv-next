"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Performance {
  EvtDate: string;
  EvtID: string;
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

const isDuration = (evtDist: string): boolean => {
  const lowerDist = evtDist.toLowerCase();
  return (
    lowerDist.includes("h") ||
    lowerDist.includes("d") ||
    lowerDist.includes("hour") ||
    lowerDist.includes("day")
  );
};

const getDistanceDurationColor = (evtDist: string): string => {
  if (isDuration(evtDist)) {
    return "bg-yellow-200/50 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-200";
  } else {
    return "bg-blue-200/50 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200";
  }
};

export default function PerformancesTable({
  performances,
}: {
  performances: YearPerformances[];
}) {
  const [expandedYears, setExpandedYears] = useState<string[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<string[]>([]);

  useEffect(() => {
    // Expand all years by default
    setExpandedYears(performances.map((perf) => perf.Year));
  }, [performances]);

  const toggleYear = (year: string) => {
    setExpandedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const toggleEvent = (eventId: string) => {
    setExpandedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  return (
    <div className="space-y-4">
      {performances.map((yearPerf, index) => (
        <Card key={index}>
          <CardHeader
            className="bg-primary/10 cursor-pointer"
            onClick={() => toggleYear(yearPerf.Year)}
          >
            <CardTitle className="flex justify-between items-center">
              <span>
                {yearPerf.Year} ({yearPerf.EvtCnt} events, {yearPerf.KmSum})
              </span>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  expandedYears.includes(yearPerf.Year) ? "rotate-180" : ""
                }`}
              />
            </CardTitle>
          </CardHeader>
          {expandedYears.includes(yearPerf.Year) && (
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Distance/Duration</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                    <TableHead className="text-right">Overall</TableHead>
                    <TableHead className="text-right hidden md:table-cell">
                      Gender
                    </TableHead>
                    <TableHead className="text-right hidden lg:table-cell">
                      Category
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearPerf.PerfsPerYear.map((perf, perfIndex) => (
                    <React.Fragment key={perfIndex}>
                      <TableRow>
                        <TableCell>{perf.EvtDate}</TableCell>
                        <TableCell>
                          <Link
                            href={`/events/${perf.EvtID}/results`}
                            className="hover:underline"
                          >
                            {perf.EvtName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`${getDistanceDurationColor(
                              perf.EvtDist
                            )} text-xs px-2 py-1 rounded-full`}
                          >
                            {perf.EvtDist}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {perf.Perf}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {perf.RankOverall}
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell">
                          {perf.Gender}: {perf.RankMW}
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell">
                          {perf.Cat}: {perf.RankCat}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEvent(perf.EvtID)}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                expandedEvents.includes(perf.EvtID)
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedEvents.includes(perf.EvtID) && (
                        <TableRow>
                          <TableCell colSpan={8}>
                            <div className="p-2 bg-muted/50 rounded-md">
                              <p>
                                Gender Rank: {perf.Gender} {perf.RankMW}
                              </p>
                              <p>Category: {perf.Cat}</p>
                              <p>Category Rank: {perf.RankCat}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
