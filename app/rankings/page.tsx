import type { Metadata } from "next";
import { getIntBestList, type RankingResponse } from "@/lib/duv";
import {
  RankingFilters,
  RankingPagination,
  RankingSummary,
  RankingTable,
  ageCatOptions,
  capitalizeLabels,
  getPage,
  getParam,
  yearOptions,
  zipOptions,
} from "@/components/features/rankings";
import { RankingError } from "@/components/features/rankings/RankingError";

export const metadata: Metadata = {
  title: "International Rankings | DUV Ultramarathon Statistics",
  description:
    "Yearly and all-time world rankings for ultra distances and fixed-time races.",
};

const PER_PAGE = 100;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RankingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = {
    year: getParam(params, "year", String(new Date().getFullYear())),
    dist: getParam(params, "dist", "100km"),
    gender: getParam(params, "gender", "all"),
    cat: getParam(params, "cat", "all"),
    nat: getParam(params, "nat", "all"),
    label: getParam(params, "label", "all"),
    tt: getParam(params, "tt", "all"),
  };
  const page = getPage(params);

  let data: RankingResponse | null = null;
  let error: unknown = null;
  try {
    data = await getIntBestList({
      ...filters,
      gender: filters.gender as "all" | "M" | "W",
      label: filters.label === "all" ? undefined : filters.label,
      tt: filters.tt === "all" ? undefined : filters.tt,
      page,
      perpage: PER_PAGE,
    });
  } catch (e) {
    console.error("Failed to load international rankings:", e);
    error = e;
  }

  const entries = data?.RankingList ?? [];
  const distLabel =
    zipOptions(data?.FltDistValue, data?.FltDistLabel).find(
      (o) => o.value === filters.dist,
    )?.label ?? filters.dist;
  const yearLabel = filters.year === "all" ? "All-time" : filters.year;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-1">International Rankings</h1>
      <p className="text-muted-foreground mb-6">
        {yearLabel} · {distLabel}
      </p>

      <RankingFilters
        filters={[
          {
            name: "year",
            label: "Year",
            value: filters.year,
            options: yearOptions(data?.FltYearlist),
          },
          {
            name: "dist",
            label: "Distance",
            value: filters.dist,
            options: zipOptions(data?.FltDistValue, data?.FltDistLabel),
          },
          {
            name: "gender",
            label: "Gender",
            value: filters.gender,
            options: capitalizeLabels(
              zipOptions(data?.FltGenderValues, data?.FltGenderLabels),
            ),
          },
          {
            name: "cat",
            label: "Age group",
            value: filters.cat,
            options: ageCatOptions(data?.FltAgeCat),
          },
          {
            name: "nat",
            label: "Country",
            value: filters.nat,
            options: zipOptions(data?.FltCountryValues, data?.FltCountryLabels),
            country: true,
          },
          {
            name: "label",
            label: "Races",
            value: filters.label,
            options: [
              { value: "all", label: "All" },
              { value: "IAU", label: "IAU label" },
            ],
          },
          {
            name: "tt",
            label: "Time",
            value: filters.tt,
            options: [
              { value: "all", label: "All" },
              { value: "netto", label: "Net time" },
            ],
          },
        ]}
      />

      {error ? (
        <RankingError error={error} />
      ) : entries.length === 0 ? (
        <p className="text-muted-foreground">
          No performances match these filters.
        </p>
      ) : (
        <>
          <RankingSummary
            pagination={data?.Pagination}
            shown={entries.length}
          />
          <RankingTable entries={entries} variant="international" />
          <RankingPagination
            pagination={data?.Pagination}
            pathname="/rankings"
            params={filters}
          />
        </>
      )}
    </div>
  );
}
