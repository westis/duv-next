import type { Metadata } from "next";
import { getBackyardRanking, type RankingResponse } from "@/lib/duv";
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
  title: "Backyard Rankings | DUV Ultramarathon Statistics",
  description: "Yearly and all-time rankings for backyard ultras.",
};

const PER_PAGE = 100;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BackyardRankingsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const filters = {
    year: getParam(params, "year", String(new Date().getFullYear())),
    gender: getParam(params, "gender", "all"),
    cat: getParam(params, "cat", "all"),
    nat: getParam(params, "nat", "all"),
  };
  const page = getPage(params);

  let data: RankingResponse | null = null;
  let error: unknown = null;
  try {
    data = await getBackyardRanking({
      ...filters,
      gender: filters.gender as "all" | "M" | "W",
      page,
      perpage: PER_PAGE,
    });
  } catch (e) {
    console.error("Failed to load backyard rankings:", e);
    error = e;
  }

  const entries = data?.RankingList ?? [];
  const yearLabel = filters.year === "all" ? "All-time" : filters.year;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-1">Backyard Rankings</h1>
      <p className="text-muted-foreground mb-6">{yearLabel}</p>

      <RankingFilters
        filters={[
          {
            name: "year",
            label: "Year",
            value: filters.year,
            options: yearOptions(data?.FltYearlist),
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
          <RankingTable entries={entries} variant="backyard" />
          <RankingPagination
            pagination={data?.Pagination}
            pathname="/rankings/backyard"
            params={filters}
          />
        </>
      )}
    </div>
  );
}
