import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { OutLink, RecordMarker } from "@/components/design";
import { formatCount, formatRunnerName } from "@/lib/format";
import { markerKey } from "@/lib/records/evaluate";
import { cn } from "@/lib/utils";
import { ResultsBoard } from "./ResultsBoard";
import type { RowMarker } from "./markers";
import {
  ageGroupOf,
  ageGroupOptions,
  categoryOf,
  gapToWinner,
  nationOptions,
  type Finisher,
  type Gender,
  type GenderLists,
  type ResultKind,
  type WinnerRow,
} from "./raceModel";
import { gapText, resultText } from "./raceText";

/** Column styles of a result list, set once on the table instead of on every cell. */
const SHEET = [
  "w-full border-collapse text-sm md:text-[0.9375rem] xl:text-sm",
  "[&_td]:py-2 [&_td]:align-baseline [&_tr[data-q]]:border-b [&_tr[data-q]]:border-hair",
  "[&_td:nth-child(1)]:pe-2 [&_td:nth-child(1)]:text-end [&_td:nth-child(1)]:text-fg-muted [&_td:nth-child(1)]:tabular-nums",
  "[&_td:nth-child(2)]:pe-3 [&_td:nth-child(2)]:text-end [&_td:nth-child(2)]:font-semibold [&_td:nth-child(2)]:whitespace-nowrap [&_td:nth-child(2)]:tabular-nums",
  "[&_td:nth-child(3)]:hidden sm:[&_td:nth-child(3)]:table-cell [&_td:nth-child(3)]:pe-3 [&_td:nth-child(3)]:text-end [&_td:nth-child(3)]:text-fg-muted [&_td:nth-child(3)]:whitespace-nowrap [&_td:nth-child(3)]:tabular-nums",
  "[&_td:nth-child(4)]:min-w-0 [&_td:nth-child(4)]:pe-2 [&_td_a]:font-medium",
  "[&_td_small]:block [&_td_small]:truncate [&_td_small]:text-xs [&_td_small]:text-fg-muted md:[&_td_small]:hidden [&_td_i]:not-italic sm:[&_td_i]:hidden",
  "[&_td:nth-child(5)]:hidden md:[&_td:nth-child(5)]:table-cell [&_td:nth-child(5)]:pe-2 [&_td:nth-child(5)]:text-fg-muted",
  "[&_td:nth-child(6)]:hidden md:[&_td:nth-child(6)]:table-cell [&_td:nth-child(6)]:whitespace-nowrap",
  "[&_td_b]:ms-1 [&_td_b]:font-normal [&_td_b]:text-fg-muted [&_td_b]:tabular-nums",
  // The place column: the place among women or men, or with an age group chosen the place in the category.
  "group-data-[bycat]/board:[&_[data-gp]]:hidden [&_[data-cp]]:hidden group-data-[bycat]/board:[&_[data-cp]]:inline",
].join(" ");

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
 * The results: women and men as separate lists (they compete separately, and
 * in one list the women drown among the men), each with its own places and
 * gap to its winner, the result first. From xl the two stand side by side,
 * women on the left; below that a switch shows one at a time, women first.
 */
export async function RaceResults({ eventId, lists, kind, markers, trail, truncated, classifications }: RaceResultsProps) {
  const t = await getTranslations("race");
  const locale = await getLocale();
  const all = [...lists.W, ...lists.M];
  const genders: Gender[] = (["W", "M"] as const).filter((g) => lists[g].length > 0);
  const listName = (g: Gender) => (g === "W" ? t("results.women") : t("results.men"));

  return (
    <section aria-label={t("results.heading")} className="mt-4">
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
        ageGroups={ageGroupOptions(all)}
        nations={nationOptions(all)}
        labels={{
          show: t("results.show"),
          women: t("results.women"),
          men: t("results.men"),
          ageGroup: t("results.ageGroup"),
          allAgeGroups: t("results.allAgeGroups"),
          nation: t("results.nation"),
          allNations: t("results.allNations"),
          find: t("results.find"),
          findLabel: t("results.findLabel"),
        }}
      >
        <div className={cn(genders.length > 1 && "xl:grid xl:grid-cols-2 xl:gap-9")}>
          {genders.map((g) => (
            <ResultList
              key={g}
              gender={g}
              list={lists[g]}
              kind={kind}
              markers={markers}
              eventId={eventId}
              locale={locale}
              labels={{
                heading: listName(g),
                count: t("finishers", { count: lists[g].length }),
                caption: t("results.caption", { list: listName(g) }),
                noMatch: t("results.noMatch"),
                place: t("results.place"),
                result: kind === "distance" ? `${t("results.result")} (km)` : t("results.result"),
                gap: t("results.gap"),
                runner: t("results.runner"),
                nat: t("results.nat"),
                category: t("results.category"),
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
  noMatch: string;
  place: string;
  result: string;
  gap: string;
  runner: string;
  nat: string;
  category: string;
}

function ResultList({
  gender,
  list,
  kind,
  markers,
  eventId,
  locale,
  labels,
}: {
  gender: Gender;
  list: Finisher[];
  kind: ResultKind | null;
  markers: Map<string, RowMarker[]>;
  eventId: string;
  locale: string;
  labels: ListLabels;
}) {
  const winner = list[0];
  return (
    <div
      data-list={gender}
      className={cn(
        "min-w-0",
        gender === "W" ? "max-xl:group-data-[view=M]/board:hidden" : "max-xl:group-data-[view=W]/board:hidden"
      )}
    >
      <h2 className="mt-4 flex items-baseline justify-between gap-3 border-b-2 border-fg pb-1.5 font-serif text-lg font-semibold">
        {labels.heading}
        <small className="font-sans text-sm font-normal text-fg-muted">{labels.count}</small>
      </h2>
      <p data-empty hidden className="mt-3 text-sm text-fg-muted">
        {labels.noMatch}
      </p>
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
        <tbody>
          {list.map((f) => (
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
  const cat = categoryOf(f);
  const catRank = cat ? r.RankCat?.trim() : "";
  const catText = [nat, cat && `${cat} ${catRank ?? ""}`.trim()].filter(Boolean).join(" · ");
  // Cells carry no classes: the table styles them by column (SHEET), which keeps big fields light.
  return (
    <tr
      data-q={`${name} ${r.Club ?? ""}`.toLocaleLowerCase()}
      data-nat={(nat ?? "").toUpperCase()}
      data-group={ageGroupOf(cat)}
    >
      <td>
        <span data-gp="">{f.place ?? ""}</span>
        <span data-cp="">{catRank}</span>
      </td>
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
