import Link from "next/link";
import { useLocale } from "next-intl";
import { DateText, formatPerformanceText } from "@/lib/format";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PersonYear } from "@/lib/duv";
import { clean, isTimedRace } from "./format";

function distanceBadgeClass(dist: string) {
  return isTimedRace(dist)
    ? "bg-yellow-200/50 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-200"
    : "bg-blue-200/50 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200";
}

export function PerformancesList({ years }: { years: PersonYear[] }) {
  const locale = useLocale();
  return (
    <div className="space-y-4">
      {years.map((year) => (
        <details key={year.Year} open className="group border rounded-lg">
          <summary className="flex cursor-pointer list-none items-center justify-between bg-primary/10 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
            <span>
              {year.Year}{" "}
              <span className="font-normal text-muted-foreground">
                ({year.EvtCnt} events, {year.KmSum})
              </span>
            </span>
            <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
          </summary>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead className="text-right">Result</TableHead>
                <TableHead className="text-right">Overall</TableHead>
                <TableHead className="text-right hidden md:table-cell">
                  Gender
                </TableHead>
                <TableHead className="text-right hidden lg:table-cell">
                  Category
                </TableHead>
                <TableHead className="hidden xl:table-cell">Club</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {year.PerfsPerYear.map((perf, i) => (
                <TableRow key={`${perf.EvtID}-${i}`}>
                  <TableCell className="whitespace-nowrap">
                    <DateText value={perf.EvtDate} locale={locale} variant="range" />
                  </TableCell>
                  <TableCell>
                    <Link href={`/events/${perf.EvtID}`} className="hover:underline">
                      {perf.EvtName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${distanceBadgeClass(perf.EvtDist)} text-xs px-2 py-1 rounded-full whitespace-nowrap`}
                    >
                      {perf.EvtDist}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold whitespace-nowrap">
                    <Link
                      href={`/events/${perf.EvtID}/results`}
                      className="hover:underline"
                      title="Full results"
                    >
                      {formatPerformanceText(perf.Perf, locale)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {perf.RankOverall}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell whitespace-nowrap">
                    {perf.Gender} {perf.RankMW}
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell whitespace-nowrap">
                    {perf.Cat} {perf.RankCat}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">
                    {clean(perf.PerfClub)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </details>
      ))}
    </div>
  );
}
