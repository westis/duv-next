// File path: app/api/events/route.ts

import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/utils";

async function fetchEvents(baseUrl: string, dist: string) {
  const url = `${getBaseUrl()}${baseUrl}&dist=${dist}`;
  console.log("Fetching from URL:", url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const text = await response.text();
  console.log("Raw response:", text.slice(0, 200) + "...");
  try {
    if (!text.trim() || text.trim() === "null") {
      return { events: [], hitCount: 0, pagination: null };
    }
    const data = JSON.parse(text);
    const events = data.Races
      ? data.Races.map((race: Record<string, unknown>) => ({
          ...race,
          Results: race.Results || "N",
        }))
      : [];
    return { events, hitCount: data.HitCnt || 0, pagination: data.Pagination };
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return { events: [], hitCount: 0, pagination: null };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const year = searchParams.get("year");
  const dist = searchParams.get("dist");
  const country = searchParams.get("country");
  const rproof = searchParams.get("rproof");
  const norslt = searchParams.get("norslt");
  const perpage = searchParams.get("perpage") || "10";
  const page = searchParams.get("page") || "1";

  if ((from && !to) || (!from && to)) {
    return new NextResponse(
      JSON.stringify({
        error:
          "Both 'from' and 'to' must be provided for date range filtering.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (from && to && year) {
    return new NextResponse(
      JSON.stringify({ error: "'year' cannot be used with 'from' and 'to'." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const order = searchParams.get("order") || "asc";

  let baseUrl = `https://statistik.d-u-v.org/json/mcalendar.php?plain=1&perpage=${perpage}&page=${page}&Language=EN`;

  if (from && to) {
    baseUrl += `&from=${from}&to=${to}&order=${order}`;
  } else {
    baseUrl += `&year=${year || "futur"}&order=${order}`;
  }

  if (country) baseUrl += `&country=${country}`;
  if (rproof) baseUrl += `&rproof=${rproof}`;
  if (norslt) baseUrl += `&norslt=${norslt}`;

  const distValues: string[] = dist && dist !== "all" ? [dist] : ["all"];

  try {
    const allEventsData = await Promise.all(
      distValues.map((dist) => fetchEvents(baseUrl, dist))
    );

    const events = allEventsData.flatMap((data) => data.events);
    const totalHitCount = allEventsData.reduce(
      (sum, data) => sum + data.hitCount,
      0
    );

    const pagination = allEventsData[0].pagination || {
      CurrPage: 1,
      MaxPage: 1,
    };

    events.sort((a, b) => {
      return order === "asc"
        ? new Date(a.Startdate).getTime() - new Date(b.Startdate).getTime()
        : new Date(b.Startdate).getTime() - new Date(a.Startdate).getTime();
    });

    console.log(
      `Processed ${totalHitCount} events, returning page ${pagination.CurrPage} of ${pagination.MaxPage}`
    );

    const responseData = {
      events: events,
      totalEvents: totalHitCount,
      totalPages: pagination.MaxPage,
      currentPage: pagination.CurrPage,
    };

    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=59",
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching events:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to fetch events",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
