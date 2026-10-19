import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { MetaDot, PageHeader, StatStrip } from "@/components/design";
import { CountryPicker } from "./CountryPicker";
import type { Country, CountryOption } from "./data";
import { FIRST_YEAR } from "./data";
import { YearSelect } from "./YearSelect";

interface CountryHeaderProps {
  country: Country;
  countries: CountryOption[];
  /** The year the page summarises; omit on pages without a year selector. */
  year?: number;
  /** Page the year selector reloads ("/countries/SWE"). */
  yearAction?: string;
  /** Replaces the country name as the title (sub-pages). */
  title?: ReactNode;
  subtitle?: ReactNode;
  /** `StatTile`s for the ledger. */
  facts?: ReactNode;
}

/**
 * The country masthead, Almanac look: breadcrumb (Countries / continent), the
 * name big and left-aligned, code and continent, the year, "Another country",
 * and a ledger of headline figures between an ink rule and a hairline.
 */
export async function CountryHeader({ country, countries, year, yearAction, title, subtitle, facts }: CountryHeaderProps) {
  const t = await getTranslations("countries");
  const tf = await getTranslations("filters");
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - FIRST_YEAR + 1 }, (_, i) => currentYear - i);
  const continent = t(`continents.${country.continent}`);

  return (
    <PageHeader
      breadcrumb={[
        { label: t("page.breadcrumb"), href: "/countries" },
        { label: continent, href: `/countries#${country.continent}` },
        ...(title ? [{ label: country.name, href: `/countries/${country.code}` }] : []),
        { label: typeof title === "string" ? title : country.name },
      ]}
      title={title ?? country.name}
      subtitle={subtitle}
      meta={
        <>
          <span className="font-semibold tracking-[0.03em] text-fg-muted tabular">{country.code}</span>
          <MetaDot />
          <span className="text-fg-muted">{continent}</span>
          {year !== undefined && yearAction && (
            <>
              <MetaDot />
              <YearSelect action={yearAction} label={t("page.year")} applyLabel={tf("apply")} value={year} years={years} />
            </>
          )}
          <MetaDot />
          <CountryPicker
            value={country.code}
            countries={countries}
            label={t("page.anotherCountry")}
            searchLabel={t("page.searchCountry")}
            emptyLabel={t("page.noCountry")}
          />
        </>
      }
      facts={facts ? <StatStrip className="sm:flex-nowrap">{facts}</StatStrip> : undefined}
    />
  );
}
