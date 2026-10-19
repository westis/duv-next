// TEMPORARY: checks the record engine against live data on the preview. Removed before merge.
import { NextResponse } from "next/server";
import { getEventResults } from "@/lib/duv";
import { getGomuRecords, getIauRecords, getRaceMarkers, getRecordBook, isDisciplineKeyCheck } from "./helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dist = url.searchParams.get("dist") ?? "100km";
  const event = url.searchParams.get("event");
  const out: Record<string, unknown> = {};
  if (url.searchParams.has("sources")) {
    const iau = await getIauRecords();
    out.iau = iau && { count: iau.records.length, pending: iau.records.filter((r) => r.status === "pending").length, updated: iau.updated, warnings: iau.warningCount, sample: iau.records.slice(0, 3) };
    const gomu = await getGomuRecords();
    out.gomu = gomu && { count: gomu.records.length, warnings: gomu.warningCount, sample: gomu.records.slice(0, 3) };
  }
  if (isDisciplineKeyCheck(dist) && url.searchParams.has("book")) {
    const book = await getRecordBook(dist, ["SWE", "USA"]);
    out.book = {
      duv: book.duv.length,
      worldOpen: book.duv.filter((d) => d.scope === "world" && d.category === "Overall").map((d) => `${d.gender} ${d.eventId}:${d.personId} ${d.perfRaw} ${d.lastName}`),
      worldBands: book.duv.filter((d) => d.scope === "world" && d.category !== "Overall").map((d) => `${d.gender}${d.category} ${d.eventId}:${d.personId} ${d.perfRaw} ${d.lastName}`),
      nationOpen: book.duv.filter((d) => d.scope === "nation" && d.category === "Overall").map((d) => `${d.scopeCode} ${d.gender} ${d.eventId}:${d.personId} ${d.perfRaw} ${d.lastName}`),
      ratified: book.ratified.length,
      matchedRun: book.ratified.filter((r) => r.matchedBy === "run").length,
      matchedHolder: book.ratified.filter((r) => r.matchedBy === "holder").length,
      unmatched: book.ratified.filter((r) => !r.personId).map((r) => `${r.status} ${r.gender} ${r.scopeCode} ${r.category} ${r.holder} ${r.perfRaw} ${r.date}`),
      updated: book.updated,
    };
  }
  if (url.searchParams.has("raw")) {
    const { getIntBestList } = await import("@/lib/duv");
    try {
      const variants: Record<string, Record<string, string | number | boolean>> = {
        a: { year: "all", dist, gender: "M", plain: true, perpage: 5 },
        b: { year: "all", dist, gender: "M", cat: "all", plain: true, perpage: 5 },
        c: { year: "all", dist, gender: "M", cat: "all", nat: "all", perpage: 5 },
        d: { year: "all", dist, gender: "M" },
        e: { year: "all", dist, gender: "M", perpage: 100 },
        f: { year: "all", dist, gender: "M", cat: "M", perpage: 5 },
        g: { year: 2024, dist, gender: "M", perpage: 5 },
      };
      const raw: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(variants)) {
        try {
          const data = (await getIntBestList(v, { revalidate: false })) as unknown as Record<string, unknown> | null;
          const list = (data?.RankingList as unknown[] | undefined) ?? [];
          raw[k] = { keys: data && Object.keys(data).slice(0, 12), n: list.length, first: list[0], pag: data?.Pagination };
        } catch (e) {
          raw[k] = String(e);
        }
      }
      out.raw = raw;
    } catch (e) {
      out.rawError = String(e);
    }
  }
  if (event) {
    const res = await getEventResults({ event, perpage: 200 });
    const rows = (res?.Resultlist ?? []).map((r) => ({ eventId: event, personId: r.PersonID, perf: r.Performance, gender: r.Gender, nat: r.Nationality, cat: r.Cat }));
    const m = await getRaceMarkers(event, rows);
    out.markers = Object.fromEntries(m.records);
    out.course = Object.fromEntries(m.course);
  }
  return NextResponse.json(out);
}
