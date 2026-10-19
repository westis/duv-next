import { DuvApiError } from "@/lib/duv";

export function RankingError({ error }: { error: unknown }) {
  const unauthorized = error instanceof DuvApiError && error.status === 401;
  return (
    <div className="rounded-md border border-destructive/50 p-4 text-sm">
      {unauthorized
        ? "The DUV statistics server refused the request (API key missing or invalid)."
        : "The rankings could not be loaded from the DUV statistics server. Please try again later."}
    </div>
  );
}
