// TEMPORARY: raw DUV responses for building the calendar. Removed before handoff.
import { NextResponse } from "next/server";
import { getCalendar, getIntBestList, getEventResults, getBackyardRanking } from "@/lib/duv";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const p = Object.fromEntries(u.searchParams.entries());
  const ep = p.ep;
  delete p.ep;
  try {
    const data =
      ep === "best"
        ? await getIntBestList(p as never, { revalidate: 0 })
        : ep === "results"
          ? await getEventResults(p as never, { revalidate: 0 })
          : ep === "backyard"
            ? await getBackyardRanking(p as never, { revalidate: 0 })
            : await getCalendar(p as never, { revalidate: 0 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
