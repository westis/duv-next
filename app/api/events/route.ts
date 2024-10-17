import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const order = searchParams.get("order");
  const eventType = searchParams.get("eventType");
  const country = searchParams.get("country");
  const rproof = searchParams.get("rproof");
  const norslt = searchParams.get("norslt");

  // Construct the URL for the DUV API
  let apiUrl = "https://statistik.d-u-v.org/json/mcalendar.php?";

  if (year) apiUrl += `year=${year}&`;
  if (from && to) apiUrl += `from=${from}&to=${to}&`;
  if (order) apiUrl += `order=${order}&`;
  if (eventType) apiUrl += `dist=${eventType}&`;
  if (country) apiUrl += `country=${country}&`;
  if (rproof) apiUrl += `rproof=${rproof}&`;
  if (norslt) apiUrl += `norslt=${norslt}&`;

  // Add default parameters
  apiUrl += "plain=1&perpage=20&Language=EN";

  console.log("Fetching from URL:", apiUrl);

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    console.log("Received raw data:", text.slice(0, 500) + "...");

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON response from API", rawData: text },
        { status: 500 }
      );
    }

    console.log(
      "Parsed data structure:",
      JSON.stringify(data, null, 2).slice(0, 500) + "..."
    );

    // Check if data is an object with a Races property
    const events =
      data && data.Races && Array.isArray(data.Races) ? data.Races : [];
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
