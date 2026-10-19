import type { Pagination } from "@/lib/duv/types";

/** "1 to 100 of 1,234 performances", from the API's pagination block. */
export function RankingSummary({
  pagination,
  shown,
}: {
  pagination: Pagination | undefined;
  shown: number;
}) {
  if (!shown) return null;
  if (!pagination || pagination.MaxPage <= 1) {
    return (
      <p className="text-sm text-muted-foreground mb-2">
        {shown.toLocaleString("en")} performances
      </p>
    );
  }
  const from = (pagination.CurrPage - 1) * pagination.PageSize + 1;
  return (
    <p className="text-sm text-muted-foreground mb-2">
      {from.toLocaleString("en")} to {(from + shown - 1).toLocaleString("en")},
      page {pagination.CurrPage} of {pagination.MaxPage}
    </p>
  );
}
