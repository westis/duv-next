import Link from "next/link";
import { useLocale } from "next-intl";
import { DateText } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EventSearchHit } from "@/lib/duv/types";

const IAU_LABELS: Record<string, string> = {
  G: "IAU Gold",
  S: "IAU Silver",
  B: "IAU Bronze",
};

function finishers(event: EventSearchHit) {
  if (event.FinisherM === null && event.FinisherW === null) return "";
  const m = Number(event.FinisherM ?? 0);
  const w = Number(event.FinisherW ?? 0);
  return String(m + w);
}

export function EventResults({ hits }: { hits: EventSearchHit[] }) {
  const locale = useLocale();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Distance</TableHead>
          <TableHead className="hidden md:table-cell">Location</TableHead>
          <TableHead className="hidden sm:table-cell text-right">
            Finishers
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hits.map((event) => {
          const count = finishers(event);
          return (
            <TableRow key={event.EventID}>
              <TableCell className="whitespace-nowrap">
                <DateText value={event.Startdate} end={event.Enddate} locale={locale} variant="range" />
              </TableCell>
              <TableCell>
                <Link
                  href={`/events/${event.EventID}`}
                  className="font-medium hover:underline"
                >
                  {event.EventName}
                </Link>
                {IAU_LABELS[event.IAULabel] && (
                  <Badge variant="secondary" className="ml-2">
                    {IAU_LABELS[event.IAULabel]}
                  </Badge>
                )}
                {Number(count) > 0 && (
                  <Link
                    href={`/events/${event.EventID}/results`}
                    className="ml-2 text-xs text-muted-foreground hover:underline"
                  >
                    Results
                  </Link>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {event.Length || event.Duration}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {event.City}, {event.Country}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-right">
                {count}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
