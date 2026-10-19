import Link from "next/link";
import { useLocale } from "next-intl";
import { DateText, formatBirthDate, formatPerformanceText } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { BestPerfRecord } from "@/lib/duv/types";
import { text } from "./format";

// Codes in BestPerfRecord.Split, from the DUV legend.
const MARKERS: Record<string, string> = {
  S: "Split (time or distance)",
  T: "Track",
  I: "Indoor",
};

function markerTitle(code: string) {
  return code
    .split("")
    .map((c) => MARKERS[c] ?? c)
    .join(", ");
}

/** "WOverall" -> "Overall", "W40" -> "W40". */
function categoryLabel(key: string) {
  return key.replace(/^[MW](?=Overall$)/, "");
}

function runnerName(r: BestPerfRecord) {
  return [text(r.LastName), text(r.FirstName)].filter(Boolean).join(", ");
}

/** DUV hides the full birth date when Privacy is set; "00.00.0000" is unknown. */
function birth(r: BestPerfRecord, locale: string) {
  const privacy = text(r.Privacy);
  if (privacy && privacy !== "0") return text(r.YOB);
  return formatBirthDate(r.DOB, locale) ? text(r.DOB) : text(r.YOB);
}

interface RecordsTableProps {
  title: string;
  /** Entries keyed by age class, already filtered to one gender. */
  records: [string, BestPerfRecord][];
}

export function RecordsTable({ title, records }: RecordsTableProps) {
  const locale = useLocale();
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">No performances.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Cat.</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Born</TableHead>
                <TableHead className="hidden lg:table-cell">Club</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="hidden md:table-cell">Event</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(([cat, r]) => {
                const split = text(r.Split);
                const origName = text(r.OrigName);
                return (
                  <TableRow key={cat}>
                    <TableCell className="font-medium">
                      {categoryLabel(cat)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {/* Timed races send a bare distance; this adds "km". */}
                      {formatPerformanceText(r.Perf, locale)}
                      {split && (
                        <Badge
                          variant="outline"
                          className="ml-2 px-1.5 py-0 text-[10px]"
                          title={markerTitle(split)}
                        >
                          {split}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/runners/${r.PersonID}`}
                        className="hover:underline"
                      >
                        {runnerName(r)}
                      </Link>
                      {origName && (
                        <span className="block text-xs text-muted-foreground">
                          {origName}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell whitespace-nowrap">
                      <DateText value={birth(r, locale)} locale={locale} variant="birth" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {text(r.Club)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <DateText value={r.Startdate} end={r.Enddate} locale={locale} variant="range" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Link
                        href={`/events/${r.EventID}`}
                        className="hover:underline"
                      >
                        {r.Eventname}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {r.City} ({r.Country})
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

export const RECORD_MARKERS = MARKERS;
