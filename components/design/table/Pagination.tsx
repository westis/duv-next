import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  /** Current page, 1-based. */
  page: number;
  pageCount: number;
  /** The URL of page n (the page number lives in the URL). */
  hrefForPage: (page: number) => string;
  /** Optional "Show all" link (up to 1,000 rows). */
  showAllHref?: string;
  className?: string;
}

/** Page numbers around the current one, with the first and last always shown. */
function pageList(page: number, count: number): (number | "gap")[] {
  const pages = new Set([1, count, page - 1, page, page + 1].filter((n) => n >= 1 && n <= count));
  // Avoid a gap of exactly one page: show that page instead.
  if (pages.has(3) && !pages.has(2)) pages.add(2);
  if (pages.has(count - 2) && !pages.has(count - 1)) pages.add(count - 1);
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

const item =
  "inline-flex h-11 min-w-11 items-center justify-center gap-1 px-2 text-sm no-underline tabular md:h-9 md:min-w-9";

/** Numbered pages with previous/next as plain links, so they work before JavaScript loads. */
export function Pagination({ page, pageCount, hrefForPage, showAllHref, className }: PaginationProps) {
  const t = useTranslations("table");
  if (pageCount <= 1 && !showAllHref) return null;

  const prev = page > 1 ? hrefForPage(page - 1) : undefined;
  const next = page < pageCount ? hrefForPage(page + 1) : undefined;

  return (
    <nav aria-label={t("pagination")} className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          {prev ? (
            <Link href={prev} rel="prev" className={cn(item, "text-fg hover:bg-surface-muted")}>
              <ChevronLeft aria-hidden strokeWidth={1.75} className="size-4 rtl:rotate-180" />
              <span className="max-sm:sr-only">{t("previous")}</span>
            </Link>
          ) : (
            <span aria-disabled="true" className={cn(item, "text-fg-muted opacity-50")}>
              <ChevronLeft aria-hidden strokeWidth={1.75} className="size-4 rtl:rotate-180" />
              <span className="max-sm:sr-only">{t("previous")}</span>
            </span>
          )}
        </li>
        {pageList(page, pageCount).map((n, i) =>
          n === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-fg-muted">
              …
            </li>
          ) : (
            <li key={n}>
              <Link
                href={hrefForPage(n)}
                aria-current={n === page ? "page" : undefined}
                aria-label={t("page", { page: n })}
                className={cn(
                  item,
                  n === page
                    ? "font-semibold text-fg shadow-[inset_0_-2px_0_var(--fg)]"
                    : "text-fg hover:bg-surface-muted"
                )}
              >
                {n}
              </Link>
            </li>
          )
        )}
        <li>
          {next ? (
            <Link href={next} rel="next" className={cn(item, "text-fg hover:bg-surface-muted")}>
              <span className="max-sm:sr-only">{t("next")}</span>
              <ChevronRight aria-hidden strokeWidth={1.75} className="size-4 rtl:rotate-180" />
            </Link>
          ) : (
            <span aria-disabled="true" className={cn(item, "text-fg-muted opacity-50")}>
              <span className="max-sm:sr-only">{t("next")}</span>
              <ChevronRight aria-hidden strokeWidth={1.75} className="size-4 rtl:rotate-180" />
            </span>
          )}
        </li>
      </ul>
      {showAllHref && (
        <Link href={showAllHref} className="inline-flex h-11 items-center text-sm md:h-9">
          {t("showAll")}
        </Link>
      )}
    </nav>
  );
}
