// File path: app/api/events/route.ts

import { NextResponse } from "next/server";

// Remove or comment out the unused eventTypes object
// const eventTypes = {
//   "Fixed-Distance": ["1", "2", "4", "8"],
//   "Fixed-Time": ["6h", "12h", "24h", "48h", "72h", "6d", "10d"],
//   "Backyard Ultra": ["Backy"],
//   "Elimination Race": ["Elim"],
//   "Stage Race": ["Stage"],
//   Walking: ["Walk"],
//   Other: ["Other"],
// };

async function fetchEvents(baseUrl: string, dist: string) {
  const url = `${baseUrl}&dist=${dist}`;
  console.log("Fetching from URL:", url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const text = await response.text();
  console.log("Raw response:", text.slice(0, 200) + "...");
  try {
    if (!text.trim() || text.trim() === "null") {
      return [];
    }
    const data = JSON.parse(text);
    return data.Races
      ? data.Races.map((race: Record<string, unknown>) => ({
          ...race,
          Results: race.Results || "N", // Ensure Results field is always present
        }))
      : [];
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return [];
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
  const perpage = searchParams.get("perpage") || "20";

  // Validate parameters
  if ((from && !to) || (!from && to)) {
    return NextResponse.json(
      {
        error:
          "Both 'from' and 'to' must be provided for date range filtering.",
      },
      { status: 400 }
    );
  }

  if (from && to && year) {
    return NextResponse.json(
      { error: "'year' cannot be used with 'from' and 'to'." },
      { status: 400 }
    );
  }

  const order = searchParams.get("order") || "asc";

  let baseUrl = `https://statistik.d-u-v.org/json/mcalendar.php?plain=1&perpage=${perpage}&Language=EN`;

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
    const allEvents = await Promise.all(
      distValues.map((dist) => fetchEvents(baseUrl, dist))
    );

    const events = allEvents.flat();

    // Sort all events by date
    events.sort((a, b) => {
      return order === "asc"
        ? new Date(a.Startdate).getTime() - new Date(b.Startdate).getTime()
        : new Date(b.Startdate).getTime() - new Date(a.Startdate).getTime();
    });

    console.log(`Processed ${events.length} events`);
    return NextResponse.json(events);
  } catch (error: unknown) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch events",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
