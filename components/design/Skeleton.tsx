import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { cellVisibility, disclosureVisibility, rowHeight, type ColumnPriority, type Density } from "./table/columns";

export interface SkeletonColumn {
  priority?: ColumnPriority;
  align?: "start" | "end";
  /** Two-line cell (name with muted facts below). */
  twoLine?: boolean;
}

/** One grey bar. Pulses gently; still under prefers-reduced-motion. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block bg-surface-muted animate-pulse motion-reduce:animate-none", className)} />;
}

const widths = ["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-2/5"];

/**
 * Loading state for a DataTable: skeleton rows with the table's real column
 * layout (same priorities, so the same columns show at each width), never a
 * spinner. Pass the column count or the columns' priorities and alignment.
 */
export function TableSkeleton({
  columns,
  rows = 10,
  density = "comfortable",
  className,
}: {
  columns: number | SkeletonColumn[];
  rows?: number;
  density?: Density;
  className?: string;
}) {
  const t = useTranslations("table");
  const cols: SkeletonColumn[] = typeof columns === "number" ? Array.from({ length: columns }, () => ({})) : columns;
  const maxPriority = cols.reduce<ColumnPriority>((max, c) => ((c.priority ?? 1) > max ? (c.priority ?? 1) : max), 1);
  const hasHidden = maxPriority > 1;

  return (
    <div
      role="status"
      aria-busy="true"
      className={cn("overflow-clip", className)}
    >
      <span className="sr-only">{t("loading")}</span>
      <table aria-hidden className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            {cols.map((col, i) => (
              <th
                key={i}
                className={cn("h-8 border-b border-fg px-3 first:ps-0", cellVisibility[col.priority ?? 1])}
              >
                <Skeleton className={cn("h-2.5 w-10", col.align === "end" && "ms-auto")} />
              </th>
            ))}
            {hasHidden && <th className={cn("w-11 border-b border-fg", disclosureVisibility[maxPriority])} />}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {cols.map((col, i) => (
                <td
                  key={i}
                  className={cn("border-b border-hair px-3 first:ps-0", rowHeight[density], cellVisibility[col.priority ?? 1])}
                >
                  <Skeleton
                    className={cn("h-3", widths[(r + i) % widths.length], col.align === "end" && "ms-auto")}
                  />
                  {col.twoLine && <Skeleton className="mt-1.5 h-2.5 w-1/3 md:hidden" />}
                </td>
              ))}
              {hasHidden && <td className={cn("w-11 border-b border-hair", disclosureVisibility[maxPriority])} />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
