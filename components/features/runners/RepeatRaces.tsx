import { useLocale, useTranslations } from "next-intl";
import { formatPerformanceText } from "@/lib/format";
import type { PersonCompRow } from "@/lib/duv";
import { bestIndex, clean } from "./format";
import { decodeEntities } from "./ledger";

const VISIBLE = 5;

function RepeatItem({ row }: { row: PersonCompRow }) {
  const locale = useLocale();
  const t = useTranslations("runner.repeat");
  const results = Object.entries(row)
    .filter(([key, value]) => /^\d{4}$/.test(key) && clean(value))
    .map(([year, perf]) => ({ year, perf: clean(perf) }))
    .sort((a, b) => Number(b.year) - Number(a.year));
  const best = bestIndex(results.map((r) => r.perf));
  return (
    <li className="border-b border-hair py-2">
      <p className="font-medium">
        {decodeEntities(clean(row.EvtName))}{" "}
        <span className="text-xs font-normal text-fg-muted">{t("starts", { count: Number(row.EvtCnt) || results.length })}</span>
      </p>
      <ul className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-fg-muted md:text-[0.8125rem]">
        {results.map(({ year, perf }, i) => (
          <li key={year} className="whitespace-nowrap tabular">
            {year}{" "}
            <span className={i === best ? "font-semibold text-fg" : "text-fg"}>
              {formatPerformanceText(perf, locale)}
            </span>
            {i === best && <span className="sr-only"> ({t("best")})</span>}
          </li>
        ))}
      </ul>
    </li>
  );
}

/**
 * DUV's comparison table as a short list: races this runner ran more than
 * once, each season's result side by side, the best in bold.
 */
export function RepeatRaces({ rows }: { rows: PersonCompRow[] }) {
  const t = useTranslations("runner.repeat");
  if (!rows.length) return null;
  const shown = rows.slice(0, VISIBLE);
  const rest = rows.slice(VISIBLE);
  return (
    <section aria-labelledby="repeat-heading" className="mt-8">
      <h2 id="repeat-heading" className="font-display mb-3 border-b-[length:var(--rule-mid)] border-fg pb-2 text-[1.625rem] leading-none font-extrabold uppercase md:text-[2rem]">
        {t("heading")}
      </h2>
      <ul>
        {shown.map((row) => (
          <RepeatItem key={String(row.EvtID)} row={row} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm text-link hover:underline md:min-h-9 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{t("more", { count: rest.length })}</span>
            <span className="hidden group-open:inline">{t("fewer")}</span>
          </summary>
          <ul>
            {rest.map((row) => (
              <RepeatItem key={String(row.EvtID)} row={row} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
