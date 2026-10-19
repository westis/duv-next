import { NextResponse } from "next/server";
import { getCalendar, type CalendarParams } from "@/lib/duv";

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

  const params: CalendarParams = {
    plain: true,
    perpage: Number(perpage),
    page: Number(page),
    order: order === "desc" ? "desc" : "asc",
    dist: dist || "all",
    country: country || undefined,
    rproof: rproof === "1" || undefined,
    norslt: norslt === "1" || undefined,
  };

  if (from && to) {
    params.from = from;
    params.to = to;
  } else {
    params.year = year || "futur";
  }

  try {
    const data = await getCalendar(params);
    const events = (data?.Races ?? []).map((race) => ({
      ...race,
      Results: race.Results || "N",
    }));
    const totalHitCount = data?.HitCnt ?? 0;

    const pagination = data?.Pagination || {
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
