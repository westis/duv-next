import { Metadata } from "next";
import { CountryDirectory } from "@/components/features/countries/CountryDirectory";
import { getCountryOptions } from "@/components/features/countries/data";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Country statistics",
  description:
    "National records, best performances by age class, and top rankings abroad for each country.",
};

interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function CountriesPage({ searchParams }: PageProps) {
  const { view } = await searchParams;
  const section = view === "abroad" ? "abroad" : "records";
  const countries = await getCountryOptions();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Country statistics</h1>
        <p className="text-muted-foreground">
          {section === "abroad"
            ? "Pick a country to see its runners' top placings in races abroad."
            : "Pick a country to see its national records and best performances by age class."}
        </p>
      </header>
      {countries.length === 0 ? (
        <p className="text-muted-foreground">
          Could not load the country list from DUV.
        </p>
      ) : (
        <CountryDirectory countries={countries} section={section} />
      )}
    </div>
  );
}
