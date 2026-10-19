import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { RankingEntry } from "@/lib/duv/types";

interface RankingTableProps {
  entries: RankingEntry[];
  variant: "international" | "backyard";
}

function runnerName(entry: RankingEntry) {
  return [entry.LastName, entry.FirstName].filter(Boolean).join(", ");
}

/** Shared table for the international and backyard rankings. */
export function RankingTable({ entries, variant }: RankingTableProps) {
  const isBackyard = variant === "backyard";
  const showLaps = isBackyard && entries.some((e) => e.Laps);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-right">Rank</TableHead>
            {showLaps && <TableHead className="text-right">Laps</TableHead>}
            <TableHead className="text-right">Performance</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Nat.</TableHead>
            <TableHead className="hidden md:table-cell">Born</TableHead>
            <TableHead className="hidden sm:table-cell">Cat</TableHead>
            <TableHead className="hidden sm:table-cell text-right">
              Cat. rank
            </TableHead>
            <TableHead className="hidden lg:table-cell">Date</TableHead>
            <TableHead className="hidden lg:table-cell">Venue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.PerfID}>
              <TableCell className="text-right tabular-nums">
                {entry.Rank}
              </TableCell>
              {showLaps && (
                <TableCell className="text-right tabular-nums">
                  {entry.Laps}
                </TableCell>
              )}
              <TableCell className="text-right tabular-nums whitespace-nowrap font-medium">
                {entry.Perf}
                {entry.AgeGradePerf && (
                  <div className="text-xs text-muted-foreground font-normal">
                    AG {entry.AgeGradePerf}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Link
                  href={`/runners/${entry.PersonID}`}
                  className="hover:underline"
                >
                  {runnerName(entry)}
                </Link>
                {entry.OrigName && (
                  <div className="text-xs text-muted-foreground">
                    {entry.OrigName}
                  </div>
                )}
              </TableCell>
              <TableCell>{entry.Nationality}</TableCell>
              <TableCell className="hidden md:table-cell tabular-nums">
                {entry.DOB_Display}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {entry.CatInt}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-right tabular-nums">
                {entry.CatRank}
              </TableCell>
              <TableCell className="hidden lg:table-cell tabular-nums whitespace-nowrap">
                {entry.EvtdateShort}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Link
                  href={`/events/${entry.EventID}`}
                  className="hover:underline"
                >
                  {entry.City} ({entry.Country})
                </Link>
                {entry.IAULabel && entry.IAULabel !== "-" && (
                  <Badge variant="outline" className="ml-2">
                    IAU {entry.IAULabel}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
