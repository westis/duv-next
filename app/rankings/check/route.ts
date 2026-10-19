// TEMPORARY: raw DUV responses for the rankings bugs. Remove before merge.
import { buildDuvUrl } from "@/lib/duv/client";

export const dynamic = "force-dynamic";

const CASES: Record<string, string>[] = [
  { year: "2026", dist: "100km", gender: "W" },
  { year: "2026", dist: "100km", gender: "F" },
  { year: "2026", dist: "100km", gender: "all" },
  { year: "2026", dist: "100km" },
  { year: "2026", dist: "24h", gender: "W" },
  { year: "2026", dist: "24h", gender: "M" },
  { year: "all", dist: "100km" },
  { year: "all", dist: "100km", gender: "W" },
  { year: "all", dist: "24h" },
  { year: "all", dist: "50km" },
  { year: "2026", dist: "100km", label: "IAU" },
  { year: "2025", dist: "100km", gender: "W" },
];

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const endpoint = q.get("ep") === "backyard" ? "mrankingbackyard.php" : "mgetintbestlist.php";
  const cases = q.getAll("p").length ? q.getAll("p").map((p) => Object.fromEntries(new URLSearchParams(p))) : CASES;
  const out = await Promise.all(cases.map(async (c) => {
    const url = buildDuvUrl(endpoint, { language: "EN", page: 1, perpage: Number(q.get("pp") || 5), ...c });
    const t0 = Date.now();
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", Authorization: `Bearer ${process.env.DUV_API_KEY}` },
        cache: "no-store",
      });
      const text = await res.text();
      let rows: unknown = null;
      let keys: unknown = null;
      let sample: unknown = null;
      let pag: unknown = null;
      try {
        const j = JSON.parse(text.replace(/^﻿/, ""));
        keys = Object.keys(j);
        rows = Array.isArray(j.RankingList) ? j.RankingList.length : j.RankingList;
        sample = Array.isArray(j.RankingList) ? j.RankingList.slice(0, Number(q.get("n") || 2)) : null;
        pag = j.Pagination;
        if (q.get("labels")) pag = { pag, v: j.FltCountryValues?.slice(0, 8), l: j.FltCountryLabels?.slice(0, 8), y: j.FltYearlist, cats: j.FltAgeCat };
      } catch {
        /* not json */
      }
      return ({ c, status: res.status, ms: Date.now() - t0, len: text.length, head: rows === null || q.get("head") ? (q.get("tail") ? text.slice(-Number(q.get("hl") || 600)) : null) ?? text.slice(0, Number(q.get("hl") || 600)) : undefined, keys, rows, pag, sample });
    } catch (e) {
      return { c, error: String(e) };
    }
  }));
  return Response.json(q.get("labels") ? { out } : out);
}
