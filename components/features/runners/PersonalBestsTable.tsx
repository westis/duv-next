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
import type { PersonPBsForDistance } from "@/lib/duv";
import { clean } from "./format";

type YearBest = { Perf: string; RankIntNat: string };

// AllPBs is a list of single-key objects ({ "50km": { PB, "2017": {...} } }).
// Distances become columns and years rows, since there are far more years.
export function PersonalBestsTable({
  personalBests,
  note,
}: {
  personalBests: Record<string, PersonPBsForDistance>[];
  note?: string;
}) {
  const locale = useLocale();
  const distances = personalBests.flatMap((entry) =>
    Object.entries(entry).map(([dist, data]) => ({ dist, data }))
  );

  const years = Array.from(
    new Set(
      distances.flatMap(({ data }) =>
        Object.keys(data).filter((key) => /^\d{4}$/.test(key))
      )
    )
  ).sort((a, b) => Number(b) - Number(a));

  const yearBest = (data: PersonPBsForDistance, year: string) => {
    const value = data[year];
    return value && typeof value === "object" ? (value as YearBest) : null;
  };

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background">Year</TableHead>
            {distances.map(({ dist }) => (
              <TableHead key={dist} className="text-right whitespace-nowrap">
                {dist}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="bg-yellow-500/10 font-bold">
            <TableCell className="sticky left-0 bg-background">PB</TableCell>
            {distances.map(({ dist, data }) => (
              <TableCell key={dist} className="text-right whitespace-nowrap">
                {formatPerformanceText(data.PB, locale) || "–"}
              </TableCell>
            ))}
          </TableRow>
          {years.map((year) => (
            <TableRow key={year}>
              <TableCell className="sticky left-0 bg-background font-medium">
                {year}
              </TableCell>
              {distances.map(({ dist, data }) => {
                const best = yearBest(data, year);
                if (!best) {
                  return (
                    <TableCell key={dist} className="text-right text-muted-foreground">
                      –
                    </TableCell>
                  );
                }
                const isPb = clean(best.Perf) === clean(data.PB);
                const rank = clean(best.RankIntNat);
                return (
                  <TableCell key={dist} className="text-right whitespace-nowrap">
                    <span className={isPb ? "font-bold text-yellow-600 dark:text-yellow-500" : ""}>
                      {formatPerformanceText(best.Perf, locale)}
                    </span>
                    {rank && (
                      <span className="block text-xs text-muted-foreground">
                        {rank}
                      </span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">
        {note ?? "In brackets: rank in that year's international / national ranking."}
      </p>
    </div>
  );
}
