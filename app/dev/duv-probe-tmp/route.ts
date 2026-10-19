// TEMPORARY probe for exploring the DUV API from the preview. Removed before the PR.
import { duvFetch, type DuvEndpoint } from "@/lib/duv";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ep = url.searchParams.get("ep") ?? "";
  if (!/^m[a-z]+\.php$/.test(ep)) return new Response("bad ep", { status: 400 });
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    if (k !== "ep") params[k] = v;
  });
  try {
    const data = await duvFetch(ep as DuvEndpoint, params, { revalidate: false, acceptErrorStatusWithJson: true });
    return Response.json(data);
  } catch (e) {
    return new Response(String(e), { status: 502 });
  }
}
