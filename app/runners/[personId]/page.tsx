import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RunnerHeader } from "@/components/RunnerHeader";
import PerformancesTable from "@/components/PerformancesTable";
import PersonalBestsTable from "@/components/PersonalBestsTable";
import RaceComparisonsTable from "@/components/RaceComparisonsTable";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ personId: string }>;
}

async function getRunnerProfile(personId: string) {
  const url = new URL(`/api/runnerProfile`, "http://localhost:3000");
  url.searchParams.set("personId", personId);
  console.log("Fetching runner profile from:", url.toString());

  const res = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error("Failed to fetch runner profile. Status:", res.status);
    console.error("Response text:", await res.text());
    throw new Error(`Failed to fetch runner profile. Status: ${res.status}`);
  }

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
      <div className="container mx-auto px-4 py-8 space-y-8">
        <RunnerHeader runnerInfo={runnerInfo.PersonHeader} />

        <Tabs defaultValue="performances" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performances">Performances</TabsTrigger>
            <TabsTrigger value="personalBests">Personal Bests</TabsTrigger>
            <TabsTrigger value="comparisons">Race Comparisons</TabsTrigger>
          </TabsList>
          <TabsContent value="performances">
            <Card>
              <CardHeader>
                <CardTitle>Performances</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Suspense fallback={<div>Loading performances...</div>}>
                    <PerformancesTable performances={runnerInfo.AllPerfs} />
                  </Suspense>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="personalBests">
            <Card>
              <CardHeader>
                <CardTitle>Personal Bests</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Suspense fallback={<div>Loading personal bests...</div>}>
                    <PersonalBestsTable personalBests={runnerInfo.AllPBs} />
                  </Suspense>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="comparisons">
            <Card>
              <CardHeader>
                <CardTitle>Race Comparisons</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Suspense fallback={<div>Loading race comparisons...</div>}>
                    <RaceComparisonsTable comparisons={runnerInfo.CompTable} />
                  </Suspense>
                </ScrollArea>
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
