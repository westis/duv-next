import Link from "next/link";
import { useLocale } from "next-intl";
import { DateText, formatPerformanceText } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TopRankAbroadRow } from "@/lib/duv/types";
import { text } from "./format";

function runnerName(r: TopRankAbroadRow) {
  return (
    text(r.NameLF) ||
    [text(r.LastName), text(r.FirstName)].filter(Boolean).join(", ")
  );
}

export function AbroadTable({ rows }: { rows: TopRankAbroadRow[] }) {
  const locale = useLocale();
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Event</TableHead>
            <TableHead className="hidden sm:table-cell">Dist.</TableHead>
            <TableHead className="text-right">Rank</TableHead>
            <TableHead className="text-right">M/F rank</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Performance</TableHead>
            <TableHead className="hidden md:table-cell text-right">
              Finishers M/F
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={`${r.EventID}-${r.PersonID}-${r.RankTotal}`}>
              <TableCell className="whitespace-nowrap">
                <DateText value={r.DateF || r.Date} locale={locale} />
              </TableCell>
              <TableCell>
                <Link href={`/events/${r.EventID}`} className="hover:underline">
                  {r.EventName}
                </Link>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({r.Country})
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell whitespace-nowrap">
                {r.Dist}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.RankTotal}
              </TableCell>
              <TableCell className="text-right tabular-nums whitespace-nowrap">
                {r.RankMW}
                <span className="ml-1 text-xs text-muted-foreground">
                  {r.Gender === "W" ? "F" : r.Gender}
                </span>
              </TableCell>
              <TableCell>
                <Link
                  href={`/runners/${r.PersonID}`}
                  className="hover:underline"
                >
                  {runnerName(r)}
                </Link>
                {text(r.OrigName) && (
                  <span className="block text-xs text-muted-foreground">
                    {text(r.OrigName)}
                  </span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">
                {formatPerformanceText(r.Performance, locale)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-right tabular-nums whitespace-nowrap">
                {r.FinisherM} / {r.FinisherW}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
