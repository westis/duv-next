// TEMPORARY: inspect the live DUV payload on the preview. Removed before the branch is final.
import { getEventDetail, getRunnerProfile } from "@/lib/duv";

export async function GET(req: Request, { params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const event = new URL(req.url).searchParams.get("event");
  const data = event
    ? await getEventDetail({ event })
    : await getRunnerProfile({ runner: personId });
  return Response.json(data);
}
