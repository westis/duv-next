// TEMPORARY: dumps the raw DUV profile to inspect live fields. Remove before merge.
import { getRunnerProfile, searchRunners } from "@/lib/duv";

export async function GET(req: Request, { params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const q = new URL(req.url).searchParams.get("q");
  if (q) return Response.json(await searchRunners({ sname: q }));
  const data = await getRunnerProfile({ runner: personId });
  return Response.json(data);
}
