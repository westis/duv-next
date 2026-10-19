import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RunnerSearchHit } from "@/lib/duv/types";

/** DUV uses "0" for an unknown year of birth. */
function yob(value: string) {
  return value && value !== "0" ? value : "";
}

export function RunnerResults({ hits }: { hits: RunnerSearchHit[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>YOB</TableHead>
          <TableHead className="hidden sm:table-cell">Gender</TableHead>
          <TableHead className="hidden md:table-cell">Club</TableHead>
          <TableHead className="hidden lg:table-cell">City</TableHead>
          <TableHead className="hidden sm:table-cell">Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hits.map((runner) => (
          <TableRow key={runner.PersonID}>
            <TableCell>
              <Link
                href={`/runners/${runner.PersonID}`}
                className="font-medium hover:underline"
              >
                {runner.LastName}, {runner.FirstName}
              </Link>
              {runner.OrigName && (
                <div className="text-xs text-muted-foreground">
                  {runner.OrigName}
                </div>
              )}
            </TableCell>
            <TableCell>{runner.Nationality}</TableCell>
            <TableCell>{yob(runner.YOB)}</TableCell>
            <TableCell className="hidden sm:table-cell">{runner.Gender}</TableCell>
            <TableCell className="hidden md:table-cell">{runner.Club}</TableCell>
            <TableCell className="hidden lg:table-cell">{runner.City}</TableCell>
            <TableCell className="hidden sm:table-cell whitespace-nowrap">
              {runner.ActivRange}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
