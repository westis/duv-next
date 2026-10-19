import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * A place in a ranking or result list, Almanac look: muted figures, and only
 * the winner's place in red and bold (places 2 and 3 are not medals). The
 * number is always shown, so colour never stands alone.
 */
export function RankCell({ rank, className }: { rank: number | string | null | undefined; className?: string }) {
  const n = typeof rank === "number" ? rank : Number.parseInt(String(rank ?? ""), 10);
  return (
    <span className={cn("tabular", n === 1 ? "font-bold text-brand-ink" : "text-fg-muted", className)}>
      {rank ?? ""}
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
