import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * A place in a ranking or result list, Swiss Grid look: a condensed figure with
 * at least two digits ("01", "12", "128"), only the winner's in brand-ink
 * (places 2 and 3 are not medals). The number is always shown, so colour never
 * stands alone. Text that is not a plain number ("DNF") is shown as it is.
 */
export function RankCell({ rank, className }: { rank: number | string | null | undefined; className?: string }) {
  const text = rank === null || rank === undefined ? "" : String(rank).trim();
  const plain = /^\d+$/.test(text);
  const n = plain ? Number.parseInt(text, 10) : Number.NaN;
  return (
    <span
      className={cn(
        "font-display text-[1.375rem] leading-none font-extrabold tabular",
        n === 1 ? "text-brand-ink" : "text-fg",
        className
      )}
    >
      {plain ? text.padStart(2, "0") : text}
    </span>
  );
}

/**
 * The name cell: the name (an ink link that turns blue on hover when `href` is set) on line 1 and muted
 * facts on line 2. `secondaryHiddenFrom` drops line 2 once those facts have
 * their own columns.
 */
export function NameCell({
  name,
  href,
  secondary,
  secondaryHiddenFrom = "md",
  className,
}: {
  name: ReactNode;
  href?: string;
  secondary?: ReactNode;
  secondaryHiddenFrom?: "md" | "lg" | null;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 flex-col", className)}>
      <span className="font-medium">
        {href ? (
          <Link href={href} className="text-fg no-underline hover:text-link hover:underline">
            {name}
          </Link>
        ) : (
          name
        )}
      </span>
      {secondary && (
        <span
          className={cn(
            "text-xs text-fg-muted",
            secondaryHiddenFrom === "md" && "md:hidden",
            secondaryHiddenFrom === "lg" && "lg:hidden"
          )}
        >
          {secondary}
        </span>
      )}
    </span>
  );
}
