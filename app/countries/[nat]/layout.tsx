import { CountryNav } from "@/components/features/countries/CountryNav";
import {
  getCountryOptions,
  parseNat,
} from "@/components/features/countries/data";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ nat: string }>;
}

export default async function CountryLayout({ children, params }: LayoutProps) {
  const nat = parseNat((await params).nat);

  const countries = await getCountryOptions();
  const name = countries.find((c) => c.value === nat)?.label ?? nat;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Country statistics</p>
        <h1 className="text-3xl font-bold">
          {name} <span className="text-muted-foreground">({nat})</span>
        </h1>
      </header>
      <CountryNav nat={nat} countries={countries} />
      {children}
    </div>
  );
}
