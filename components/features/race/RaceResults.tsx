import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { OutLink, RecordMarker, SectionHeading } from "@/components/design";
import { formatCount, formatRunnerName } from "@/lib/format";
import { markerKey } from "@/lib/records/evaluate";
import { cn } from "@/lib/utils";
import { ResultsBoard } from "./ResultsBoard";
import type { RowMarker } from "./markers";
import {
  gapToWinner,
  groupIntoBands,
  makeBands,
  type Band,
  type Finisher,
  type Gender,
  type GenderLists,
  type ResultKind,
  type WinnerRow,
} from "./raceModel";
import { bandShortText, edgeText, gapText, resultText } from "./raceText";

/** Column styles of a result list, set once on the table instead of on every cell. */
const SHEET = [
  "w-full border-collapse text-sm md:text-[0.9375rem]",
  "[&_td]:py-2 [&_td]:align-baseline [&_tr[data-q]]:border-b [&_tr[data-q]]:border-hair",
  "[&_td:nth-child(1)]:pe-2 [&_td:nth-child(1)]:text-end [&_td:nth-child(1)]:text-fg-muted [&_td:nth-child(1)]:tabular-nums",
  "[&_td:nth-child(2)]:pe-3 [&_td:nth-child(2)]:text-end [&_td:nth-child(2)]:font-semibold [&_td:nth-child(2)]:whitespace-nowrap [&_td:nth-child(2)]:tabular-nums",
  "[&_td:nth-child(3)]:hidden sm:[&_td:nth-child(3)]:table-cell [&_td:nth-child(3)]:pe-3 [&_td:nth-child(3)]:text-end [&_td:nth-child(3)]:text-fg-muted [&_td:nth-child(3)]:whitespace-nowrap [&_td:nth-child(3)]:tabular-nums",
  "[&_td:nth-child(4)]:min-w-0 [&_td:nth-child(4)]:pe-2 [&_td_a]:font-medium",
  "[&_td_small]:block [&_td_small]:truncate [&_td_small]:text-xs [&_td_small]:text-fg-muted md:[&_td_small]:hidden [&_td_i]:not-italic sm:[&_td_i]:hidden",
  "[&_td:nth-child(5)]:hidden md:[&_td:nth-child(5)]:table-cell [&_td:nth-child(5)]:pe-2 [&_td:nth-child(5)]:text-fg-muted",
  "[&_td:nth-child(6)]:hidden md:[&_td:nth-child(6)]:table-cell [&_td:nth-child(6)]:whitespace-nowrap",
  "[&_td_b]:ms-1 [&_td_b]:font-normal [&_td_b]:text-fg-muted [&_td_b]:tabular-nums",
].join(" ");

/** Lists longer than this get a jump row; fields this big get the find field. */
const JUMP_FROM = 40;
const FIND_FROM = 60;

export interface RaceResultsProps {
  eventId: string;
  lists: GenderLists;
  kind: ResultKind | null;
  markers: Map<string, RowMarker[]>;
  trail: boolean;
  truncated: { shown: number; total: number; href: string } | null;
  classifications: WinnerRow[];
}

/**
 * The results, Almanac result sheet: women and men as separate lists, each
 * with its own places and gap to its winner, the result first. Long fields
 * are grouped into bands (hours for distances, kilometres for fixed times)
 * with a jump row. From xl the two lists stand side by side.
 */
export async function RaceResults({ eventId, lists, kind, markers, trail, truncated, classifications }: RaceResultsProps) {
  const t = await getTranslations("race");
  const locale = await getLocale();
  const total = lists.W.length + lists.M.length;
  const values = [...lists.W, ...lists.M].map((f) => f.value).filter((v): v is number => v !== null);
  const banded = Math.max(lists.W.length, lists.M.length) >= JUMP_FROM;
  const bands = banded ? makeBands(values, kind) : [];
  const genders: Gender[] = (["W", "M"] as const).filter((g) => lists[g].length > 0);

  return (
    <section aria-labelledby="results">
      <SectionHeading id="results" aside={t("finishers", { count: total })} className="scroll-mt-[calc(var(--header-h)+1rem)]">
        {t("results.heading")}
      </SectionHeading>
      {trail && <p className="mb-2 max-w-prose text-sm text-fg-muted">{t("results.trailNote")}</p>}
      {classifications.length > 0 && (
        <p className="mb-2 text-sm">
          <span className="text-fg-muted">{t("splits.alsoRanked")}: </span>
          {classifications.map((c, i) => (
            <span key={c.EventID}>
              {i > 0 && ", "}
              <Link href={`/events/${c.EventID}`}>{c.EventName}</Link>
            </span>
          ))}
        </p>
      )}
      <ResultsBoard
        counts={{ W: lists.W.length, M: lists.M.length }}
        find={total >= FIND_FROM}
        labels={{
          show: t("results.show"),
          both: t("results.both"),
          women: t("results.women"),
          men: t("results.men"),
          find: t("results.find"),
          findLabel: t("results.findLabel"),
          noMatch: t("results.noMatch", { q: "{q}" }),
        }}
      >
        <div className={cn("mt-2", genders.length > 1 && "xl:grid xl:grid-cols-2 xl:gap-9")}>
          {genders.map((g) => (
            <ResultList
              key={g}
              gender={g}
              list={lists[g]}
              kind={kind}
              bands={bands}
              markers={markers}
              eventId={eventId}
              locale={locale}
              labels={{
                heading: g === "W" ? t("results.women") : t("results.men"),
                count: t("finishers", { count: lists[g].length }),
                caption: t("results.caption", { list: g === "W" ? t("results.women") : t("results.men") }),
                jump: t("results.jump"),
                jumpLabel: t("results.jumpLabel", { list: g === "W" ? t("results.women") : t("results.men") }),
                place: t("results.place"),
                result: kind === "distance" ? `${t("results.result")} (km)` : t("results.result"),
                gap: t("results.gap"),
                runner: t("results.runner"),
                nat: t("results.nat"),
                category: t("results.category"),
                other: t("results.bandOther"),
                band: (b: Band) =>
                  b.from === null && b.to !== null
                    ? t("results.bandUnder", { to: edgeText(b.to, kind, locale) })
                    : b.to === null && b.from !== null
                      ? t("results.bandOver", { from: edgeText(b.from, kind, locale) })
                      : t("results.bandBetween", {
                          // "200 to 250 km": the unit once, after the upper edge.
                          from:
                            kind === "distance"
                              ? (formatCount(b.from ?? 0, locale) ?? "")
                              : edgeText(b.from ?? 0, kind, locale),
                          to: edgeText(b.to ?? 0, kind, locale),
                        }),
              }}
            />
          ))}
        </div>
      </ResultsBoard>
      {lists.other > 0 && <p className="mt-3 text-sm text-fg-muted">{t("results.otherGender", { count: lists.other })}</p>}
      {truncated && (
        <p className="mt-3 text-sm text-fg-muted">
          {t("results.truncated", {
            shown: formatCount(truncated.shown, locale) ?? "",
            total: formatCount(truncated.total, locale) ?? "",
          })}{" "}
          <OutLink href={truncated.href}>{t("results.fullList")}</OutLink>
        </p>
      )}
    </section>
  );
}

interface ListLabels {
  heading: string;
  count: string;
  caption: string;
  jump: string;
  jumpLabel: string;
  place: string;
  result: string;
  gap: string;
  runner: string;
  nat: string;
  category: string;
  other: string;
  band: (b: Band) => string;
}

function ResultList({
  gender,
  list,
  kind,
  bands,
  markers,
  eventId,
  locale,
  labels,
}: {
  gender: Gender;
  list: Finisher[];
  kind: ResultKind | null;
  bands: Band[];
  markers: Map<string, RowMarker[]>;
  eventId: string;
  locale: string;
  labels: ListLabels;
}) {
  const id = gender === "W" ? "women" : "men";
  const groups = groupIntoBands(list, bands);
  const winner = list[0];
  const jump = list.length >= JUMP_FROM && groups.length > 1;
  const bandId = (i: number) => `${id}-band-${i}`;

  return (
    <div
      className={cn(
        "min-w-0",
        gender === "W" ? "max-xl:group-data-[view=M]/board:hidden" : "max-xl:group-data-[view=W]/board:hidden",
        gender === "M" && "max-xl:mt-8"
      )}
    >
      <h3
        id={id}
        className="mt-4 flex scroll-mt-[calc(var(--header-h)+4rem)] items-baseline justify-between gap-3 border-b-2 border-fg pb-1.5 font-serif text-lg font-semibold"
      >
        {labels.heading}
        <small className="font-sans text-sm font-normal text-fg-muted">{labels.count}</small>
      </h3>
      {jump && (
        <nav aria-label={labels.jumpLabel} className="border-b border-hair">
          <ul className="flex flex-wrap items-center gap-x-1 text-sm">
            <li aria-hidden className="me-1 text-fg-muted">
              {labels.jump}
            </li>
            {groups.map((g, i) => (
              <li key={i}>
                <a href={`#${bandId(i)}`} className="inline-flex min-h-11 items-center px-1.5 tabular md:min-h-9">
                  {g.band ? bandShortText(g.band, kind, locale) : labels.other}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <table className={SHEET}>
        <caption className="sr-only">{labels.caption}</caption>
        <thead>
          <tr className="label-caps text-fg-muted">
            <th scope="col" className="w-9 py-2 pe-2 text-end font-semibold">
              {labels.place}
            </th>
            <th scope="col" className="py-2 pe-3 text-end font-semibold">
              {labels.result}
            </th>
            <th scope="col" className="hidden py-2 pe-3 text-end font-semibold sm:table-cell">
              {labels.gap}
            </th>
            <th scope="col" className="py-2 pe-2 text-start font-semibold">
              {labels.runner}
            </th>
            <th scope="col" className="hidden py-2 pe-2 text-start font-semibold md:table-cell">
              {labels.nat}
            </th>
            <th scope="col" className="hidden py-2 text-start font-semibold md:table-cell">
              {labels.category}
            </th>
          </tr>
        </thead>
        {groups.map((g, i) => (
          <tbody key={i} data-band={i}>
            {(groups.length > 1 || g.band === null) && bands.length > 0 && (
              <tr>
                <th
                  id={bandId(i)}
                  scope="rowgroup"
                  colSpan={6}
                  className="label-caps scroll-mt-[calc(var(--header-h)+8rem)] border-y sm:scroll-mt-[calc(var(--header-h)+5rem)] border-hair bg-surface-muted px-2 py-1.5 text-start text-fg"
                >
                  {g.band ? labels.band(g.band) : labels.other}
                  <span className="ms-2 font-normal text-fg-muted tabular">{g.rows.length}</span>
                </th>
              </tr>
            )}
            {g.rows.map((f) => (
              <ResultRow
                key={`${f.row.PersonID}-${f.overall}`}
                f={f}
                kind={kind}
                gap={gapText(gapToWinner(f, winner, kind), kind, locale)}
                markers={markers.get(markerKey(eventId, f.row.PersonID))}
                locale={locale}
              />
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function ResultRow({
  f,
  kind,
  gap,
  markers,
  locale,
}: {
  f: Finisher;
  kind: ResultKind | null;
  gap: string;
  markers?: RowMarker[];
  locale: string;
}) {
  const r = f.row;
  const name = formatRunnerName({ first: r.FirstName, last: r.LastName }, locale) || r.AthleteName;
  const nat = r.Nationality?.trim();
  const cat = r.Cat?.trim().replace(/^#NA$/i, "");
  const catRank = cat ? r.RankCat?.trim() : "";
  const catText = [nat, cat && `${cat} ${catRank ?? ""}`.trim()].filter(Boolean).join(" · ");
  // Cells carry no classes: the table styles them by column (SHEET), which keeps big fields light.
  return (
    <tr data-q={`${name} ${nat ?? ""} ${r.Club ?? ""}`.toLocaleLowerCase()}>
      <td>{f.place ?? ""}</td>
      <td>
        {resultText(r.Performance, kind, f.value, locale)}
        {markers?.length ? (
          <span className="mt-0.5 flex flex-wrap justify-end gap-1 sm:ms-1 sm:mt-0 sm:inline-flex sm:align-[1px] xl:ms-0 xl:mt-0.5 xl:flex">
            {markers.map((m, i) => (
              <RecordMarker key={i} kind={m.kind} category={m.category} body={m.body}>
                {m.text}
              </RecordMarker>
            ))}
          </span>
        ) : null}
      </td>
      <td>{gap}</td>
      <td>
        <Link href={`/runners/${r.PersonID}`}>{name}</Link>
        {(catText || gap) && (
          <small>
            {catText}
            {gap && <i>{`${catText ? " · " : ""}${gap}`}</i>}
          </small>
        )}
      </td>
      <td>{nat}</td>
      <td>
        {cat}
        {catRank && <b>{catRank}</b>}
      </td>
    </tr>
  );
}
