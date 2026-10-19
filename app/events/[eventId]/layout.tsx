import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SectionLayout } from "@/components/design";
import { loadRace } from "@/components/features/race/loadRace";
import { RaceHeader } from "@/components/features/race/RaceHeader";
import { raceTabs } from "@/components/features/race/raceTabs";

export const revalidate = 3600;

/**
 * The race page: one header and the race's sections, shared by every section
 * route (Overview, Results, Editions, ...). Almanac look: a "This race"
 * contents rail on the left from lg, a jump row under the header on phones.
 * No loading.tsx here: it would turn notFound() into a 200 (see
 * plan/UPGRADE-NOTES.md).
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
  const sections = raceTabs(race).map((tab) => ({ href: tab.href, label: t(tab.key) }));

  return (
    <SectionLayout items={sections} label={t("label")} heading={t("heading")} header={<RaceHeader race={race} />}>
      <div className="py-6">{children}</div>
    </SectionLayout>
  );
}
