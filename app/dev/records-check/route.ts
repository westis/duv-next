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
      nationOpen: book.duv.filter((d) => d.scope === "nation" && d.category === "Overall").map((d) => `${d.scopeCode} ${d.gender} ${d.eventId}:${d.personId} ${d.perfRaw} ${d.lastName}`),
      ratified: book.ratified.length,
      matchedRun: book.ratified.filter((r) => r.matchedBy === "run").length,
      matchedHolder: book.ratified.filter((r) => r.matchedBy === "holder").length,
      unmatched: book.ratified.filter((r) => !r.personId).map((r) => `${r.status} ${r.gender} ${r.scopeCode} ${r.category} ${r.holder} ${r.perfRaw} ${r.date}`),
      updated: book.updated,
    };
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
