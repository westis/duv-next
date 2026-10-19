import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarFilterState, PER_PAGE_OPTIONS, calendarHref } from "./params";

/** Page numbers to show: first, last, and a window around the current page. */
function pageWindow(current: number, max: number): (number | null)[] {
  const pages = new Set([1, max, current - 1, current, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= max)
    .sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

export function CalendarPagination({
  state,
  maxPage,
  total,
}: {
  state: CalendarFilterState;
  maxPage: number;
  total: number;
}) {
  const current = Math.min(state.page, Math.max(maxPage, 1));
  const firstShown = total === 0 ? 0 : (current - 1) * state.perpage + 1;
  const lastShown = Math.min(current * state.perpage, total);
  const pageLink = (page: number) => calendarHref({ ...state, page });
  const nav = buttonVariants({ variant: "ghost", size: "sm" });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          Showing {firstShown}–{lastShown} of {total.toLocaleString("en")}{" "}
          events
        </span>
        <span className="flex items-center gap-1">
          Per page:
          {PER_PAGE_OPTIONS.map((n) => (
            <Link
              key={n}
              href={calendarHref({ ...state, perpage: n, page: 1 })}
              scroll={false}
              aria-current={n === state.perpage ? "true" : undefined}
              className={cn(
                "px-1.5 rounded hover:underline",
                n === state.perpage && "font-semibold text-foreground",
              )}
            >
              {n}
            </Link>
          ))}
        </span>
      </div>

      {maxPage > 1 && (
        <nav aria-label="Calendar pages" className="flex items-center gap-1">
          {current > 1 ? (
            <Link
              href={pageLink(current - 1)}
              className={nav}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
          ) : (
            <span className={cn(nav, "opacity-50 pointer-events-none")}>
              <ChevronLeftIcon className="h-4 w-4" />
            </span>
          )}
          {pageWindow(current, maxPage).map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} className="px-1 text-muted-foreground">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={pageLink(p)}
                aria-current={p === current ? "page" : undefined}
                className={cn(
                  buttonVariants({
                    variant: p === current ? "default" : "ghost",
                    size: "sm",
                  }),
                  "min-w-9",
                )}
              >
                {p}
              </Link>
            ),
          )}
          {current < maxPage ? (
            <Link
              href={pageLink(current + 1)}
              className={nav}
              aria-label="Next page"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          ) : (
            <span className={cn(nav, "opacity-50 pointer-events-none")}>
              <ChevronRightIcon className="h-4 w-4" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
