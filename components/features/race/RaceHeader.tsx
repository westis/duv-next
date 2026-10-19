import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { LinkText, MetaDot, OutLink, PageHeader, TagList } from "@/components/design";
import { resolveDuvLink, toExternalUrl } from "@/components/features/events/eventDetailUtils";
import { getDuvBaseUrl } from "@/lib/duv";
import { COURSE_SEPARATOR, DateText, cleanDuv, formatClimb, formatRunnerName, formatStartTime, parseDuvDate } from "@/lib/format";
import { raceTags } from "@/lib/tags";
import type { LoadedRace } from "./loadRace";
import type { Finisher, GenderLists, ResultKind, WinnerRow } from "./raceModel";
import { resultText } from "./raceText";

export interface RaceHeaderProps {
  race: LoadedRace;
  lists: GenderLists;
  kind: ResultKind | null;
  nations: number;
  parent: WinnerRow | null;
  /** This event is a classification (same distance) of the parent, not a split. */
  parentIsClassification: boolean;
}

/** DUV's edition text ("12ème", "19^", "3.") as a number, or 0. */
function editionNumber(value: string | null | undefined): number {
  const n = Number.parseInt(cleanDuv(value), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * The top of the result sheet: championship kicker, serif name, date and
 * place, tags (length and climb together), one muted facts line, the race's
 * links, and beside it from xl the women's and men's podiums.
 */
export async function RaceHeader({ race, lists, kind, nations, parent, parentIsClassification }: RaceHeaderProps) {
  const t = await getTranslations("race");
  const locale = await getLocale();
  const event = race.raceDetails;
  const start = parseDuvDate(event.Startdate);
  const end = parseDuvDate(event.Enddate);
  const startTime = formatStartTime(event.Startdate);
  const website = toExternalUrl(event.URL ?? "");
  const year = start?.start.slice(0, 4);
  const edition = editionNumber(event.Edition);
  // Trail is first-class: the climb sits with the length ("117 km · 6 500 m+").
  const climb = formatClimb(event.AltitudeDiff, locale);
  const tags = raceTags(event, { rankingEligible: true }).map((tag) =>
    climb && tag.family === "distance" ? { ...tag, text: `${tag.text}${COURSE_SEPARATOR}${climb}` } : tag
  );
  const kicker = ((race.valuation ?? []) as unknown[])
    .map((v) =>
      typeof v === "string"
        ? v
        : Object.values((v ?? {}) as Record<string, unknown>)
            .filter((x) => typeof x === "string")
            .join(" ")
    )
    .map((v) => cleanDuv(v))
    .filter(Boolean)
    .join(" · ");
  const finishers = lists.W.length + lists.M.length;
  const timeLimit = cleanDuv(event.TimeLimit);
  const facts = [
    cleanDuv(event.RaceType),
    timeLimit && t("timeLimit", { time: timeLimit }),
    finishers > 0 &&
      (nations > 1 ? t("finishersFrom", { count: finishers, nations }) : t("finishers", { count: finishers })),
  ].filter(Boolean) as string[];

  const base = getDuvBaseUrl();
  const old = (key: string) => {
    const link = race.LinkURLs?.[key];
    return link ? resolveDuvLink(link, base) : null;
  };
  const links: { href: string; label: string }[] = [];
  if (website) links.push({ href: website, label: t("website") });
  const track = old("TrackLink");
  if (track) links.push({ href: track, label: t("gpsTracks") });
  const allTime = old("AllTimeLink");
  if (allTime) links.push({ href: allTime, label: t("allTime") });
  const source = cleanDuv(event.ResultSource);

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_26rem] xl:gap-10 xl:border-b xl:border-hair xl:pb-5">
      <PageHeader
        breadcrumb={[
          { label: t("breadcrumbRaces"), href: "/events" },
          ...(year ? [{ label: year, href: `/events?from=${year}-01-01&to=${year}-12-31` }] : []),
          { label: event.EventName },
        ]}
        kicker={kicker || undefined}
        title={event.EventName}
        subtitle={edition > 0 ? t("editionOrdinal", { n: edition }) : undefined}
        meta={
          <>
            {start && <DateText value={start.start} end={end?.start} locale={locale} variant="range" />}
            {startTime && (
              <>
                <MetaDot />
                <span className="tabular">{startTime}</span>
              </>
            )}
            {(event.City || event.Country) && (
              <>
                <MetaDot />
                <span>{[cleanDuv(event.City), cleanDuv(event.Country)].filter(Boolean).join(", ")}</span>
              </>
            )}
          </>
        }
        tags={
          <>
            <TagList tags={tags} />
            {parent && (
              <p className="mt-2 text-sm">
                {t.rich(parentIsClassification ? "classificationOf" : "splitOf", {
                  race: (chunks) => <Link href={`/events/${parent.EventID}`}>{chunks}</Link>,
                  name: parent.EventName,
                })}
              </p>
            )}
            {facts.length > 0 && <p className="mt-2 text-sm text-fg-muted">{facts.join(COURSE_SEPARATOR)}</p>}
            {(links.length > 0 || source) && (
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {links.map((l) => (
                  <OutLink key={l.href} href={l.href}>
                    {l.label}
                  </OutLink>
                ))}
                {source && /https?:\/\//i.test(source) && <LinkText value={source} label={t("resultSource")} />}
              </p>
            )}
          </>
        }
      />
      {finishers > 0 && (
        <Podiums
          lists={lists}
          kind={kind}
          locale={locale}
          labels={{ women: t("podium.women"), men: t("podium.men"), label: t("podium.label") }}
        />
      )}
    </div>
  );
}

function Podiums({
  lists,
  kind,
  locale,
  labels,
}: {
  lists: GenderLists;
  kind: ResultKind | null;
  locale: string;
  labels: { women: string; men: string; label: string };
}) {
  const cols = [
    { label: labels.women, list: lists.W.slice(0, 3) },
    { label: labels.men, list: lists.M.slice(0, 3) },
  ].filter((c) => c.list.length > 0);
  return (
    <section
      aria-label={labels.label}
      className="mt-4 grid grid-cols-2 gap-4 border-t border-hair pt-3 xl:mt-0 xl:self-end xl:border-0 xl:pt-0 xl:pb-2"
    >
      {cols.map((c) => (
        <div key={c.label} className="min-w-0">
          <h2 className="label-caps text-fg-muted">{c.label}</h2>
          <ol className="mt-1.5 space-y-2">
            {c.list.map((f) => (
              <PodiumEntry key={f.row.PersonID} f={f} kind={kind} locale={locale} />
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

function PodiumEntry({ f, kind, locale }: { f: Finisher; kind: ResultKind | null; locale: string }) {
  const r = f.row;
  const name = formatRunnerName({ first: r.FirstName, last: r.LastName }, locale) || r.AthleteName;
  return (
    <li className="flex min-w-0 flex-col leading-tight xl:flex-row xl:items-baseline xl:gap-3">
      <span className="serif-figures text-[1.0625rem] font-semibold xl:w-20 xl:shrink-0 xl:text-end">
        {resultText(r.Performance, kind, f.value, locale)}
      </span>
      <span className="min-w-0 text-sm">
        <Link href={`/runners/${r.PersonID}`} className="font-medium">
          {name}
        </Link>{" "}
        <span className="text-fg-muted">{cleanDuv(r.Nationality)}</span>
      </span>
    </li>
  );
}
