import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One key fact (design-system/components/StatStrip.md): a condensed label above
 * a big condensed figure with tabular digits, an optional line below naming
 * who or what. Goes inside a `<StatStrip>` (it renders `<dt>`/`<dd>`).
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
        "flex min-w-0 flex-col gap-1 border-b border-border pt-3.5 pb-4 sm:border-e sm:border-b-0 sm:px-5 sm:first:ps-0 sm:last:border-e-0",
        className
      )}
    >
      <dt className="font-display text-[0.9375rem] font-bold tracking-[0.06em] text-fg-muted uppercase">{label}</dt>
      <dd className="truncate font-display text-[2.5rem] leading-none font-extrabold tabular-nums sm:text-4xl lg:text-[3.25rem]">
        {value}
      </dd>
      {delta && <dd className="text-sm text-fg">{delta}</dd>}
    </div>
  );
}

/**
 * The key facts strip under a page header: 2 to 4 tiles under a 6 px ink rule,
 * with hairline dividers. One column on phones, one row from sm.
 */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 border-t-[length:var(--rule-heavy)] border-t-fg sm:grid-flow-col sm:auto-cols-fr",
        className
      )}
    >
      {children}
    </dl>
  );
}
