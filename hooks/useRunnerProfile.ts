import useSWR from "swr";

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useRunnerProfile(personId: string) {
  const { data, error } = useSWR<RunnerProfile>(
    `/api/runnerProfile?personId=${personId}`,
    fetcher
  );

  return {
    runnerInfo: data,
    loading: !error && !data,
    error: error,
  };
}
