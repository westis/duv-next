"use client";

import React, { useState } from "react";
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
  const [activeTab, setActiveTab] = useState("performances");
  const { runnerInfo, loading, error } = useRunnerProfile(params.personId);

  if (loading) return <div>Loading runner details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!runnerInfo) return <div>No runner information found.</div>;

  return (
    <div className="w-full max-w-full mx-auto px-4 py-8">
      <RunnerHeader runnerInfo={runnerInfo.PersonHeader} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="performances" className="text-lg font-semibold">
            Performances
          </TabsTrigger>
          <TabsTrigger value="personalBests" className="text-lg font-semibold">
            Personal Bests
          </TabsTrigger>
          <TabsTrigger value="comparisons" className="text-lg font-semibold">
            Race Comparisons
          </TabsTrigger>
        </TabsList>
        <TabsContent value="performances">
          <Card className="bg-card border-t-4 border-t-primary shadow-none">
            <CardContent className="p-2">
              <PerformancesTable performances={runnerInfo.AllPerfs} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="personalBests">
          <Card className="bg-card border-t-4 border-t-secondary">
            <CardContent className="p-2">
              <PersonalBestsTable personalBests={runnerInfo.AllPBs} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comparisons">
          <Card className="bg-card border-t-4 border-t-accent">
            <CardContent className="p-2">
              <RaceComparisonsTable comparisons={runnerInfo.CompTable} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
