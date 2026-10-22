import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState, PageHeader } from "@/components/design";
import { CountryDirectory } from "@/components/features/countries/CountryDirectory";
import { getCountryOptions } from "@/components/features/countries/data";
import { formatCount } from "@/lib/format";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("countries");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/** The countries index: every nation in DUV in continent columns, filtered by name or code. */
export default async function CountriesPage() {
  const t = await getTranslations("countries.directory");
  const locale = await getLocale();
  const countries = await getCountryOptions();

  return (
    <div className="container pb-12">
      <PageHeader
        title={t("title")}
        meta={
          countries.length > 0 && (
            <span className="text-fg-muted">{t("subtitle", { count: formatCount(countries.length, locale) ?? "" })}</span>
          )
        }
        className="border-b-[length:var(--rule-heavy)] border-fg pb-4"
      />
      {countries.length === 0 ? (
        <EmptyState className="mt-6">{t("loadError")}</EmptyState>
      ) : (
        <CountryDirectory countries={countries} />
      )}
    </div>
  );
}
