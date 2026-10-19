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
  // Live data has sent PageSize as a string ("100")
  const page = Number(pagination?.CurrPage);
  const maxPage = Number(pagination?.MaxPage);
  const pageSize = Number(pagination?.PageSize);
  if (!pagination || !(maxPage > 1) || !page || !pageSize) {
    return (
      <p className="text-sm text-muted-foreground mb-2">
        {shown.toLocaleString("en")} performances
      </p>
    );
  }
  const from = (page - 1) * pageSize + 1;
  return (
    <p className="text-sm text-muted-foreground mb-2">
      {from.toLocaleString("en")} to {(from + shown - 1).toLocaleString("en")},
      page {page} of {maxPage.toLocaleString("en")}
    </p>
  );
}
