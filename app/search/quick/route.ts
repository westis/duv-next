import { NextResponse, type NextRequest } from "next/server";
import { quickSearch } from "@/components/features/search/data";

/**
 * The header's quick search: runners and grouped races for `?q=`, as JSON.
 * DUV answers are cached for five minutes, so the CDN may keep them as long.
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  const result = await quickSearch(q);
  return NextResponse.json(result, {
    headers: result.error ? { "Cache-Control": "no-store" } : { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
