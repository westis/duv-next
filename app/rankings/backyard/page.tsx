import { RankingPage, rankingMetadata } from "@/components/features/rankings/RankingPage";
import type { SearchParams } from "@/components/features/rankings/params";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export function generateMetadata({ searchParams }: PageProps) {
  return rankingMetadata(searchParams, true);
}

export default function BackyardRankingsPage({ searchParams }: PageProps) {
  return <RankingPage searchParams={searchParams} backyard />;
}
