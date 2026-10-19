import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const medal: Record<number, string> = {
  1: "bg-medal-gold",
  2: "bg-medal-silver",
  3: "bg-medal-bronze",
};

/**
 * A place in a ranking: the number is always shown, and 1 to 3 get a small
 * gold, silver or bronze dot next to it (colour never stands alone).
 */
export function RankCell({ rank, className }: { rank: number | string | null | undefined; className?: string }) {
  const n = typeof rank === "number" ? rank : Number.parseInt(String(rank ?? ""), 10);
  const dot = medal[n];
  return (
    <span className={cn("inline-flex items-center justify-end gap-1.5 tabular", className)}>
      {dot && <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dot)} />}
      <span>{rank ?? ""}</span>
    </span>
  );
}

/**
 * The name cell: the name (a link when `href` is set) on line 1 and muted
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
      <span className="font-medium">{href ? <Link href={href}>{name}</Link> : name}</span>
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
