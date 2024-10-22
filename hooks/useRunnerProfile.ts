import { useState, useEffect } from "react";

interface RunnerProfile {
  PersonHeader: {
    PersonName: string;
    Club: string;
    Residence: string;
    YOB: string;
    DOB: string;
    NationalityShort: string;
    NationalityLong: string;
    Flag: string;
    CatNAT: string;
    CatINT: string;
    TotalEvtCnt: string;
    TotalKm: string;
  };
  AllPerfs: Array<{
    Year: string;
    EvtCnt: string;
    KmSum: string;
    PerfsPerYear: Array<{
      EvtDate: string;
      EvtName: string;
      EvtDist: string;
      Perf: string;
      RankOverall: string;
      Gender: string;
      RankMW: string;
      Cat: string;
      RankCat: string;
    }>;
  }>;
  AllPBs: Record<
    string,
    {
      PB: string;
      [year: string]:
        | {
            Perf: string;
            RankIntNat: string;
          }
        | string;
    }
  >;
  CompTable: Array<{
    EvtID: string;
    EvtName: string;
    EvtCnt: string;
    [year: string]: string;
  }>;
}

export function useRunnerProfile(personId: string) {
  const [runnerInfo, setRunnerInfo] = useState<RunnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchRunnerProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/runnerProfile?personId=${personId}`,
          {
            signal: controller.signal,
          }
        );
        if (!response.ok) throw new Error("Failed to fetch runner data");
        const data = await response.json();
        if (isMounted) {
          setRunnerInfo(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRunnerProfile();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [personId]);

  return { runnerInfo, loading, error };
}
