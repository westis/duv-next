import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { FilterLinks } from "@/components/design";
import { cn } from "@/lib/utils";
import { NavSelect, type NavOption } from "./NavSelect";
import { parseDistanceValue, rankingQuery, type RankingState } from "./params";

/** What the rail and the phone controls need to draw every filter as a link. */
export interface RankingNavModel {
  backyard: boolean;
  state: RankingState;
  currentYear: number;
  /** Years with a list, newest first ("2026" ... "2005"). */
  years: string[];
  distances: { distance: string[]; time: string[] };
  /** Age groups the API offers for this gender ("W35"), without "#NA". */
  ageCats: string[];
  /** Countries and regions; a separator has no value. */
  countries: { value: string; label: string }[];
}

type T = ReturnType<typeof useTranslations<"rankings">>;

export function rankingHref(m: RankingNavModel, patch: Partial<RankingState> = {}, backyard = m.backyard) {
  return (backyard ? "/rankings/backyard" : "/rankings") + rankingQuery(m.state, patch, m.currentYear, { backyard });
}

/** "100 km", "50 mi", "24 h", "6 days", from the API's "100km", "50mi", "24h", "6d". */
export function distanceLabel(t: T, value: string): string {
  const d = parseDistanceValue(value);
  if (!d) return value;
  const n = d.amount;
  if (d.unit === "km") return t("distKm", { n });
  if (d.unit === "mi") return t("distMi", { n });
  if (d.unit === "h") return t("distHours", { n });
  return t("distDays", { n });
}

export function yearLabel(t: T, year: string) {
  return year === "all" ? t("allTime") : year;
}

const railLink =
  "nav-link -ms-px flex min-h-8 items-baseline border-s-2 py-1 ps-3.5 tabular hover:bg-transparent hover:underline";

function RailList({ items }: { items: { href: string; label: string; current: boolean }[] }) {
  return (
    <ul className="border-s border-border">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            scroll={false}
            aria-current={item.current ? "page" : undefined}
            className={cn(railLink, item.current ? "border-brand font-semibold" : "border-transparent")}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function GridLinks({ items, cols = 3 }: { items: { href: string; label: string; current: boolean }[]; cols?: 3 | 4 }) {
  return (
    <ul className={cn("grid gap-x-3", cols === 3 ? "grid-cols-3" : "grid-cols-4")}>
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            scroll={false}
            aria-current={item.current ? "page" : undefined}
            className={cn(
              "nav-link flex min-h-11 items-center text-sm tabular hover:bg-transparent hover:underline",
              item.current && "font-semibold shadow-[inset_0_-2px_0_var(--brand)]"
            )}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function RailHeading({ children }: { children: React.ReactNode }) {
  return <p className="label-caps mt-6 mb-2 text-fg-muted first:mt-0">{children}</p>;
}

function listItems(m: RankingNavModel, t: T) {
  return [
    { href: rankingHref(m, { page: 1 }, false), label: t("international"), current: !m.backyard },
    { href: rankingHref(m, { page: 1 }, true), label: t("backyard"), current: m.backyard },
  ];
}

function distanceItems(m: RankingNavModel, t: T, values: string[]) {
  return values.map((value) => ({
    href: rankingHref(m, { dist: value }, false),
    label: distanceLabel(t, value),
    current: !m.backyard && m.state.dist === value,
  }));
}

/** ‹ 2026 › All-time: one step to the year before or after, one to the all-time list. */
function YearStepper({ m, t }: { m: RankingNavModel; t: T }) {
  const { year } = m.state;
  const i = m.years.indexOf(year);
  const older = i >= 0 ? m.years[i + 1] : undefined;
  const newer = i > 0 ? m.years[i - 1] : undefined;
  const step = "inline-flex size-11 items-center justify-center lg:size-8";
  return (
    <div className="flex items-center gap-1">
      {older ? (
        <Link href={rankingHref(m, { year: older })} scroll={false} aria-label={t("previousYear", { year: older })} className={cn(step, "nav-link text-fg hover:bg-surface-muted")}>
          <ChevronLeft aria-hidden strokeWidth={1.75} className="size-4 rtl:rotate-180" />
        </Link>
      ) : (
        <span aria-hidden className={cn(step, "text-fg-muted opacity-40")}>
          <ChevronLeft strokeWidth={1.75} className="size-4 rtl:rotate-180" />
        </span>
      )}
      {year === "all" ? (
        m.years[0] && (
          <Link href={rankingHref(m, { year: m.years[0] })} scroll={false} className="nav-link min-w-12 text-center text-base tabular hover:bg-transparent hover:underline">
            {m.years[0]}
          </Link>
        )
      ) : (
        <span className="min-w-12 text-center text-base font-semibold tabular" aria-current="page">
          {year}
        </span>
      )}
      {newer ? (
        <Link href={rankingHref(m, { year: newer })} scroll={false} aria-label={t("nextYear", { year: newer })} className={cn(step, "nav-link text-fg hover:bg-surface-muted")}>
          <ChevronRight aria-hidden strokeWidth={1.75} className="size-4 rtl:rotate-180" />
        </Link>
      ) : (
        <span aria-hidden className={cn(step, "text-fg-muted opacity-40")}>
          <ChevronRight strokeWidth={1.75} className="size-4 rtl:rotate-180" />
        </span>
      )}
      <Link
        href={rankingHref(m, { year: "all" })}
        scroll={false}
        aria-current={year === "all" ? "page" : undefined}
        className={cn(
          "nav-link ms-auto inline-flex min-h-11 items-center text-sm hover:bg-transparent hover:underline lg:min-h-8",
          year === "all" && "font-semibold shadow-[inset_0_-2px_0_var(--brand)]"
        )}
      >
        {t("allTime")}
      </Link>
    </div>
  );
}

function yearOptions(m: RankingNavModel, t: T): NavOption[] {
  return [
    { value: "all", label: t("allTime"), href: rankingHref(m, { year: "all" }) },
    ...m.years.map((y) => ({ value: y, label: y, href: rankingHref(m, { year: y }) })),
  ];
}

function Toggle({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={on ? "true" : undefined}
      className="nav-link flex min-h-11 items-center gap-2.5 text-sm hover:bg-transparent hover:underline lg:min-h-8"
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex size-4 shrink-0 items-center justify-center border",
          on ? "border-fg bg-fg text-bg" : "border-fg-muted"
        )}
      >
        {on && <Check strokeWidth={2.5} className="size-3" />}
      </span>
      {children}
    </Link>
  );
}

function GenderLinks({ m, t, className }: { m: RankingNavModel; t: T; className?: string }) {
  const g = m.state.gender;
  return (
    <FilterLinks
      label={t("gender")}
      className={className}
      items={[
        { href: rankingHref(m, { gender: "all" }), label: t("genderAll"), current: g === "all" },
        { href: rankingHref(m, { gender: "M" }), label: t("men"), current: g === "M" },
        { href: rankingHref(m, { gender: "W" }), label: t("women"), current: g === "W" },
      ]}
    />
  );
}

function Narrow({ m, t }: { m: RankingNavModel; t: T }) {
  const cats: NavOption[] = [
    { value: "all", label: t("allAgeGroups"), href: rankingHref(m, { cat: "all" }) },
    ...m.ageCats.map((c) => ({ value: c, label: c, href: rankingHref(m, { cat: c }) })),
  ];
  const countries: NavOption[] = m.countries.map((c, i) =>
    c.value
      ? { value: c.value, label: c.value === "all" ? t("world") : c.label, href: rankingHref(m, { nat: c.value }) }
      : { value: `sep-${i}`, label: "──────" }
  );
  if (!countries.some((c) => c.value === "all")) countries.unshift({ value: "all", label: t("world"), href: rankingHref(m, { nat: "all" }) });
  return (
    <div className="flex flex-col gap-3">
      {m.ageCats.length > 0 && <NavSelect label={t("ageGroup")} value={m.state.cat} options={cats} />}
      {m.countries.length > 0 && <NavSelect label={t("country")} value={m.state.nat} options={countries} />}
      {!m.backyard && (
        <div>
          <Toggle href={rankingHref(m, { iau: !m.state.iau })} on={m.state.iau}>
            {t("iauOnly")}
          </Toggle>
          <Toggle href={rankingHref(m, { net: !m.state.net })} on={m.state.net}>
            {t("netOnly")}
          </Toggle>
        </div>
      )}
    </div>
  );
}

/** The desktop rail (from lg): lists, year, distances, gender and the narrowing filters. */
export function RankingRail({ m }: { m: RankingNavModel }) {
  const t = useTranslations("rankings");
  return (
    <nav aria-label={t("lists")} className="text-sm">
      <p className="label-caps mb-3 tracking-[0.1em] text-fg-muted">{t("heading")}</p>
      <RailList items={listItems(m, t)} />

      <RailHeading>{t("year")}</RailHeading>
      <YearStepper m={m} t={t} />
      <NavSelect label={t("otherYear")} value={m.state.year} options={yearOptions(m, t)} className="mt-2 [&_label]:sr-only" />

      {!m.backyard && (
        <>
          <RailHeading>{t("distance")}</RailHeading>
          <RailList items={distanceItems(m, t, m.distances.distance)} />
          <RailHeading>{t("time")}</RailHeading>
          <RailList items={distanceItems(m, t, m.distances.time)} />
        </>
      )}

      <RailHeading>{t("gender")}</RailHeading>
      <GenderLinks m={m} t={t} />

      <RailHeading>{t("narrow")}</RailHeading>
      <Narrow m={m} t={t} />
    </nav>
  );
}

function Panel({ summary, children, name }: { summary: React.ReactNode; children: React.ReactNode; name: string }) {
  return (
    <details name={name} className="group">
      <summary className="flex h-11 cursor-pointer list-none items-center justify-between gap-1 border border-border px-3 text-sm font-medium hover:border-fg-muted group-open:border-fg [&::-webkit-details-marker]:hidden">
        <span className="truncate">{summary}</span>
        <ChevronDown aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-fg-muted group-open:rotate-180" />
      </summary>
      <div className="absolute inset-x-0 top-full z-30 mt-1 border border-fg bg-bg p-4 shadow-lg">{children}</div>
    </details>
  );
}

/**
 * Phones and tablets (below lg): the rail folds into three buttons (distance,
 * year, filters), each opening a panel of links; gender stays one tap away.
 */
export function RankingPhoneControls({ m, title }: { m: RankingNavModel; title: string }) {
  const t = useTranslations("rankings");
  const name = "ranking-controls";
  const active = [m.state.cat !== "all", m.state.nat !== "all", !m.backyard && m.state.iau, !m.backyard && m.state.net].filter(Boolean).length;
  const years = [{ href: rankingHref(m, { year: "all" }), label: t("allTime"), current: m.state.year === "all" }, ...m.years.map((y) => ({ href: rankingHref(m, { year: y }), label: y, current: m.state.year === y }))];
  return (
    // Re-keyed by the URL so an open panel closes once a link is chosen.
    <div key={rankingHref(m, { page: m.state.page })} className="lg:hidden">
      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <Panel name={name} summary={title}>
          <p className="label-caps mb-1 text-fg-muted">{t("lists")}</p>
          <GridLinks items={listItems(m, t)} />
          {!m.backyard && (
            <>
              <p className="label-caps mt-4 mb-1 text-fg-muted">{t("distance")}</p>
              <GridLinks items={distanceItems(m, t, m.distances.distance)} />
              <p className="label-caps mt-4 mb-1 text-fg-muted">{t("time")}</p>
              <GridLinks items={distanceItems(m, t, m.distances.time)} />
            </>
          )}
        </Panel>
        <Panel name={name} summary={yearLabel(t, m.state.year)}>
          <YearStepper m={m} t={t} />
          <div className="mt-3">
            <GridLinks items={years} cols={4} />
          </div>
        </Panel>
        <Panel name={name} summary={active ? `${t("filters")} · ${active}` : t("filters")}>
          <Narrow m={m} t={t} />
        </Panel>
      </div>
      <GenderLinks m={m} t={t} className="mt-2" />
    </div>
  );
}
