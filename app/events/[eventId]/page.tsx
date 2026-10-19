import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { SectionLayout, type SectionNavItem } from "@/components/design";
import { loadRace, loadRaceResults } from "@/components/features/race/loadRace";
import { RaceHeader } from "@/components/features/race/RaceHeader";
import { RaceResults } from "@/components/features/race/RaceResults";
import { RaceEditions, RaceFacts, RaceNations, RaceSplits } from "@/components/features/race/RaceSections";
import { raceMarkers } from "@/components/features/race/markers";
import {
  finishersOf,
  nationTeams,
  raceFamily,
  readFinisher,
  resultKind,
  sameDistance,
  splitByGender,
} from "@/components/features/race/raceModel";
import { resolveDuvLink } from "@/components/features/events/eventDetailUtils";
import { getDuvBaseUrl } from "@/lib/duv";
import { cleanDuv, formatCount, formatDateRange, parseDuvDate } from "@/lib/format";
import { raceTypeOf } from "@/lib/tags";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const race = await loadRace(eventId).catch(() => null);
  if (!race) return { title: "Race" };
  const e = race.raceDetails;
  const dates = formatDateRange(e.Startdate, await getLocale(), e.Enddate)?.text;
  const place = [cleanDuv(e.City), cleanDuv(e.CountryName) || cleanDuv(e.Country)].filter(Boolean).join(", ");
  return {
    title: e.EventName,
    description: `${e.EventName}${dates ? `, ${dates}` : ""}${place ? `, ${place}` : ""}: results, nations, splits and all editions.`,
  };
}

/**
 * The race page, direction A "The result sheet": one long page read top to
 * bottom (header and podiums, results with women and men apart, nations,
 * splits, editions, race facts), with a contents rail of #anchors in place of
 * tabs. No loading.tsx or Suspense above notFound(): unknown ids stay 404.
 */
export default async function RacePage({ params }: PageProps) {
  const { eventId } = await params;
  const race = await loadRace(eventId);
  if (!race) notFound();

  const t = await getTranslations("race");
  const locale = await getLocale();
  const event = race.raceDetails;
  const results = await loadRaceResults(event.EventID);
  const finishers = results.rows.map(readFinisher);
  const kind = resultKind(finishers);
  const lists = splitByGender(finishers);
  const family = raceFamily(event, race.winnerList);
  const self = race.winnerList.find((w) => w.EventID === event.EventID);
  const date = parseDuvDate(event.Startdate)?.start ?? null;
  const markers = await raceMarkers(event.EventID, [...lists.W, ...lists.M], date, locale);
  const teams = { W: nationTeams(lists.W, kind), M: nationTeams(lists.M, kind) };
  const nations = new Set(finishers.map((f) => cleanDuv(f.row.Nationality)).filter(Boolean)).size;
  const showNations = nations > 1 && (teams.W.length > 1 || teams.M.length > 1);
  const trail = raceTypeOf(event.EventType)?.surface === "trail";
  const total = finishers.length;
  const duvTotal = Number.parseInt(results.header?.FinisherCnt ?? "", 10) || 0;
  const oldResults = race.LinkURLs?.ResultLink ? resolveDuvLink(race.LinkURLs.ResultLink, getDuvBaseUrl()) : null;

  const items: SectionNavItem[] = [];
  if (total > 0) {
    items.push({ href: "#results", label: t("nav.results"), count: formatCount(total, locale) ?? undefined });
    if (lists.W.length && lists.M.length) {
      items.push({ href: "#women", label: `· ${t("nav.women")}`, count: formatCount(lists.W.length, locale) ?? undefined });
      items.push({ href: "#men", label: `· ${t("nav.men")}`, count: formatCount(lists.M.length, locale) ?? undefined });
    }
  }
  if (showNations) items.push({ href: "#nations", label: t("nav.nations") });
  if (family.splits.length) items.push({ href: "#splits", label: t("nav.splits") });
  if (family.editions.length > 1)
    items.push({ href: "#editions", label: t("nav.editions"), count: formatCount(family.editions.length, locale) ?? undefined });
  items.push({ href: "#facts", label: t("nav.facts") });

  const parentIsClassification = Boolean(family.parent && sameDistance(family.parent, event));

  return (
    <SectionLayout
      items={items}
      label={t("nav.label")}
      heading={t("nav.heading")}
      railFooter={
        family.sameDay.length > 0 && (
          <div>
            <p className="label-caps tracking-[0.1em] text-fg-muted">{t("nav.sameDay")}</p>
            <ul className="mt-2 space-y-1.5">
              {family.sameDay.map((s) => (
                <li key={s.EventID}>
                  <Link href={`/events/${s.EventID}`}>{cleanDuv(s.EventName)}</Link>{" "}
                  <span className="text-xs text-fg-muted tabular">{formatCount(finishersOf(s), locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      }
      header={
        <RaceHeader
          race={race}
          lists={lists}
          kind={kind}
          nations={nations}
          parent={family.parent}
          parentIsClassification={parentIsClassification}
        />
      }
    >
      <div className="pb-12">
        {total > 0 ? (
          <RaceResults
            eventId={event.EventID}
            lists={lists}
            kind={kind}
            markers={markers}
            trail={trail}
            classifications={family.classifications}
            truncated={
              results.truncated && oldResults
                ? { shown: total, total: Math.max(duvTotal, total), href: oldResults }
                : null
            }
          />
        ) : (
          <p className="mt-8 text-fg-muted">{t("results.none")}</p>
        )}
        {showNations && <RaceNations teams={teams} kind={kind} />}
        {family.splits.length > 0 && <RaceSplits splits={family.splits} self={self} />}
        {family.editions.length > 1 && <RaceEditions race={race} editions={family.editions} />}
        <RaceFacts race={race} header={results.header} sameDay={family.sameDay} />
      </div>
    </SectionLayout>
  );
}
