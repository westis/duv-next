import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { RunnerHeader } from "@/components/RunnerHeader";
import PerformancesTable from "@/components/PerformancesTable";
import PersonalBestsTable from "@/components/PersonalBestsTable";
import RaceComparisonsTable from "@/components/RaceComparisonsTable";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ personId: string }>;
}

async function getRunnerProfile(personId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/runnerProfile?personId=${personId}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("Failed to fetch runner profile");
  return res.json();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { personId } = await params;
  try {
    const runnerInfo = await getRunnerProfile(personId);
    return {
      title: `Runner Profile - ${runnerInfo.PersonHeader.PersonName}`,
      description: `View the profile and performance history of ${runnerInfo.PersonHeader.PersonName}`,
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Runner Profile",
      description: "View runner profile and performance history",
    };
  }
}

export default async function RunnerPage({ params }: PageProps) {
  const { personId } = await params;

  try {
    const runnerInfo = await getRunnerProfile(personId);

    return (
      <div className="w-full max-w-full mx-auto px-4 py-8">
        <RunnerHeader runnerInfo={runnerInfo.PersonHeader} />

        <Tabs defaultValue="performances" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="performances">Performances</TabsTrigger>
            <TabsTrigger value="personalBests">Personal Bests</TabsTrigger>
            <TabsTrigger value="comparisons">Race Comparisons</TabsTrigger>
          </TabsList>
          <TabsContent value="performances">
            <Suspense fallback={<div>Loading performances...</div>}>
              <PerformancesTable performances={runnerInfo.AllPerfs} />
            </Suspense>
          </TabsContent>
          <TabsContent value="personalBests">
            <Card>
              <CardContent>
                <Suspense fallback={<div>Loading personal bests...</div>}>
                  <PersonalBestsTable personalBests={runnerInfo.AllPBs} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="comparisons">
            <Card>
              <CardContent>
                <Suspense fallback={<div>Loading race comparisons...</div>}>
                  <RaceComparisonsTable comparisons={runnerInfo.CompTable} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Error fetching runner profile:", error);
    notFound();
  }
}
