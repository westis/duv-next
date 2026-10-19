import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EventWinnerRow } from "@/lib/duv";
import { parseWinner } from "./eventDetailUtils";
import { hasResults } from "@/components/features/race/loadRace";

function WinnerCell({ value }: { value: string }) {
  const winner = parseWinner(value);
  if (!winner) return <span className="text-muted-foreground">–</span>;
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
      <span className="font-medium">{winner.name}</span>
      <span className="text-muted-foreground tabular-nums">
        {winner.performance}
        {/^\d+\.\d+$/.test(winner.performance) && " km"}
        {winner.rank && winner.rank !== "1" && (
          <span className="text-xs"> ({winner.rank}. overall)</span>
        )}
      </span>
    </div>
  );
}

export function WinnersTable({
  winners,
  currentEventId,
}: {
  winners: EventWinnerRow[];
  currentEventId: string;
}) {
  if (winners.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Winners across editions</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Men</TableHead>
              <TableHead>Women</TableHead>
              <TableHead className="text-right">Finishers</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Links</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {winners.map((row) => {
              const isCurrent = row.EventID === currentEventId;
              const distance = row.Length || row.Duration;
              return (
                <TableRow key={row.EventID} className={isCurrent ? "bg-highlight" : undefined}>
                  <TableCell className="whitespace-nowrap">
                    {isCurrent ? (
                      <span className="font-medium">{row.SDate || row.Year}</span>
                    ) : (
                      <Link href={`/events/${row.EventID}`} className="hover:underline">
                        {row.SDate || row.Year}
                      </Link>
                    )}
                    {distance && (
                      <div className="text-xs text-muted-foreground">{distance}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <WinnerCell value={row.Winner_M} />
                  </TableCell>
                  <TableCell>
                    <WinnerCell value={row.Winner_W} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums whitespace-nowrap">
                    {Number(row.FinisherM || 0) + Number(row.FinisherW || 0) || "–"}
                  </TableCell>
                  <TableCell className="text-right">
                    {hasResults(row.Results) && (
                      <Link
                        href={`/events/${row.EventID}/results`}
                        className="text-sm text-yellow-600 dark:text-yellow-500 hover:underline"
                      >
                        Results
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
