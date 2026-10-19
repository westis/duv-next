import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface SearchPaginationProps {
  page: number;
  maxPage: number;
  hrefFor: (page: number) => string;
}

/** Pages around the current one, plus first and last. */
function visiblePages(page: number, maxPage: number) {
  const pages = new Set([1, maxPage, page - 1, page, page + 1]);
  return Array.from(pages).filter((p) => p >= 1 && p <= maxPage).sort((a, b) => a - b);
}

export function SearchPagination({ page, maxPage, hrefFor }: SearchPaginationProps) {
  if (maxPage <= 1) return null;
  const pages = visiblePages(page, maxPage);

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious href={hrefFor(page - 1)} />
          </PaginationItem>
        )}
        {pages.map((p, i) => (
          <PaginationItem key={p}>
            {i > 0 && p - pages[i - 1] > 1 && <PaginationEllipsis />}
            <PaginationLink href={hrefFor(p)} isActive={p === page}>
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        {page < maxPage && (
          <PaginationItem>
            <PaginationNext href={hrefFor(page + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
