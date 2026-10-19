import { useLocale } from "next-intl";
import { formatPerformanceText } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PersonCompRow } from "@/lib/duv";
import { bestIndex, clean } from "./format";

// CompTable rows hold one column per year ("&nbsp;" when the runner did not
// take part). EvtID here is the race series, not a single edition, so rows
// are not linked to /events/[eventId].
export function RaceComparisonsTable({
  comparisons,
  note,
}: {
  comparisons: PersonCompRow[];
  note?: string;
}) {
  const locale = useLocale();
  return (
    <div className="space-y-2">
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead className="text-right">Starts</TableHead>
            <TableHead>Results by year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comparisons.map((row) => {
            const results = Object.entries(row)
              .filter(([key, value]) => /^\d{4}$/.test(key) && clean(value))
              .map(([year, perf]) => ({ year, perf: clean(perf) }))
              .sort((a, b) => Number(b.year) - Number(a.year));
            const best = bestIndex(results.map((r) => r.perf));

            return (
              <TableRow key={row.EvtID}>
                <TableCell className="font-medium align-top">{row.EvtName}</TableCell>
                <TableCell className="text-right align-top">{row.EvtCnt}</TableCell>
                <TableCell>
                  <ul className="flex flex-wrap gap-2">
                    {results.map(({ year, perf }, i) => (
                      <li
                        key={year}
                        className={`rounded-md border px-2 py-1 text-xs whitespace-nowrap ${
                          i === best
                            ? "border-yellow-500 bg-yellow-500/10 font-bold"
                            : ""
                        }`}
                      >
                        <span className="text-muted-foreground">{year}</span>{" "}
                        {formatPerformanceText(perf, locale)}
                      </li>
                    ))}
                  </ul>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
