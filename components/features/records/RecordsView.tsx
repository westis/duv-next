import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState, PageHeader, SectionHeading } from "@/components/design";
import { getCountryOptions } from "@/components/features/countries/data";
import { AREAS, type AreaCode, type DisciplineKey } from "@/lib/records";
import { cn } from "@/lib/utils";
import type { BoardCell } from "./cells";
import { BOARD_DISCIPLINES, loadBoard, loadDetail, type NationFilters, type RecordScopeRef } from "./data";
import { DistanceDetail } from "./DistanceDetail";
import { DateOf, HolderLink, kindOf, perfText, PlaceLink } from "./parts";
import { RecordBoard } from "./RecordBoard";
import { RecordControls, type RecordControl } from "./RecordControls";

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** The national lists' options from the URL: `type` (surface) and `cat` (age by). */
export function nationFilters(sp: SearchParams): NationFilters {
  const type = one(sp.type);
  return {
    type: ["1", "2", "3"].includes(type) ? type : "",
    cat: one(sp.cat).toUpperCase() === "YOB" ? "YOB" : "DOB",
  };
}

export function isAreaCode(value: string): value is AreaCode {
  return (AREAS as string[]).includes(value);
}

/** The asked-for distance, if it is one of the board's. */
function distParam(sp: SearchParams): DisciplineKey | null {
  const dist = one(sp.dist);
  return (BOARD_DISCIPLINES as string[]).includes(dist) ? (dist as DisciplineKey) : null;
}

function StaticTag({ label, variant }: { label: string; variant: "solid" | "dashed" }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] items-center border px-1 align-[1px] text-[11px] leading-none font-semibold tracking-[0.04em]",
        variant === "solid" ? "border-brand bg-brand text-brand-fg uppercase" : "border-dashed border-fg-muted text-fg-muted lowercase"
      )}
    >
      {label}
    </span>
  );
}

export interface RecordsViewProps {
  scope: RecordScopeRef;
  searchParams: SearchParams;
  /** World and continents get the page header; a nation sits under the country page's own header. */
  countryName?: string;
}

/**
 * The records of one scope (world, a continent, a nation) as a record board
 * with the open distance's age classes beside it on desktop and under its row
 * on phones (records.html, direction A). Used by /records and
 * /countries/[nat]/records.
 */
export async function RecordsView({ scope, searchParams, countryName }: RecordsViewProps) {
  const t = await getTranslations("records");
  const locale = await getLocale();
  const filters = scope.kind === "nation" ? nationFilters(searchParams) : ({ type: "", cat: "DOB" } as NationFilters);
  const asked = distParam(searchParams);

  const [rows, countries] = await Promise.all([loadBoard(scope, filters), getCountryOptions()]);

  const hasData = (r: (typeof rows)[number]) => !!(r.W || r.M);
  // The world shows every distance, gaps included; a continent or nation only those with marks.
  const shown = scope.kind === "world" ? rows : rows.filter((r) => hasData(r) || r.failed);
  const missing = scope.kind === "world" ? [] : rows.filter((r) => !hasData(r) && !r.failed);
  const fallback = shown.find((r) => r.dist === "100km" && hasData(r)) ?? shown.find(hasData) ?? null;
  const selected = asked && shown.some((r) => r.dist === asked) ? asked : fallback?.dist ?? null;
  const explicit = !!asked && selected === asked;
  const detail = selected ? await loadDetail(scope, selected, filters) : null;

  // URLs: the world and continents on /records, a nation on its country page.
  const basePath = scope.kind === "nation" ? `/countries/${scope.code}/records` : "/records";
  const baseParams = new URLSearchParams();
  if (scope.kind === "area") baseParams.set("scope", scope.code);
  if (filters.type) baseParams.set("type", filters.type);
  if (filters.cat === "YOB") baseParams.set("cat", "YOB");
  const hrefWith = (dist: DisciplineKey | null) => {
    const params = new URLSearchParams(baseParams);
    if (dist) params.set("dist", dist);
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const areaName = scope.kind === "area" ? t(`areas.${scope.code}`) : "";
  const country = scope.kind === "nation" ? countryName ?? scope.code : "";
  const scopeValue = scope.kind === "world" ? "world" : scope.code;

  const controls: RecordControl[] = [
    {
      param: "scope",
      label: t("scope"),
      value: scopeValue,
      defaultValue: "world",
      groups: [
        { options: [{ value: "world", label: t("scopeWorld") }] },
        { label: t("scopeContinents"), options: AREAS.map((a) => ({ value: a, label: t(`areas.${a}`) })) },
        {
          label: t("scopeCountries"),
          options: (countries.some((c) => c.value === scopeValue) || scope.kind !== "nation"
            ? countries
            : [...countries, { value: scopeValue, label: country }]
          ).map((c) => ({ value: c.value, label: c.label })),
        },
      ],
    },
  ];
  if (scope.kind === "nation") {
    controls.push(
      {
        param: "type",
        label: t("surface"),
        value: filters.type,
        defaultValue: "",
        groups: [
          {
            options: [
              { value: "", label: t("surfaceAll") },
              { value: "1", label: t("surfaceRoad") },
              { value: "2", label: t("surfaceTrack") },
              { value: "3", label: t("surfaceIndoor") },
            ],
          },
        ],
      },
      {
        param: "cat",
        label: t("ageBy"),
        value: filters.cat,
        defaultValue: "DOB",
        groups: [
          {
            options: [
              { value: "DOB", label: t("ageByDob") },
              { value: "YOB", label: t("ageByYob") },
            ],
          },
        ],
      }
    );
  }

  // Marks set this year, the newest eight.
  const year = String(new Date().getUTCFullYear());
  const thisYear: BoardCell[] = shown
    .flatMap((r) => [r.W, r.M])
    .filter((c): c is BoardCell => !!c && !!c.date?.startsWith(year))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 8);

  const lead =
    scope.kind === "world"
      ? t("leadWorld")
      : scope.kind === "area"
        ? t("leadArea", { area: areaName })
        : t("leadNation", { country });

  const empty = shown.every((r) => !hasData(r) && !r.failed);
  const kind = kindOf(scope.kind === "nation" ? "nation" : scope.kind, "24h");

  const detailFor = (headingLevel: "h2" | "h3") =>
    detail ? <DistanceDetail detail={detail} ageBy={filters.cat} headingLevel={headingLevel} /> : null;

  return (
    <div className={scope.kind === "nation" ? "" : "container pb-16"}>
      {scope.kind === "nation" ? (
        <>
          <SectionHeading className="mt-2 md:mt-3">{t("titleNation", { country })}</SectionHeading>
          <p className="max-w-prose text-sm text-fg-muted">{lead}</p>
        </>
      ) : (
        <PageHeader
          title={scope.kind === "area" ? t("titleArea", { area: areaName }) : t("title")}
          meta={<p className="max-w-prose text-fg-muted">{lead}</p>}
        />
      )}

      <div className="mt-4">
        <RecordControls controls={controls} action="/records" label={t("controls")} submitLabel={t("show")} />
      </div>
      <p className="mt-3 max-w-prose text-xs text-fg-muted md:text-sm">{t("trailNote")}</p>

      {empty ? (
        <EmptyState className="mt-6">
          {filters.type || filters.cat === "YOB" ? t("emptyFiltered") : t("emptyNation", { country: country || areaName })}
        </EmptyState>
      ) : (
        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
          <div className="min-w-0">
            <RecordBoard
              rows={shown}
              selected={selected}
              explicit={explicit}
              hrefFor={hrefWith}
              retryHref={hrefWith(asked)}
              inlineDetail={detailFor("h3")}
            />
            <p className="mt-3 text-xs leading-6 text-fg-muted md:text-sm">
              {scope.kind === "nation" ? (
                <>
                  <StaticTag label={t("kind.NR")} variant="solid" /> {t("legendNation")}.{" "}
                </>
              ) : (
                <>
                  <StaticTag label={t(`kind.${kind}`)} variant="solid" /> {t("legendRatified")}
                  {" · "}
                  <StaticTag label={t("pending")} variant="dashed" /> {t("legendPending")}
                  {" · "}
                  <StaticTag label={t("best")} variant="dashed" /> {t("legendBest")}.{" "}
                </>
              )}
              {t("legendPick")}
            </p>
            {missing.length > 0 && (
              <p className="mt-2 text-xs text-fg-muted md:text-sm">
                {t("noMarksAt", { list: missing.map((r) => t(`dist.${r.dist}`)).join(", ") })}
              </p>
            )}

            {thisYear.length > 0 && (
              <section aria-labelledby="records-this-year" className="mt-8">
                <h2 id="records-this-year" className="label-caps border-b border-fg pb-2 text-fg-muted">
                  {t("setIn", { year })}
                </h2>
                <ul>
                  {thisYear.map((c) => (
                    <li key={`${c.dist}-${c.gender}`} className="border-b border-hair py-2.5 text-sm">
                      <p>
                        <span className="serif-figures font-semibold">{perfText(c.perf, c.dist, locale, t)}</span>{" "}
                        <span className="text-fg-muted">
                          {t("setInWhat", { dist: t(`dist.${c.dist}`), gender: c.gender === "W" ? t("genderW") : t("genderM") })}
                        </span>
                      </p>
                      <p className="text-xs text-fg-muted md:text-sm">
                        <HolderLink holder={c} locale={locale} className="font-medium" />
                        {c.nat && scope.kind !== "nation" && <> {c.nat}</>}
                        {" · "}
                        <PlaceLink cell={c} />
                        {(c.place || c.country) && ", "}
                        <DateOf value={c.date} locale={locale} />
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="hidden min-w-0 lg:block">{detailFor("h2")}</div>
        </div>
      )}
    </div>
  );
}
