import { Metadata } from "next";
import { getTopRankAbroad } from "@/lib/duv";
import type { DuvGender } from "@/lib/duv/types";
import { AbroadTable } from "@/components/features/countries/AbroadTable";
import { FilterSelect } from "@/components/features/countries/FilterSelect";
import { parseNat, zipOptions } from "@/components/features/countries/data";

export const revalidate = 3600;

const FIRST_YEAR = 1990;
const DEFAULT_CNT = "3";

interface PageProps {
  params: Promise<{ nat: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(raw: string | string[] | undefined) {
  return Array.isArray(raw) ? raw[0] : raw;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const nat = (await params).nat.toUpperCase();
  return {
    title: `Top rankings abroad - ${nat}`,
    description: `Top placings of runners from ${nat} in ultramarathons outside ${nat}.`,
  };
}

export default async function CountryAbroadPage({
  params,
  searchParams,
}: PageProps) {
  const nat = parseNat((await params).nat);
  const sp = await searchParams;
  const currentYear = new Date().getFullYear();

  const yearParam = Number(first(sp.year));
  const year =
    Number.isInteger(yearParam) &&
    yearParam >= FIRST_YEAR &&
    yearParam <= currentYear
      ? yearParam
      : currentYear;
  const dist = first(sp.dist) || "all";
  const cntParam = first(sp.cnt) || DEFAULT_CNT;
  const genderParam = first(sp.gender);
  const gender: DuvGender =
    genderParam === "M" || genderParam === "W" ? genderParam : "all";

  const data = await getTopRankAbroad({
    country: nat,
    year,
    dist,
    cnt: Number(cntParam) || Number(DEFAULT_CNT),
    gender,
  });

  const years = Array.from({ length: currentYear - FIRST_YEAR + 1 }, (_, i) => {
    const y = String(currentYear - i);
    return { value: y, label: y };
  });
  const distOptions = zipOptions(data?.FltDistValue, data?.FltDistLabel, [
    { value: "all", label: "all" },
  ]);
  const cntOptions = (data?.FltTopCntValues ?? [1, 3, 10, 100]).map((n) => ({
    value: String(n),
    label: `Top ${n}`,
  }));
  const genderOptions = zipOptions(
    data?.FltGenderValues,
    data?.FltGenderLabels,
    [
      { value: "all", label: "all" },
      { value: "M", label: "men" },
      { value: "W", label: "women" },
    ],
  );
  const rows = data?.Resultlist ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <FilterSelect
          param="year"
          label="Year"
          value={String(year)}
          defaultValue={String(currentYear)}
          options={years}
          className="[&_button]:w-[110px]"
        />
        <FilterSelect
          param="dist"
          label="Distance"
          value={dist}
          defaultValue="all"
          options={distOptions}
        />
        <FilterSelect
          param="cnt"
          label="Placings"
          value={cntParam}
          defaultValue={DEFAULT_CNT}
          options={cntOptions}
          className="[&_button]:w-[120px]"
        />
        <FilterSelect
          param="gender"
          label="Gender"
          value={gender}
          defaultValue="all"
          options={genderOptions}
          className="[&_button]:w-[120px]"
        />
      </div>

      {data?.Pageheader?.Title && (
        <h2 className="text-xl font-semibold">{data.Pageheader.Title}</h2>
      )}

      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          No top placings abroad for {nat} with these filters.
        </p>
      ) : (
        <AbroadTable rows={rows} />
      )}
    </div>
  );
}
