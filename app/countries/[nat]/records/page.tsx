import { Metadata } from "next";
import { getBestPerfCountry } from "@/lib/duv";
import type { BestPerfRecord } from "@/lib/duv/types";
import { FilterSelect } from "@/components/features/countries/FilterSelect";
import { parseNat } from "@/components/features/countries/data";
import {
  RECORD_MARKERS,
  RecordsTable,
} from "@/components/features/countries/RecordsTable";

export const revalidate = 86400;

// mbestperfcountry.php returns no filter lists; these mirror the DUV site.
const DISTANCES = [
  { value: "50km", label: "50 km" },
  { value: "50mi", label: "50 mi" },
  { value: "100km", label: "100 km" },
  { value: "100mi", label: "100 mi" },
  { value: "1000km", label: "1000 km" },
  { value: "1000mi", label: "1000 mi" },
  { value: "", label: "" },
  { value: "6h", label: "6 h" },
  { value: "12h", label: "12 h" },
  { value: "24h", label: "24 h" },
  { value: "48h", label: "48 h" },
  { value: "6d", label: "6 days" },
];

const TYPES = [
  { value: "all", label: "All race types" },
  { value: "1", label: "Road" },
  { value: "2", label: "Track" },
  { value: "3", label: "Indoor" },
];

const AGE_CALC = [
  { value: "DOB", label: "By date of birth" },
  { value: "YOB", label: "By year of birth" },
];

const DEFAULT_DIST = "100km";

interface PageProps {
  params: Promise<{ nat: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pick<T extends { value: string }>(
  options: T[],
  raw: string | string[] | undefined,
  fallback: string,
) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return options.some((o) => o.value && o.value === value)
    ? (value as string)
    : fallback;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const nat = (await params).nat.toUpperCase();
  return {
    title: `National records and best performances - ${nat}`,
    description: `Best ultramarathon performances by age class for runners from ${nat}.`,
  };
}

export default async function CountryRecordsPage({
  params,
  searchParams,
}: PageProps) {
  const nat = parseNat((await params).nat);
  const sp = await searchParams;
  const dist = pick(DISTANCES, sp.dist, DEFAULT_DIST);
  const type = pick(TYPES, sp.type, "all");
  const cat = pick(AGE_CALC, sp.cat, "DOB");

  const data = await getBestPerfCountry({
    nat,
    dist,
    type: type === "all" ? undefined : type,
    cat: cat === "DOB" ? undefined : cat,
  });

  const entries = Object.entries(data?.Records ?? {}) as [
    string,
    BestPerfRecord,
  ][];
  const women = entries.filter(([key]) => key.startsWith("W"));
  const men = entries.filter(([key]) => key.startsWith("M"));
  const distLabel = DISTANCES.find((d) => d.value === dist)?.label ?? dist;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4">
        <FilterSelect
          param="dist"
          label="Distance"
          value={dist}
          defaultValue={DEFAULT_DIST}
          options={DISTANCES}
        />
        <FilterSelect
          param="type"
          label="Race type"
          value={type}
          defaultValue="all"
          options={TYPES}
        />
        <FilterSelect
          param="cat"
          label="Age classes"
          value={cat}
          defaultValue="DOB"
          options={AGE_CALC}
          className="[&_button]:w-[180px]"
        />
      </div>

      {entries.length === 0 ? (
        <p className="text-muted-foreground">
          No best performances for {nat} at {distLabel}.
        </p>
      ) : (
        <div className="grid gap-8 2xl:grid-cols-2">
          <RecordsTable
            title={data?.TitleW || `Best performances ${distLabel} women`}
            records={women}
          />
          <RecordsTable
            title={data?.TitleM || `Best performances ${distLabel} men`}
            records={men}
          />
        </div>
      )}

      <footer className="space-y-2 text-xs text-muted-foreground">
        <p>
          {Object.entries(RECORD_MARKERS)
            .map(([code, label]) => `${code} = ${label}`)
            .join(" · ")}
        </p>
        {data?.Disclaimer && <p>{data.Disclaimer}</p>}
      </footer>
    </div>
  );
}
