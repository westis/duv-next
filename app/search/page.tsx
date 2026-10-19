import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCalendar } from "@/lib/duv";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState, Pagination } from "@/components/design";
import { SearchSentence, type CountryOption } from "@/components/features/search/SearchSentence";
import { RaceRows } from "@/components/features/search/RaceRows";
import { RunnerTable } from "@/components/features/search/RunnerTable";
import { EditionTable } from "@/components/features/search/EditionTable";
import {
  findRaces,
  findRunners,
  withoutEditions,
  MIN_EVENT_CHARS,
  MIN_RUNNER_CHARS,
} from "@/components/features/search/data";
import { sortByDate } from "@/components/features/search/races";
import { headCell, tableClass } from "@/components/features/search/tableStyles";
import { isIdQuery, parseSearchQuery, searchHref, type SearchQuery } from "@/components/features/search/params";

const RUNNERS_PER_PAGE = 50;
const RACES_PER_PAGE = 25;
const EDITIONS_PER_PAGE = 50;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { sname } = parseSearchQuery(await searchParams);
  const t = await getTranslations("search");
  return {
    title: sname ? t("metaTitleFor", { query: sname }) : t("title"),
    description: t("metaDescription"),
  };
}

async function getCountries(): Promise<CountryOption[]> {
  try {
    const data = await getCalendar({ perpage: 1 }, { revalidate: 86400 });
    const values = data?.FltCountryValues ?? [];
    const labels = data?.FltCountryLabels ?? [];
    return values
      .map((value, i) => ({ value, label: labels[i] ?? value }))
      .filter((c) => c.value && c.value !== "all");
  } catch (error) {
    console.error("Failed to load country list:", error);
    return [];
  }
}

/** Runners are searched by surname; a first name may follow after a comma ("kouros, yiannis"). */
function runnerName(query: SearchQuery) {
  if (query.fname) return { sname: query.sname, fname: query.fname };
  const [last, ...rest] = query.sname.split(",");
  const fname = rest.join(",").trim();
  return fname ? { sname: last.trim(), fname } : { sname: query.sname, fname: "" };
}

const sectionHead = "flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-fg pb-1.5";
const sectionTitle = "font-serif text-[1.375rem] leading-tight font-semibold md:text-[1.625rem]";

/**
 * Full search, direction A ("index with time"): the query as one sentence,
 * then races grouped into one row per race (with finishers per edition) and
 * runners with their active years on a shared time axis. Both lists page on
 * their own. A number alone opens the runner or race with that id.
 */
export default async function SearchPage({ searchParams }: PageProps) {
  const query = parseSearchQuery(await searchParams);
  const t = await getTranslations("search");
  const locale = await getLocale();
  const wantRunners = query.type !== "event";
  const wantRaces = query.type !== "runner";
  const name = runnerName(query);

  const [countries, runners, races] = await Promise.all([
    getCountries(),
    wantRunners
      ? findRunners(name.sname, {
          fname: name.fname,
          nat: query.nat,
          exact: query.exact,
          fuzzy: query.fuzzy,
          page: query.page,
          perpage: RUNNERS_PER_PAGE,
        })
      : null,
    wantRaces ? findRaces(query.sname, { dist: query.dist, nat: query.nat }) : null,
  ]);

  // A number typed alone is an id: go straight to the one runner or race it names.
  if (isIdQuery(query.sname)) {
    const runner = runners?.rows.find((r) => r.id === query.sname);
    const race = races?.editions.find((e) => e.id === query.sname);
    if (runner && !race) redirect(`/runners/${runner.id}`);
    if (race && !runner) redirect(`/events/${race.id}`);
  }

  const groups = sortByDate(races?.groups ?? []);
  const editions = races?.editions ?? [];
  const runnerRows = runners?.rows ?? [];
  const runnerTotal = runners?.total ?? 0;
  const runnerMaxPage = runners?.maxPage ?? 1;
  const runnerPage = Math.min(query.page, runnerMaxPage);
  const runnersCapped = runnerTotal > runnerMaxPage * RUNNERS_PER_PAGE;

  const perPage = query.editions ? EDITIONS_PER_PAGE : RACES_PER_PAGE;
  const raceItems = query.editions ? editions.length : groups.length;
  const racePages = Math.max(1, Math.ceil(raceItems / perPage));
  const racePage = Math.min(query.rpage, racePages);
  const from = (racePage - 1) * perPage;

  const tooShort = query.sname.length > 0 && runners === null && races === null;
  const failed = Boolean(runners?.error || races?.error);
  const searched = runners !== null || races !== null;
  const showRaces = wantRaces && editions.length > 0;
  const showRunners = wantRunners && runnerRows.length > 0;
  const nothingFound = searched && !failed && !showRaces && !showRunners;
  const count = (n: number) => formatCount(n, locale) ?? String(n);

  return (
    <div className="container pb-12">
      <h1 className="sr-only">{t("title")}</h1>
      <SearchSentence key={searchHref(query)} query={query} countries={countries} />

      {tooShort && (
        <EmptyState className="mt-6">
          {t("typeMore", { count: query.type === "event" ? MIN_EVENT_CHARS : MIN_RUNNER_CHARS })}
        </EmptyState>
      )}
      {failed && <EmptyState className="mt-6">{t("failed")}</EmptyState>}
      {nothingFound && (
        <EmptyState className="mt-6">
          {isIdQuery(query.sname) ? t("noId", { id: query.sname }) : t("nothing", { query: query.sname })}
        </EmptyState>
      )}

      {(showRaces || showRunners) && (
        <p className="mt-4 flex flex-wrap gap-x-4 text-sm text-fg-muted">
          {wantRunners && (
            <span>
              {showRunners ? (
                <a href="#runners" className="font-medium">
                  {t("tallyRunners", { count: runnerTotal, shown: count(runnerTotal) })}
                </a>
              ) : (
                t("noRunners")
              )}
            </span>
          )}
          {wantRaces && (
            <span>
              {showRaces ? (
                <a href="#races" className="font-medium">
                  {t("tallyRaces", { count: groups.length, shown: count(groups.length) })}
                </a>
              ) : (
                t("noRaces")
              )}
            </span>
          )}
        </p>
      )}

      {showRaces && (
        <section aria-labelledby="races" className="mt-6">
          <div className={sectionHead}>
            <h2 id="races" className={sectionTitle}>
              {t("races")}
            </h2>
            <span className="text-sm text-fg-muted">
              {query.editions
                ? t("editionsNote", { count: editions.length, shown: count(editions.length) })
                : t("groupsNote", { count: editions.length, shown: count(editions.length) })}
            </span>
            <Link
              href={`${searchHref({ ...query, editions: !query.editions, rpage: 1 })}#races`}
              className="ms-auto inline-flex min-h-11 items-center text-sm md:min-h-0"
            >
              {query.editions ? t("groupEditions") : t("everyEdition")}
            </Link>
          </div>
          {query.editions ? (
            <EditionTable rows={editions.slice(from, from + perPage)} />
          ) : (
            <table className={tableClass}>
              <caption className="sr-only">{t("raceCaption")}</caption>
              <thead>
                <tr>
                  <th scope="col" className={cn(headCell, "hidden w-[6.5rem] md:table-cell")}>
                    {t("col.latestNext")}
                  </th>
                  <th scope="col" className={headCell}>
                    {t("col.race")}
                  </th>
                  <th scope="col" className={cn(headCell, "hidden md:table-cell")}>
                    {t("col.where")}
                  </th>
                  <th scope="col" className={cn(headCell, "hidden md:table-cell")}>
                    {t("col.distances")}
                  </th>
                  <th scope="col" className={cn(headCell, "hidden text-end lg:table-cell")}>
                    {t("col.editions")}
                  </th>
                  <th scope="col" className={cn(headCell, "hidden lg:table-cell")}>
                    {t("col.finishersPerEdition")}
                  </th>
                  <th scope="col" className={cn(headCell, "hidden text-end lg:table-cell")}>
                    {t("col.lastField")}
                  </th>
                </tr>
              </thead>
              <tbody>
                <RaceRows races={groups.slice(from, from + perPage).map(withoutEditions)} />
              </tbody>
            </table>
          )}
          <Pagination
            page={racePage}
            pageCount={racePages}
            hrefForPage={(p) => `${searchHref({ ...query, rpage: p })}#races`}
            className="mt-4"
          />
        </section>
      )}

      {showRunners && (
        <section aria-labelledby="runners" className="mt-8">
          <div className={sectionHead}>
            <h2 id="runners" className={sectionTitle}>
              {t("runners")}
            </h2>
            <span className="text-sm text-fg-muted tabular">{count(runnerTotal)}</span>
          </div>
          <RunnerTable rows={runnerRows} />
          <Pagination
            page={runnerPage}
            pageCount={runnerMaxPage}
            hrefForPage={(p) => `${searchHref({ ...query, page: p })}#runners`}
            className="mt-4"
          />
          {runnersCapped && (
            <p className="mt-3 text-sm text-fg-muted">{t("capped", { count: count(runnerMaxPage * RUNNERS_PER_PAGE) })}</p>
          )}
        </section>
      )}
    </div>
  );
}
