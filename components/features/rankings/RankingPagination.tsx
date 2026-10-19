import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Pagination as DuvPagination } from "@/lib/duv/types";

interface RankingPaginationProps {
  pagination: DuvPagination | undefined;
  pathname: string;
  params: Record<string, string>;
}

/** Pages shown: first, last, and two either side of the current one. */
function pageWindow(current: number, max: number): (number | "gap")[] {
  const pages: (number | "gap")[] = [];
  for (let p = 1; p <= max; p++) {
    if (p === 1 || p === max || Math.abs(p - current) <= 2) pages.push(p);
    else if (pages[pages.length - 1] !== "gap") pages.push("gap");
  }
  return pages;
}

export function RankingPagination({
  pagination,
  pathname,
  params,
}: RankingPaginationProps) {
  if (!pagination || pagination.MaxPage <= 1) return null;
  const current = Number(pagination.CurrPage) || 1;
  const max = Number(pagination.MaxPage);

  const href = (page: number) => {
    const search = new URLSearchParams(params);
    if (page > 1) search.set("page", String(page));
    else search.delete("page");
    const qs = search.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        {current > 1 && (
          <PaginationItem>
            <PaginationPrevious href={href(current - 1)} />
          </PaginationItem>
        )}
        {pageWindow(current, max).map((page, i) =>
          page === "gap" ? (
            <PaginationItem key={`gap-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink href={href(page)} isActive={page === current}>
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        {current < max && (
          <PaginationItem>
            <PaginationNext href={href(current + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
