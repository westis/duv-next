"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <div key={index} className="border rounded-lg overflow-hidden">
          <div
            onClick={() => toggleYear(yearPerf.Year)}
            className="w-full flex justify-between items-center p-3 bg-primary text-primary-foreground cursor-pointer"
          >
            <span className="font-bold">
              {yearPerf.Year} ({yearPerf.EvtCnt} events, {yearPerf.KmSum})
            </span>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                expandedYears.includes(yearPerf.Year)
                  ? "transform rotate-180"
                  : ""
              }`}
            />
          </div>
          {expandedYears.includes(yearPerf.Year) && (
            <div className="p-2 space-y-3 bg-secondary/50">
              {yearPerf.PerfsPerYear.map((perf, perfIndex) => (
                <div
                  key={perfIndex}
                  className="border rounded-md p-2 bg-background"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      {perf.EvtName} ({perf.EvtDist})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEvent(perf.EvtID)}
                    >
                      <ChevronRight
                        className={`w-5 h-5 transition-transform ${
                          expandedEvents.includes(perf.EvtID)
                            ? "transform rotate-90"
                            : ""
                        }`}
                      />
                    </Button>
                  </div>
                  <div className="flex flex-wrap justify-between text-sm mt-1">
                    <span>{perf.EvtDate}</span>
                    <span className="font-bold">{perf.Perf}</span>
                    <span>Overall: {perf.RankOverall}</span>
                    <span>
                      {perf.Gender}: {perf.RankMW}
                    </span>
                  </div>
                  {expandedEvents.includes(perf.EvtID) && (
                    <div className="mt-2 text-sm space-y-1 bg-muted p-2 rounded">
                      <div>Category: {perf.Cat}</div>
                      <div>Category Rank: {perf.RankCat}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
