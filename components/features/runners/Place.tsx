import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { LedgerRow } from "./ledger";

/**
 * The place, result-first ledger style: overall place, then the gender place
 * when it differs ("31 · M26"), the category place muted ("M45 1"). A gender
 * win is bold and red; the words are in screen-reader text, so the colour
 * is never the only signal.
 */
export function Place({ row, compact = false }: { row: LedgerRow; compact?: boolean }) {
  const t = useTranslations("runner.place");
  const { overall, gender, genderRank, cat, catRank } = row;
  if (!overall && !genderRank) return null;
  const win = genderRank === "1";
  const showGender = !!genderRank && genderRank !== overall;
  const label = [
    overall && t("overall", { place: overall }),
    showGender && t("gender", { gender, place: genderRank }),
    cat && catRank && t("category", { cat, place: catRank }),
  ]
    .filter(Boolean)
    .join(", ");
  const strong = "font-bold text-brand-ink";
  return (
    <span className="whitespace-nowrap tabular">
      <span className="sr-only">{label}</span>
      <span aria-hidden>
        {overall && <span className={cn("font-medium", win && !showGender && strong)}>{overall}</span>}
        {showGender && (
          <>
            {overall && <span className="text-fg-muted"> · </span>}
            <span className={cn(win && strong)}>
              {gender}
              {genderRank}
            </span>
          </>
        )}
        {!compact && cat && catRank && (
          <span className="ms-1.5 text-xs text-fg-muted">
            {cat} {catRank}
          </span>
        )}
      </span>
    </span>
  );
}
