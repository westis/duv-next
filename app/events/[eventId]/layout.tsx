import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TabNav } from "@/components/design";
import { loadRace } from "@/components/features/race/loadRace";
import { RaceHeader } from "@/components/features/race/RaceHeader";
import { raceTabs } from "@/components/features/race/raceTabs";

export const revalidate = 3600;

/**
 * The race page: one header and a tab bar shared by every tab route
 * (Overview, Results, Editions, ...). No loading.tsx here: it would turn
 * notFound() into a 200 (see plan/UPGRADE-NOTES.md).
 */
export default async function RaceLayout({
  params,
  children,
}: {
  params: Promise<{ eventId: string }>;
  children: React.ReactNode;
}) {
  const { eventId } = await params;
  const race = await loadRace(eventId);
  if (!race) notFound();
  const t = await getTranslations("race.tabs");
  const tabs = raceTabs(race).map((tab) => ({ href: tab.href, label: t(tab.key) }));

  return (
    // Table headers stick below the site header and the tab bar.
    <div className="container [--table-sticky-top:6.25rem]">
      <RaceHeader race={race} />
      {tabs.length > 1 && <TabNav items={tabs} label={t("label")} />}
      <div className="py-6">{children}</div>
    </div>
  );
}
