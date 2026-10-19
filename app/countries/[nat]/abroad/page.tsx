import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState, FilterBar } from "@/components/design";
import { CountryHeader } from "@/components/features/countries/CountryHeader";
import {
  getCountry,
  getCountryOptions,
  loadPodiumsAbroad,
  parseYear,
} from "@/components/features/countries/data";
import { HostBars, PodiumFeed } from "@/components/features/countries/PodiumFeed";
import { formatCourseLength } from "@/lib/format";

export const revalidate = 3600;

/** DUV's distance filter for mtoprankabroad.php (its own list also has the empty separators). */
const DISTANCES = ["50km", "50mi", "100km", "100mi", "6h", "12h", "24h", "48h", "Road", "Trail", "Track", "Indoo", "Backy"];

interface PageProps {
  params: Promise<{ nat: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(raw: string | string[] | undefined) {
  return Array.isArray(raw) ? raw[0] : raw;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const country = await getCountry((await params).nat);
  const year = parseYear((await searchParams).year);
  const t = await getTranslations("countries.abroadPage");
  return {
    title: t("metaTitle", { country: country.name, year }),
    description: t("metaDescription", { country: country.name, year }),
  };
}

/** Every top-3 place abroad in a year, with distance and gender filters. */
export default async function CountryAbroadPage({ params, searchParams }: PageProps) {
  const country = await getCountry((await params).nat);
  const sp = await searchParams;
  const year = parseYear(sp.year);
  const distParam = first(sp.dist);
  const dist = distParam && DISTANCES.includes(distParam) ? distParam : "";
  const genderParam = first(sp.gender);
  const gender = genderParam === "W" || genderParam === "M" ? genderParam : "";
  const t = await getTranslations("countries.abroadPage");
  const tp = await getTranslations("countries.page");
  const tt = await getTranslations("tags");
  const locale = await getLocale();

  const [countries, rows] = await Promise.all([
    getCountryOptions(),
    loadPodiumsAbroad(country.code, year, { dist, gender: gender || "all" }),
  ]);
  const names = Object.fromEntries(countries.map((c) => [c.value, c.label]));
  const distLabel = (value: string) => {
    const surface: Record<string, string> = {
      Road: tt("surface.road"),
      Trail: tt("surface.trail"),
      Track: tt("surface.track"),
      Indoo: tt("surface.indoor"),
      Backy: tt("type.backyard"),
    };
    return surface[value] ?? formatCourseLength(value, locale);
  };

  return (
    <div className="container pb-12">
      <CountryHeader
        country={country}
        countries={countries}
        year={year}
        yearAction={`/countries/${country.code}/abroad`}
        title={t("title")}
        subtitle={country.name}
      />
      <p className="mb-4 max-w-prose text-sm text-fg-muted md:text-[0.9375rem]">{t("deck", { country: country.name })}</p>
      <FilterBar
        className="mb-4"
        filters={[
          {
            param: "dist",
            label: t("distance"),
            value: dist,
            options: DISTANCES.map((value) => ({ value, label: distLabel(value) })),
          },
          {
            param: "gender",
            label: t("gender"),
            value: gender,
            options: [
              { value: "W", label: t("women") },
              { value: "M", label: t("men") },
            ],
          },
        ]}
      />
      {rows === null ? (
        <EmptyState>{tp("loadError")}</EmptyState>
      ) : rows.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="lg:order-2">
            <p className="label-caps mb-2 text-fg-muted">{t("count", { count: rows.length })}</p>
            <HostBars rows={rows} names={names} limit={12} />
          </div>
          <PodiumFeed rows={rows} className="min-w-0 lg:order-1" />
        </div>
      )}
      <Link href={`/countries/${country.code}${year !== new Date().getFullYear() ? `?year=${year}` : ""}`} className="mt-6 inline-flex min-h-11 items-center gap-1 text-sm font-semibold">
        <ArrowLeft aria-hidden strokeWidth={1.75} className="size-3.5" />
        {t("back", { country: country.name })}
      </Link>
    </div>
  );
}
