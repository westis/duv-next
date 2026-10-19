import Link from "next/link";
import { useLocale } from "next-intl";
import { formatPerformanceText } from "@/lib/format";
import type { EventResultRow, NlsText } from "@/lib/duv/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResultsTableProps {
  rows: EventResultRow[];
  nls?: NlsText;
  speedLabel: string;
}

function hasValue(value?: string) {
  return Boolean(value && value !== "0" && value !== "0000-00-00");
}

export function ResultsTable({ rows, nls = {}, speedLabel }: ResultsTableProps) {
  const t = (key: string, fallback: string) => nls[key] || fallback;
  const locale = useLocale();

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-right">{t("nlsRank", "Rank")}</TableHead>
            <TableHead>{t("nlsPerformance", "Performance")}</TableHead>
            <TableHead>{t("nlsNameLastFirst", "Surname, first name")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("nlsClub", "Club")}</TableHead>
            <TableHead>{t("nlsNationalityShort", "Nat.")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("nlsYOBShort", "YOB")}</TableHead>
            <TableHead className="hidden md:table-cell text-right">
              {t("nlsGenderRank", "Rank M/F")}
            </TableHead>
            <TableHead className="hidden md:table-cell">
              {t("nlsAgeGroupShort", "Cat")}
            </TableHead>
            <TableHead className="hidden md:table-cell text-right">
              {t("nlsAgeGroupRank", "Cat. Rank")}
            </TableHead>
            <TableHead className="hidden xl:table-cell text-right">{speedLabel}</TableHead>
            <TableHead className="hidden xl:table-cell">
              {t("nlsAgeGradePerf", "Age graded performance")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={`${row.PersonID}-${row.RankTotal}-${i}`}>
              <TableCell className="text-right tabular-nums">{row.RankTotal}</TableCell>
              <TableCell className="whitespace-nowrap font-medium tabular-nums">
                {formatPerformanceText(row.Performance, locale)}
              </TableCell>
              <TableCell>
                {hasValue(row.PersonID) ? (
                  <Link
                    href={`/runners/${row.PersonID}`}
                    className="text-yellow-600 hover:underline dark:text-yellow-500"
                  >
                    {row.AthleteName}
                  </Link>
                ) : (
                  row.AthleteName
                )}
                {row.OrigName && (
                  <span
                    className="block text-xs text-muted-foreground"
                    title={t("nlsOrigName", "Original name")}
                  >
                    {row.OrigName}
                  </span>
                )}
                {/* Shown inline on small screens where the columns are hidden */}
                <span className="block text-xs text-muted-foreground md:hidden">
                  {[row.Gender, row.Cat, row.Club].filter(Boolean).join(" · ")}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell">{row.Club}</TableCell>
              <TableCell>{row.Nationality}</TableCell>
              <TableCell className="hidden sm:table-cell tabular-nums">
                {hasValue(row.YOB) ? row.YOB : ""}
              </TableCell>
              <TableCell className="hidden md:table-cell text-right tabular-nums">
                {row.RankMW && `${row.RankMW} ${row.Gender}`}
              </TableCell>
              <TableCell className="hidden md:table-cell">{row.Cat}</TableCell>
              <TableCell className="hidden md:table-cell text-right tabular-nums">
                {row.RankCat}
              </TableCell>
              <TableCell className="hidden xl:table-cell text-right tabular-nums">
                {row.Speed}
              </TableCell>
              <TableCell className="hidden xl:table-cell whitespace-nowrap tabular-nums">
                {formatPerformanceText(row.AgeGradePerf, locale)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
