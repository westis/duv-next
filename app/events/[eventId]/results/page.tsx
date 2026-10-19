import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { DuvApiError, getEventResults } from "@/lib/duv";
import type { EventResultsResponse } from "@/lib/duv";
import { ResultsFilters } from "@/components/features/results/ResultsFilters";
import { ResultsTable } from "@/components/features/results/ResultsTable";
import { ResultsPagination } from "@/components/features/results/ResultsPagination";
import {
  hasActiveFilters,
  parseResultsQuery,
  zipOptions,
  type ResultsQuery,
} from "@/components/features/results/params";

interface PageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Loads one page of results. When a filter matches nothing the API can return
 * an empty body without the event header, so fall back to the unfiltered
 * header and filter lists and show an empty table.
 */
const loadResults = cache(
  async (
    eventId: string,
    queryKey: string
  ): Promise<{ data: EventResultsResponse; empty: boolean } | null> => {
    const query = JSON.parse(queryKey) as ResultsQuery;
    try {
      const data = await getEventResults({ event: eventId, ...query });
      if (data?.EvtHeader) {
        return { data, empty: !data.Resultlist?.length };
      }
      if (!hasActiveFilters(query)) return null;
      const fallback = await getEventResults({
        event: eventId,
        aktype: query.aktype,
        speed: query.speed,
        perpage: 1,
      });
      return fallback?.EvtHeader
        ? { data: { ...fallback, Resultlist: [], Pagination: undefined }, empty: true }
        : null;
    } catch (error) {
      // DUV answers 404 for hidden events and 400 for unknown ids
      if (error instanceof DuvApiError && (error.status === 404 || error.status === 400)) return null;
      throw error;
    }
  }
);

async function resolve({ params, searchParams }: PageProps) {
  const { eventId } = await params;
  if (!/^\d+$/.test(eventId)) return null;
  const query = parseResultsQuery(await searchParams);
  const result = await loadResults(eventId, JSON.stringify(query));
  return result && { eventId, query, ...result };
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const resolved = await resolve(props).catch(() => null);
  if (!resolved) {
    return {
      title: "Event Results",
      description: "View the results for this ultramarathon event.",
    };
  }
  const h = resolved.data.EvtHeader;
  return {
    title: `Results - ${h.EvtName}`,
    description: `Results for ${h.EvtName} held on ${h.EvtDate} in ${h.City}, ${h.Country}`,
  };
}

export default async function EventResultsPage(props: PageProps) {
  const resolved = await resolve(props);
  if (!resolved) notFound();

  const { eventId, query, data, empty } = resolved;
  const header = data.EvtHeader;
  const nls = data.nlsText ?? {};
  const rows = data.Resultlist ?? [];

  const speedOptions = zipOptions(data.FltSpeedTypeValue, data.FltSpeedTypeLabel);
  const speedUnit =
    speedOptions.find((o) => o.value === String(query.speed ?? 1))?.label ?? "km/h";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {header.AllTimeLink && (
          <ExternalLinkItem href={header.AllTimeLink}>
            {nls.nlsAlltimeResults || "All-time results of this event"}
          </ExternalLinkItem>
        )}
        {header.MultFinishLink && (
          <ExternalLinkItem href={header.MultFinishLink}>
            {nls.nlsMultipleFinishers || "Multiple Finishers"}
          </ExternalLinkItem>
        )}
      </div>

      <ResultsFilters
        query={query}
        catTypeOptions={zipOptions(data.FltCatTypeValue, data.FltCatTypeLabel)}
        catOptions={zipOptions(data.FltCatValues, data.FltCatLabels)}
        countryOptions={zipOptions(data.FltCountryValues, data.FltCountryLabels)}
        speedOptions={speedOptions}
        labels={{
          catType: "Category type",
          cat: nls.nlsAgeGroupShort || "Category",
          country: nls.nlsCountry || "Country",
          speed: nls.nlsAvgSpeed || "Avg. speed",
          perPage: "Per page",
        }}
      />

      {header.SearchRsltCnt && !empty && (
        <p className="mb-2 text-sm text-muted-foreground">{header.SearchRsltCnt}</p>
      )}

      {empty ? (
        <p className="rounded-md border p-8 text-center text-muted-foreground">
          {hasActiveFilters(query)
            ? "No results match these filters."
            : "No results have been recorded for this race yet."}
        </p>
      ) : (
        <>
          <ResultsTable
            rows={rows}
            nls={nls}
            speedLabel={`${nls.nlsAvgSpeed || "Avg. speed"} (${speedUnit})`}
          />
          <ResultsPagination
            basePath={`/events/${eventId}/results`}
            query={query}
            maxPage={data.Pagination?.MaxPage}
            rowCount={rows.length}
          />
        </>
      )}

      <ResultSource header={header} nls={nls} />
    </div>
  );
}

function ExternalLinkItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function ResultSource({
  header,
  nls,
}: {
  header: EventResultsResponse["EvtHeader"];
  nls: Record<string, string>;
}) {
  const items = [
    [nls.nlsResultSource || "Source", header.Resultsource],
    [nls.nlsRecordingBy || "Recorded by", [header.RecordedBy, header.RecordedAt].filter(Boolean).join(", ")],
    [nls.nlsValuation || "Status", header.Valuation],
  ].filter(([, value]) => value);
  if (!items.length) return null;

  return (
    <dl className="mt-6 grid gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-[auto_1fr]">
      {items.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="font-medium">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
