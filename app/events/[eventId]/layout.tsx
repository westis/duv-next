import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { TabNav, type TabItem } from "@/components/design";
import { loadRace, loadRaceResults } from "@/components/features/race/loadRace";
import { RaceHeader } from "@/components/features/race/RaceHeader";
import { raceFamily, readFinisher, sameDistance, splitByGender } from "@/components/features/race/raceModel";
import { cleanDuv, formatCount, formatDateRange } from "@/lib/format";

export const revalidate = 3600;

interface LayoutProps {
  params: Promise<{ eventId: string }>;
  children: ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }): Promise<Metadata> {
  const { eventId } = await params;
  const race = await loadRace(eventId).catch(() => null);
  if (!race) return { title: "Race" };
  const e = race.raceDetails;
  const dates = formatDateRange(e.Startdate, await getLocale(), e.Enddate)?.text;
  const place = [cleanDuv(e.City), cleanDuv(e.CountryName) || cleanDuv(e.Country)].filter(Boolean).join(", ");
  return {
    title: e.EventName,
    description: `${e.EventName}${dates ? `, ${dates}` : ""}${place ? `, ${place}` : ""}: results, splits, all editions and race information.`,
  };
}

/**
 * The race page: a short header (name, date, place, key facts), then tabs,
 * each its own route: Results, Splits (when DUV has any), Editions and
 * Information. No loading.tsx or Suspense above notFound(): unknown ids stay 404.
 */
export default async function RaceLayout({ params, children }: LayoutProps) {
  const { eventId } = await params;
  const race = await loadRace(eventId);
  if (!race) notFound();

  const t = await getTranslations("race");
  const locale = await getLocale();
  const event = race.raceDetails;
  const results = await loadRaceResults(event.EventID);
  const lists = splitByGender(results.rows.map(readFinisher));
  const family = raceFamily(event, race.winnerList);
  const base = `/events/${event.EventID}`;
  const total = lists.W.length + lists.M.length;

  const tabs: TabItem[] = [{ href: base, label: t("tabs.results"), count: total ? formatCount(total, locale) ?? undefined : undefined }];
  if (family.splits.length) tabs.push({ href: `${base}/splits`, label: t("tabs.splits") });
  if (family.editions.length > 1)
    tabs.push({ href: `${base}/editions`, label: t("tabs.editions"), count: formatCount(family.editions.length, locale) ?? undefined });
  tabs.push({ href: `${base}/info`, label: t("tabs.info") });

  return (
    <div className="container pb-12">
      <RaceHeader
        race={race}
        lists={lists}
        parent={family.parent}
        parentIsClassification={Boolean(family.parent && sameDistance(family.parent, event))}
        sameDay={family.sameDay}
      />
      <TabNav items={tabs} label={t("tabs.label")} className="mt-3" />
      {children}
    </div>
  );
}
