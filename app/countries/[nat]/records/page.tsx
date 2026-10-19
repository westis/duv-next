import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCountryOptions, parseNat } from "@/components/features/countries/data";
import { RecordsView } from "@/components/features/records/RecordsView";

export const revalidate = 86400;
// A cold cache reads up to 80 DUV lists plus the IAU and GOMU pages.
export const maxDuration = 60;

interface PageProps {
  params: Promise<{ nat: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function countryName(nat: string) {
  const countries = await getCountryOptions();
  return countries.find((c) => c.value === nat)?.label ?? nat;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await getTranslations("records");
  const nat = (await params).nat.toUpperCase();
  return {
    title: t("metaTitleNation", { country: await countryName(nat) }),
    description: t("metaDescription"),
  };
}

/** A country's best marks by distance and age class, on the same record board as /records. */
export default async function CountryRecordsPage({ params, searchParams }: PageProps) {
  const nat = parseNat((await params).nat);
  return (
    <RecordsView
      scope={{ kind: "nation", code: nat }}
      searchParams={await searchParams}
      countryName={await countryName(nat)}
    />
  );
}
