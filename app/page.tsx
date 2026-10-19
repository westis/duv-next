import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { isoToday } from "@/components/features/calendar/params";
import { BestOfYear, HomeSearch, ResultsJustIn, ThisWeekColumn } from "@/components/features/home/HomeSections";
import { loadBestOfYear, loadRecentResults, loadThisWeek } from "@/components/features/home/load";

// The lists change through the day; rebuild the page at most every ten minutes.
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  return { title: { absolute: t("metaTitle") }, description: t("metaDescription") };
}

/**
 * Home (direction A, "search desk"): a large search field first, then three
 * short columns: results just in, races this week, and the year's best marks.
 * A column whose data does not come back is left out.
 */
export default async function Home() {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const today = isoToday();
  const year = today.slice(0, 4);
  const [results, week, best] = await Promise.all([
    loadRecentResults(today),
    loadThisWeek(today, locale),
    loadBestOfYear(year),
  ]);

  return (
    <>
      <h1 className="sr-only">{t("title")}</h1>
      <HomeSearch />
      <div className="container grid gap-10 pt-6 pb-12 md:pt-8 lg:grid-cols-[1.25fr_1fr_0.9fr]">
        {results && <ResultsJustIn data={results} />}
        {week && <ThisWeekColumn data={week} />}
        <BestOfYear lists={best} year={year} />
      </div>
    </>
  );
}
