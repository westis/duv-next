import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One key fact: a small-caps label above a big serif figure, optional muted
 * line below. Goes inside a `<StatStrip>` (it renders `<dt>`/`<dd>`).
 */
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
    <div
      className={cn(
        "min-w-0 border-b border-hair py-2.5 sm:border-e sm:border-b-0 sm:pe-6 sm:last:border-e-0",
        className
      )}
    >
      <dt className="label-caps tracking-[0.1em] text-fg-muted">{label}</dt>
      <dd className="serif-figures mt-1.5 truncate text-xl leading-none font-semibold md:text-[1.375rem]">{value}</dd>
      {delta && <dd className="mt-1 text-xs text-fg-muted">{delta}</dd>}
    </div>
  );
}

/**
 * The key facts strip under a page header: 2 to 4 tiles between an ink rule
 * and a rule: two columns with hairlines on phones, one row with hairline dividers from sm.
 */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-4 border-t border-t-fg sm:flex sm:flex-wrap sm:gap-x-6 sm:border-b sm:border-b-border",
        className
      )}
    >
      {children}
    </dl>
  );
}
