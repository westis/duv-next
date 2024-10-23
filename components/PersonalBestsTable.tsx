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

interface PersonalBest {
  [distance: string]: {
    PB: string;
    [year: string]:
      | {
          Perf: string;
          RankIntNat: string;
        }
      | string;
  };
}

export default function PersonalBestsTable({
  personalBests,
}: {
  personalBests: PersonalBest[];
}) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, [personalBests]);

  if (isLoading) {
    return <div>Loading personal bests...</div>;
  }

  const allYears = new Set<string>();
  personalBests.forEach((pb) => {
    Object.values(pb).forEach((distanceData) => {
      Object.keys(distanceData).forEach((key) => {
        if (key !== "PB" && !isNaN(Number(key))) {
          allYears.add(key);
        }
      });
    });
  });

  const sortedYears = Array.from(allYears).sort(
    (a, b) => Number(b) - Number(a)
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-primary text-primary-foreground">
              Distance
            </TableHead>
            <TableHead className="bg-primary text-primary-foreground">
              PB
            </TableHead>
            {sortedYears.map((year) => (
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
          {personalBests.map((pb, index) => {
            const distance = Object.keys(pb)[0];
            const distanceData = pb[distance];
            return (
              <TableRow key={index} className="hover:bg-muted">
                <TableCell className="font-medium">{distance}</TableCell>
                <TableCell className="font-bold text-accent">
                  {distanceData.PB}
                </TableCell>
                {sortedYears.map((year) => (
                  <TableCell key={year}>
                    {distanceData[year] &&
                    typeof distanceData[year] === "object" ? (
                      <div>
                        <span className="font-medium">
                          {(distanceData[year] as { Perf: string }).Perf}
                        </span>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {
                            (distanceData[year] as { RankIntNat: string })
                              .RankIntNat
                          }
                        </span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
