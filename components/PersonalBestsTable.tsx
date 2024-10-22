"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PersonalBest {
  PB: string;
  [year: string]:
    | {
        Perf: string;
        RankIntNat: string;
      }
    | string;
}

interface PBEntry {
  [distance: string]: PersonalBest;
}

export default function PersonalBestsTable({
  personalBests,
}: {
  personalBests: PBEntry[];
}) {
  const distances = personalBests.map((pb) => Object.keys(pb)[0]);
  const firstPB = personalBests[0][distances[0]];
  const years = Object.keys(firstPB)
    .filter((key) => key !== "PB")
    .sort((a, b) => Number(b) - Number(a)); // Sort years in descending order

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
            {years.map((year) => (
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
          {personalBests.map((pbEntry, index) => {
            const distance = Object.keys(pbEntry)[0];
            const pbData = pbEntry[distance];
            return (
              <TableRow key={index} className="hover:bg-muted">
                <TableCell className="font-medium">{distance}</TableCell>
                <TableCell className="font-bold text-accent">
                  {pbData.PB}
                </TableCell>
                {years.map((year) => (
                  <TableCell key={year}>
                    {pbData[year] && typeof pbData[year] === "object" ? (
                      <div>
                        <span className="font-medium">
                          {(pbData[year] as { Perf: string }).Perf}
                        </span>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {
                            (
                              pbData[year] as {
                                RankIntNat: string;
                              }
                            ).RankIntNat
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
