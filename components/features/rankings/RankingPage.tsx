import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState, FilterLinks, MetaDot, PageHeader, Pagination } from "@/components/design";
import { DuvApiError, type RankingResponse } from "@/lib/duv";
import { formatDistance } from "@/lib/format";
import { distanceLabel, RankingPhoneControls, RankingRail, rankingHref, yearLabel, type RankingNavModel } from "./RankingControls";
import { RankingList } from "./RankingList";
import { loadRanking, MERGED_MAX_PAGES, type LoadedRanking } from "./load";
import { FALLBACK_DISTANCES, groupDistances, parseRankingParams, type RankingState, type SearchParams } from "./params";
import { BACKYARD_LAP_KM, buildRows, gapScale, resultOf } from "./rows";

const OLDEST_YEAR = 2005;

function currentYear() {
  return new Date().getFullYear();
}

type T = Awaited<ReturnType<typeof getTranslations<"rankings">>>;

function listName(t: T, state: RankingState, backyard: boolean) {
  return backyard ? t("backyard") : distanceLabel(t as never, state.dist);
}

function genderLabel(t: T, g: RankingState["gender"]) {
  return g === "M" ? t("men") : g === "W" ? t("women") : t("menAndWomen");
}

export async function rankingMetadata(searchParams: Promise<SearchParams>, backyard: boolean): Promise<Metadata> {
  const t = await getTranslations("rankings");
  const state = parseRankingParams(await searchParams, currentYear());
  const list = listName(t, state, backyard);
  const year = state.year === "all" ? t("allTimeLower") : state.year;
  const title =
    state.gender === "all"
      ? t("metaTitle", { list, year })
      : t("metaTitleGender", { list, year, gender: genderLabel(t, state.gender).toLowerCase() });
  return {
    title: `${title} | DUV Ultramarathon Statistics`,
    description: backyard ? t("metaDescriptionBackyard", { year }) : t("metaDescription", { list, year }),
  };
}

function navModel(state: RankingState, meta: RankingResponse | null, backyard: boolean): RankingNavModel {
  const now = currentYear();
  const apiYears = (meta?.FltYearlist ?? []).map(String).filter((y) => /^\d{4}$/.test(y));
  const years = apiYears.length
    ? apiYears
    : Array.from({ length: now - OLDEST_YEAR + 1 }, (_, i) => String(now - i));
  const suffixes = Array.from(
    new Set((meta?.FltAgeCat ?? []).filter((c) => c && c !== "#NA").map((c) => c.slice(1)))
  );
  const sexes = state.gender === "all" ? ["M", "W"] : [state.gender];
  const ageCats = sexes.flatMap((s) => suffixes.map((x) => s + x));
  const values = meta?.FltCountryValues ?? [];
  const labels = meta?.FltCountryLabels ?? [];
  const countries = values.map((v, i) => {
    const value = String(v);
    return value === "---" ? { value: "", label: "" } : { value, label: labels[i] ?? value };
  });
  return {
    backyard,
    state,
    currentYear: now,
    years,
    distances: groupDistances(meta?.FltDistValue?.length ? meta.FltDistValue : FALLBACK_DISTANCES),
    ageCats,
    countries,
  };
}

/** International (`/rankings`) and backyard (`/rankings/backyard`) rankings in one frame. */
export async function RankingPage({ searchParams, backyard = false }: { searchParams: Promise<SearchParams>; backyard?: boolean }) {
  const t = await getTranslations("rankings");
  const locale = await getLocale();
  const state = parseRankingParams(await searchParams, currentYear());

  let loaded: LoadedRanking | null = null;
  let error: unknown = null;
  try {
    loaded = await loadRanking(state, { backyard });
  } catch (e) {
    console.error(`Failed to load ${backyard ? "backyard" : "international"} rankings:`, e);
    error = e;
  }

  const m = navModel(state, loaded?.meta ?? null, backyard);
  const kind = backyard ? "backyard" : "international";
  const list = listName(t, state, backyard);
  const page = loaded?.page ?? state.page;
  const leader = loaded?.leader ? resultOf(loaded.leader, kind) : null;
  const rows = loaded ? buildRows(loaded.entries, { kind, view: state.view, leader }) : [];
  const scale = gapScale(rows, page);

  const country =
    state.nat === "all" ? t("world") : (m.countries.find((c) => c.value === state.nat)?.label ?? state.nat);
  const regionLabel = (v: string) => m.countries.find((c) => c.value === v)?.label ?? v;
  const meta = [
    genderLabel(t, state.gender),
    state.cat !== "all" ? state.cat : null,
    country,
    !backyard ? (state.iau ? t("iauOnly") : t("allRaces")) : null,
    !backyard && state.net ? t("netTime") : null,
    loaded && loaded.pageCount > 1 ? t("pageOf", { page, count: loaded.pageCount }) : null,
    backyard ? t("lapIs", { km: formatDistance(BACKYARD_LAP_KM, locale)?.text ?? "" }) : null,
  ].filter(Boolean) as string[];

  const partial = loaded?.partial;
  const missing = partial?.missing.map((p) =>
    p === "#NA" ? t("unknownAge") : partial.by === "region" ? regionLabel(p) : p
  );

  return (
    <div className="container pb-12 lg:grid lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-12">
      <aside className="hidden lg:block">
        <div className="sticky top-[var(--header-h)] max-h-[calc(100dvh-var(--header-h))] overflow-y-auto pt-9 pb-6">
          <RankingRail m={m} />
        </div>
      </aside>

      <div className="min-w-0">
        <PageHeader title={list} subtitle={yearLabel(t as never, state.year)} />
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-fg-muted md:text-[0.9375rem]">
            {meta.map((item, i) => (
              <span key={item} className="inline-flex items-center gap-2">
                {i > 0 && <MetaDot />}
                {item}
              </span>
            ))}
          </p>
          <FilterLinks
            label={t("rows")}
            className="hidden md:block"
            items={[
              { href: rankingHref(m, { view: "best" }), label: t("best"), current: state.view === "best" },
              { href: rankingHref(m, { view: "all" }), label: t("all"), current: state.view === "all" },
            ]}
          />
        </div>
        {!backyard && (
          <p className="mt-1 text-sm text-fg-muted">
            {t("trailNote")} <Link href="/events?dist=Trail">{t("trailLink")}</Link>
          </p>
        )}

        <RankingPhoneControls m={m} title={list} />
        <FilterLinks
          label={t("rows")}
          className="md:hidden"
          items={[
            { href: rankingHref(m, { view: "best" }), label: t("best"), current: state.view === "best" },
            { href: rankingHref(m, { view: "all" }), label: t("all"), current: state.view === "all" },
          ]}
        />

        {partial && (
          <p className="mt-3 border-s-2 border-warning ps-3 text-sm text-fg-muted">
            {partial.by === "region" ? t("partialRegion") : t("partialAgeGroup")}
            {missing && missing.length > 0 && <> {t("partialMissing", { parts: missing.join(", ") })}</>}
            {loaded && loaded.pageCount >= MERGED_MAX_PAGES && <> {t("partialPages", { count: MERGED_MAX_PAGES })}</>}
          </p>
        )}

        <div className="mt-4 lg:mt-6">
          {error ? (
            <EmptyState>
              {error instanceof DuvApiError && error.status === 401 ? t("unauthorized") : t("error")}
            </EmptyState>
          ) : rows.length === 0 ? (
            <EmptyState>
              {t("empty")} {t("emptyHint")}
            </EmptyState>
          ) : (
            <>
              <RankingList
                rows={rows}
                kind={kind}
                scale={scale}
                caption={t("caption", { list, year: yearLabel(t as never, state.year) })}
              />
              <Pagination
                className="mt-4 justify-end"
                page={page}
                pageCount={loaded?.pageCount ?? 1}
                hrefForPage={(p) => rankingHref(m, { page: p })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
