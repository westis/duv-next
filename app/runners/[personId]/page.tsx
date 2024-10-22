"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useRunnerProfile } from "@/hooks/useRunnerProfile";
import { RunnerHeader } from "@/components/RunnerHeader";
import PerformancesTable from "@/components/PerformancesTable";
import PersonalBestsTable from "@/components/PersonalBestsTable";
import RaceComparisonsTable from "@/components/RaceComparisonsTable";

export default function RunnerPage({
  params,
}: {
  params: { personId: string };
}) {
  const searchParams = useSearchParams();
  const initialActiveTab = useMemo(
    () => searchParams.get("tab") || "performances",
    [searchParams]
  );
  const [activeTab, setActiveTab] = useState(initialActiveTab);

  const { runnerInfo, loading, error } = useRunnerProfile(params.personId);

  useEffect(() => {
    // Update URL when tab changes
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("tab", activeTab);
    window.history.pushState({}, "", newUrl.toString());
  }, [activeTab]);

  if (loading) return <div>Loading runner details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!runnerInfo) return <div>No runner information found.</div>;

  return (
    <div className="w-full max-w-full mx-auto px-4 py-8">
      <RunnerHeader runnerInfo={runnerInfo.PersonHeader} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="performances">Performances</TabsTrigger>
          <TabsTrigger value="personalBests">Personal Bests</TabsTrigger>
          <TabsTrigger value="comparisons">Race Comparisons</TabsTrigger>
        </TabsList>
        <TabsContent value="performances">
          <PerformancesTable performances={runnerInfo.AllPerfs} />
        </TabsContent>
        <TabsContent value="personalBests">
          <Card>
            <CardContent>
              <PersonalBestsTable personalBests={runnerInfo.AllPBs} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comparisons">
          <Card>
            <CardContent>
              <RaceComparisonsTable comparisons={runnerInfo.CompTable} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
