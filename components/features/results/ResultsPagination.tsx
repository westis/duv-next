import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { resultsQueryString, type ResultsQuery } from "./params";

interface ResultsPaginationProps {
  basePath: string;
  query: ResultsQuery;
  /** From the API's Pagination.MaxPage; unknown when the API omits it. */
  maxPage?: number;
  /** Rows on the current page, used to guess "has next" without MaxPage. */
  rowCount: number;
}

/** Page numbers to show: first, last, and a window around the current page. */
function pageWindow(current: number, max: number): (number | "gap")[] {
  const pages = new Set([1, max, current - 1, current, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= max)
    .sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function ResultsPagination({
  basePath,
  query,
  maxPage,
  rowCount,
}: ResultsPaginationProps) {
  const current = query.page;
  const hasPrev = current > 1;
  const hasNext = maxPage ? current < maxPage : rowCount >= query.perpage;
  if (!hasPrev && !hasNext) return null;

  const href = (page: number) =>
    `${basePath}${resultsQueryString({ ...query, page })}`;
  const linkClass = buttonVariants({ variant: "outline", size: "sm" });

  return (
    <nav
      aria-label="Results pages"
      className="flex flex-wrap items-center justify-center gap-1 py-4"
    >
      {hasPrev ? (
        <Link href={href(current - 1)} className={linkClass} rel="prev">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Previous</span>
        </Link>
      ) : (
        <span className={cn(linkClass, "pointer-events-none opacity-50")}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Previous</span>
        </span>
      )}

      {maxPage ? (
        pageWindow(current, maxPage).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-2 text-muted-foreground">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              aria-current={p === current ? "page" : undefined}
              className={buttonVariants({
                variant: p === current ? "default" : "ghost",
                size: "sm",
              })}
            >
              {p}
            </Link>
          )
        )
      ) : (
        <span className="px-3 text-sm text-muted-foreground">Page {current}</span>
      )}

      {hasNext ? (
        <Link href={href(current + 1)} className={linkClass} rel="next">
          <span className="sr-only sm:not-sr-only">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(linkClass, "pointer-events-none opacity-50")}>
          <span className="sr-only sm:not-sr-only">Next</span>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
