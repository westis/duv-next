import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatCourseLength, formatPerformanceText } from "@/lib/format";
import { sameMark, type PbLine } from "./ledger";

const W = 84;
const H = 26;
const PAD = 3;

/** Yearly bests across the career, better is higher; the PB dot in red. */
function Sparkline({ line, first, last }: { line: PbLine; first: number; last: number }) {
  if (line.bests.length < 2) return null;
  const values = line.bests.map((b) => b.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(last - first, 1);
  const x = (year: number) => PAD + ((year - first) / span) * (W - 2 * PAD);
  const y = (value: number) => {
    if (max === min) return H / 2;
    const better = line.kind === "time" ? (max - value) / (max - min) : (value - min) / (max - min);
    return H - 1 - PAD - better * (H - 2 - 2 * PAD);
  };
  const points = line.bests.map((b) => ({ ...b, cx: x(b.year), cy: y(b.value) }));
  const pb = points.find((p) => sameMark(p.perf, line.pb));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden className="block">
      <line x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} className="stroke-hair" />
      <polyline
        fill="none"
        strokeWidth="1.2"
        className="stroke-fg-muted/70"
        points={points.map((p) => `${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(" ")}
      />
      {points.map((p) => (
        <circle key={p.year} cx={p.cx} cy={p.cy} r={p === pb ? 3 : 1.6} className={p === pb ? "fill-brand" : "fill-fg-muted"} />
      ))}
    </svg>
  );
}

/**
 * The personal-best ladder of the side rail: distance, best, season and a
 * sparkline of that distance's yearly bests. DUV keeps PBs for standard
 * road, track and indoor distances only; "other" races and trail races are
 * linked below it instead.
 */
export function PersonalBests({
  lines,
  first,
  last,
  otherCount,
  otherHref,
  hrefFor,
}: {
  lines: PbLine[];
  first: number;
  last: number;
  otherCount: number;
  otherHref: string;
  /** Link to the history filtered to one distance. */
  hrefFor: (dist: string) => string;
}) {
  const t = useTranslations("runner.pbs");
  const locale = useLocale();
  if (!lines.length && !otherCount) return null;
  const spark = lines.some((l) => l.bests.length >= 2);

  return (
    <section aria-labelledby="pbs-heading">
      <h2 id="pbs-heading" className="label-caps mb-2 text-fg-muted">
        {t("heading")}
      </h2>
      {lines.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-fg-muted">
              <th scope="col" className="py-1.5 pe-2 font-medium">
                {t("distance")}
              </th>
              <th scope="col" className="py-1.5 pe-2 text-right font-medium">
                {t("best")}
              </th>
              <th scope="col" className="py-1.5 pe-2 font-medium">
                {t("year")}
              </th>
              {spark && (
                <th scope="col" className="py-1.5 font-medium">
                  <span className="sr-only">{t("yearlyBests")} </span>
                  <span aria-hidden>
                    {first}–{String(last).slice(-2)}
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.dist} className="border-b border-hair">
                <th scope="row" className="py-1.5 pe-2 text-left font-semibold whitespace-nowrap">
                  <Link href={hrefFor(line.dist)} scroll={false} className="hover:underline">
                    {formatCourseLength(line.dist, locale)}
                  </Link>
                </th>
                <td className="py-1.5 pe-2 text-right font-semibold whitespace-nowrap tabular">
                  {formatPerformanceText(line.pb, locale)}
                </td>
                <td className="py-1.5 pe-2 text-fg-muted tabular">{line.pbYear ?? ""}</td>
                {spark && (
                  <td className="py-1">
                    <Sparkline line={line} first={first} last={last} />
                    {line.bests.length >= 2 && (
                      <span className="sr-only">
                        {line.bests
                          .map((b) => `${b.year}: ${formatPerformanceText(b.perf, locale)}`)
                          .join(", ")}
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {otherCount > 0 && (
        <p className="mt-2 text-sm">
          <Link href={otherHref} scroll={false} className="text-link hover:underline">
            {t("other", { count: otherCount })}
          </Link>{" "}
          <span className="text-fg-muted">{t("otherNote")}</span>
        </p>
      )}
      <p className="mt-2 text-xs text-fg-muted">{spark ? t("noteSpark") : t("note")}</p>
    </section>
  );
}
