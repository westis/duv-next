import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getCalendar,
  searchEvents,
  searchRunners,
  type EventSearchResponse,
  type RunnerSearchResponse,
} from "@/lib/duv";
import { cn } from "@/lib/utils";
import { SearchForm, type CountryOption } from "@/components/features/search/SearchForm";
import { RunnerResults } from "@/components/features/search/RunnerResults";
import { EventResults } from "@/components/features/search/EventResults";
import { SearchPagination } from "@/components/features/search/SearchPagination";
import {
  isIdQuery,
  parseSearchQuery,
  searchHref,
  type SearchQuery,
  type SearchType,
} from "@/components/features/search/params";

const PER_PAGE = 50;
/** Rows per section when showing runners and events together. */
const PREVIEW_COUNT = 10;
/** msearchevent.php needs at least 3 characters; runners work with 2. */
const MIN_EVENT_CHARS = 3;
const MIN_RUNNER_CHARS = 2;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { sname } = parseSearchQuery(await searchParams);
  return {
    title: sname ? `Search: ${sname}` : "Search",
    description: "Search the DUV database for ultra runners and events",
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

type Outcome<T> = { data: T | null; error: boolean } | null;

async function attempt<T>(fn: () => Promise<T | null>): Promise<Outcome<T>> {
  try {
    return { data: await fn(), error: false };
  } catch (error) {
    console.error("Search failed:", error);
    return { data: null, error: true };
  }
}

function runRunnerSearch(query: SearchQuery, preview: boolean) {
  if (query.sname.length < MIN_RUNNER_CHARS) return Promise.resolve(null);
  return attempt<RunnerSearchResponse>(() =>
    searchRunners({
      sname: query.sname,
      fname: query.fname || undefined,
      nat: query.nat || undefined,
      exact: query.exact || undefined,
      fuzzy: query.fuzzy || undefined,
      page: preview ? 1 : query.page,
      perpage: preview ? PREVIEW_COUNT : PER_PAGE,
    })
  );
}

function runEventSearch(query: SearchQuery) {
  if (query.sname.length < MIN_EVENT_CHARS && !isIdQuery(query.sname)) {
    return Promise.resolve(null);
  }
  return attempt<EventSearchResponse>(() =>
    searchEvents({
      sname: query.sname,
      dist: query.dist || undefined,
      nat: query.nat || undefined,
    })
  );
}

const TABS: { type: SearchType; label: string }[] = [
  { type: "all", label: "All" },
  { type: "runner", label: "Runners" },
  { type: "event", label: "Events" },
];

export default async function SearchPage({ searchParams }: PageProps) {
  const query = parseSearchQuery(await searchParams);
  const preview = query.type === "all";

  const [countries, runners, events] = await Promise.all([
    getCountries(),
    query.type !== "event" ? runRunnerSearch(query, preview) : null,
    query.type !== "runner" ? runEventSearch(query) : null,
  ]);

  const runnerHits = runners?.data?.Hitlist ?? [];
  const eventHits = events?.data?.Hitlist ?? [];
  const runnerTotal = runners?.data?.HitCnt ?? 0;
  const eventTotal = events?.data?.HitCnt ?? eventHits.length;

  // A numeric query is an ID: go straight to the one runner or event it names
  if (isIdQuery(query.sname)) {
    const runnerMatch = runnerHits.length === 1 ? runnerHits[0] : null;
    const eventMatch = eventHits.length === 1 ? eventHits[0] : null;
    if (runnerMatch && !eventHits.length) redirect(`/runners/${runnerMatch.PersonID}`);
    if (eventMatch && !runnerHits.length) redirect(`/events/${eventMatch.EventID}`);
  }

  const eventPages = Math.max(1, Math.ceil(eventHits.length / PER_PAGE));
  const eventPage = Math.min(query.page, eventPages);
  const shownEvents = preview
    ? eventHits.slice(0, PREVIEW_COUNT)
    : eventHits.slice((eventPage - 1) * PER_PAGE, eventPage * PER_PAGE);
  const shownRunners = preview ? runnerHits.slice(0, PREVIEW_COUNT) : runnerHits;
  // The API stops paging after a few hundred rows (500 by name, 400 fuzzy)
  const runnerMaxPage = runners?.data?.Pagination?.MaxPage ?? 1;
  const runnerPage = Math.min(query.page, runnerMaxPage);
  const runnersCapped = !preview && runnerTotal > runnerMaxPage * PER_PAGE;

  const tooShort =
    query.sname.length > 0 && runners === null && events === null;
  const failed = Boolean(runners?.error || events?.error);
  const searched = runners !== null || events !== null;
  const nothingFound =
    searched && !failed && runnerHits.length === 0 && eventHits.length === 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Search</h1>

      <nav className="flex gap-1 border-b" aria-label="Search type">
        {TABS.map((tab) => (
          <Link
            key={tab.type}
            href={searchHref({ ...query, type: tab.type, page: 1 })}
            aria-current={tab.type === query.type ? "page" : undefined}
            className={cn(
              "px-4 py-2 -mb-px border-b-2 text-sm font-medium",
              tab.type === query.type
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <SearchForm key={searchHref(query)} query={query} countries={countries} />

      {tooShort && (
        <p className="text-muted-foreground">
          Type at least {query.type === "event" ? MIN_EVENT_CHARS : MIN_RUNNER_CHARS}{" "}
          characters to search.
        </p>
      )}
      {failed && (
        <p className="text-destructive">
          The DUV database could not be reached. Please try again in a moment.
        </p>
      )}
      {nothingFound && (
        <p className="text-muted-foreground">
          Nothing found for &ldquo;{query.sname}&rdquo;.
        </p>
      )}

      {runnerHits.length > 0 && (
        <section className="space-y-2">
          <SectionHeading
            title="Runners"
            total={runnerTotal}
            moreHref={
              preview && runnerTotal > shownRunners.length
                ? searchHref({ ...query, type: "runner", page: 1 })
                : undefined
            }
          />
          <RunnerResults hits={shownRunners} />
          {!preview && (
            <SearchPagination
              page={runnerPage}
              maxPage={runnerMaxPage}
              hrefFor={(page) => searchHref({ ...query, page })}
            />
          )}
          {runnersCapped && (
            <p className="text-sm text-muted-foreground">
              The DUV database only pages through the first{" "}
              {(runnerMaxPage * PER_PAGE).toLocaleString("en")} matches. Add a
              first name or country to narrow the search.
            </p>
          )}
        </section>
      )}

      {eventHits.length > 0 && (
        <section className="space-y-2">
          <SectionHeading
            title="Events"
            total={eventTotal}
            moreHref={
              preview && eventHits.length > shownEvents.length
                ? searchHref({ ...query, type: "event", page: 1 })
                : undefined
            }
          />
          <EventResults hits={shownEvents} />
          {!preview && (
            <SearchPagination
              page={eventPage}
              maxPage={eventPages}
              hrefFor={(page) => searchHref({ ...query, page })}
            />
          )}
        </section>
      )}
    </div>
  );
}

function SectionHeading({
  title,
  total,
  moreHref,
}: {
  title: string;
  total: number;
  moreHref?: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-xl font-semibold">
        {title}{" "}
        <span className="text-base font-normal text-muted-foreground">
          ({total.toLocaleString("en")})
        </span>
      </h2>
      {moreHref && (
        <Link href={moreHref} className="text-sm font-medium hover:underline">
          Show all {title.toLowerCase()}
        </Link>
      )}
    </div>
  );
}
