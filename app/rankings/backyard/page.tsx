import { RankingPage, rankingMetadata } from "@/components/features/rankings/RankingPage";
import type { SearchParams } from "@/components/features/rankings/params";

// A list DUV's server fails on is put together from up to 30 smaller lists.
export const maxDuration = 60;

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export function generateMetadata({ searchParams }: PageProps) {
  return rankingMetadata(searchParams, true);
}

export default function BackyardRankingsPage({ searchParams }: PageProps) {
  return <RankingPage searchParams={searchParams} backyard />;
}
