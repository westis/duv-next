import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Label above, big tabular figure below, optional delta line. */
export function StatTile({
  label,
  value,
  delta,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="truncate text-xl font-semibold tabular md:text-2xl">{value}</dd>
      {delta && <dd className="text-xs text-fg-muted">{delta}</dd>}
    </div>
  );
}

/** The key facts strip under a page header: 2 to 4 tiles. */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-10", className)}>
      {children}
    </dl>
  );
}
