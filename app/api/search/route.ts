import { NextRequest, NextResponse } from "next/server";
import {
  searchEvents as searchDuvEvents,
  searchRunners as searchDuvRunners,
  type EventSearchHit,
  type RunnerSearchHit,
} from "@/lib/duv";

type SearchResult = {
  type: "runner" | "event";
  id: string;
  name: string;
  details: string;
  gender?: string;
  activeRange?: string;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const type = searchParams.get("type") || "all";

  if (!query) {
    return NextResponse.json({ results: [], totalHits: 0 });
  }

  console.log(`API Route - Search query: ${query}, Type: ${type}`);

  let results: SearchResult[] = [];
  let totalHits = 0;

  if (type === "all" || type === "runner") {
    const runnerResults = await searchRunners(query);
    results = [...results, ...runnerResults.results];
    totalHits += runnerResults.totalHits;
  }

  if (type === "all" || type === "event") {
    const eventResults = await searchEvents(query);
    results = [...results, ...eventResults.results];
    totalHits += eventResults.totalHits;
  }

  // If type is "all", ensure we have up to 5 results of each type
  if (type === "all") {
    const runnerResults = results
      .filter((r) => r.type === "runner")
      .slice(0, 5);
    const eventResults = results.filter((r) => r.type === "event").slice(0, 5);
    results = [...runnerResults, ...eventResults];
  } else {
    // If a specific type is selected, limit to 5 results total
    results = results.slice(0, 5);
  }

  console.log(`API Route - Results:`, results);
  return NextResponse.json({ results, totalHits });
}

async function searchRunners(
  query: string
): Promise<{ results: SearchResult[]; totalHits: number }> {
  try {
    const data = await searchDuvRunners({ sname: query, plain: true });
    const mappedResults = (data?.Hitlist || []).map((runner: RunnerSearchHit) => ({
      type: "runner" as const,
      id: runner.PersonID,
      name: `${runner.FirstName} ${runner.LastName}`,
      details: `${runner.Nationality}, ${runner.YOB}`,
      gender: runner.Gender,
      activeRange: runner.ActivRange,
    }));
    return { results: mappedResults, totalHits: data?.HitCnt ?? 0 };
  } catch (error) {
    console.error(`Error fetching runners:`, error);
    return { results: [], totalHits: 0 };
  }
}

async function searchEvents(
  query: string
): Promise<{ results: SearchResult[]; totalHits: number }> {
  try {
    const data = await searchDuvEvents({ sname: query, plain: true });
    const mappedResults = (data?.Hitlist || []).map((event: EventSearchHit) => ({
      type: "event" as const,
      id: event.EventID,
      name: event.EventName,
      details: `${event.Startdate.split(" ")[0]} • ${event.City}, ${
        event.Country
      }`,
    }));
    return { results: mappedResults, totalHits: data?.HitCnt ?? 0 };
  } catch (error) {
    console.error(`Error fetching events:`, error);
    return { results: [], totalHits: 0 };
  }
}
