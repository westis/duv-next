import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DuvApiError, getRunnerProfile } from "@/lib/duv";
import { RunnerHeader } from "@/components/features/runners/RunnerHeader";
import { PerformancesList } from "@/components/features/runners/PerformancesList";
import { PersonalBestsTable } from "@/components/features/runners/PersonalBestsTable";
import { RaceComparisonsTable } from "@/components/features/runners/RaceComparisonsTable";
import {
  IauLabelToggle,
  ProfileTabs,
} from "@/components/features/runners/ProfileControls";
import {
  PROFILE_TABS,
  type ProfileTab,
} from "@/components/features/runners/format";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ personId: string }>;
  searchParams: Promise<{ label?: string; tab?: string }>;
}

const loadProfile = cache(async (personId: string, label: boolean) => {
  if (!/^\d+$/.test(personId)) return null;
  try {
    const data = await getRunnerProfile({
      runner: personId,
      label: label || undefined,
    });
    return data?.PersonHeader ? data : null;
  } catch (error) {
    // The live API answers an unknown runner ID with a body that is not
    // valid JSON, which the client reports as a 502.
    if (error instanceof DuvApiError && error.status === 502) return null;
    throw error;
  }
});

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { personId } = await params;
  const { label } = await searchParams;
  try {
    const profile = await loadProfile(personId, label === "1");
    if (profile) {
      const name = profile.PersonHeader.PersonName;
      return {
        title: `${name} - Runner Profile`,
        description: `Ultra running results and personal bests of ${name}`,
      };
    }
  } catch (error) {
    console.error("Error generating runner metadata:", error);
  }
  return {
    title: "Runner Profile",
    description: "View runner profile and performance history",
  };
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-muted-foreground">{children}</p>;
}

export default async function RunnerPage({ params, searchParams }: PageProps) {
  const { personId } = await params;
  const { label, tab } = await searchParams;
  const labelOnly = label === "1";
  const activeTab: ProfileTab = PROFILE_TABS.includes(tab as ProfileTab)
    ? (tab as ProfileTab)
    : "performances";

  const profile = await loadProfile(personId, labelOnly);
  if (!profile) notFound();

  const nls = profile.nlsText ?? {};
  const perfs = profile.AllPerfs ?? [];
  const pbs = profile.AllPBs ?? [];
  const comparisons = profile.CompTable ?? [];
  const emptyText = labelOnly
    ? "No results in IAU-labelled races."
    : "No results.";

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <RunnerHeader header={profile.PersonHeader} nls={nls} />

      <div className="flex justify-end">
        <IauLabelToggle checked={labelOnly} />
      </div>

      <ProfileTabs
        tab={activeTab}
        labels={{
          performances: nls.nlsListOfRaces ?? "Performances",
          pbs: nls.nlsPersonalBest ?? "Personal bests",
          comparison: nls.nlsCompTable ?? "Comparison table",
        }}
        panels={{
          performances: perfs.length ? (
            <PerformancesList years={perfs} />
          ) : (
            <Empty>{emptyText}</Empty>
          ),
          pbs: (
            <Card>
              <CardContent className="pt-6">
                {pbs.length ? (
                  <PersonalBestsTable
                    personalBests={pbs}
                    note={nls.nlsRankinYearIntNat}
                  />
                ) : (
                  <Empty>{emptyText}</Empty>
                )}
              </CardContent>
            </Card>
          ),
          comparison: (
            <Card>
              <CardContent className="pt-6">
                {comparisons.length ? (
                  <RaceComparisonsTable
                    comparisons={comparisons}
                    note={nls.nlsCompParticipation}
                  />
                ) : (
                  <Empty>No races with more than one participation.</Empty>
                )}
              </CardContent>
            </Card>
          ),
        }}
      />
    </div>
  );
}
