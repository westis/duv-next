import "server-only";

import { duvFetch, type DuvFetchOptions } from "./client";
import type {
  AuthTestResponse,
  BestPerfCountryResponse,
  CalendarResponse,
  DuvGender,
  DuvLanguage,
  EventDetailResponse,
  EventResultsResponse,
  EventSearchResponse,
  RankingResponse,
  RunnerProfileResponse,
  RunnerSearchResponse,
  TopRankAbroadResponse,
} from "./types";

// One typed function per DUV JSON endpoint. Parameter names match the API.
// Every function defaults `language` to EN.

interface LanguageParam {
  language?: DuvLanguage;
}

interface ListParams extends LanguageParam {
  /** Only list content, no filter lists or labels. */
  plain?: boolean;
  page?: number;
  perpage?: number;
}

const EN = { language: "EN" as const };

export function testAuth(opts?: DuvFetchOptions) {
  return duvFetch<AuthTestResponse>("testjson.php", {}, {
    revalidate: false,
    ...opts,
  });
}

export interface BestPerfCountryParams extends LanguageParam {
  nat: string;
  dist?: string;
  type?: string | number;
  /** e.g. "YOB" */
  cat?: string;
}

export function getBestPerfCountry(
  params: BestPerfCountryParams,
  opts?: DuvFetchOptions
) {
  return duvFetch<BestPerfCountryResponse>(
    "mbestperfcountry.php",
    { ...EN, ...params },
    { revalidate: 86400, ...opts }
  );
}

export interface CalendarParams extends ListParams {
  /** A year, "futur", or "past1". Not combined with from/to. */
  year?: string | number;
  dist?: string;
  country?: string;
  cups?: string;
  rproof?: boolean;
  mode?: string;
  radius?: string | number;
  norslt?: boolean;
  /** ISO date yyyy-mm-dd */
  from?: string;
  to?: string;
  /** Exclude splits/stages. */
  splits?: boolean;
  /** "IAU" for IAU label races only. */
  label?: string;
  order?: "asc" | "desc";
}

export function getCalendar(params: CalendarParams = {}, opts?: DuvFetchOptions) {
  return duvFetch<CalendarResponse>(
    "mcalendar.php",
    { ...EN, ...params },
    { revalidate: 300, ...opts }
  );
}

export function getEventDetail(
  params: { event: string | number } & LanguageParam,
  opts?: DuvFetchOptions
) {
  return duvFetch<EventDetailResponse>(
    "meventdetail.php",
    { ...EN, ...params },
    { revalidate: 3600, ...opts }
  );
}

export interface IntBestListParams extends ListParams {
  year?: string | number;
  dist?: string;
  gender?: DuvGender;
  cat?: string;
  nat?: string;
  /** e.g. "IAU" */
  label?: string;
  /** e.g. "netto" */
  tt?: string;
}

export function getIntBestList(
  params: IntBestListParams = {},
  opts?: DuvFetchOptions
) {
  return duvFetch<RankingResponse>(
    "mgetintbestlist.php",
    { ...EN, ...params },
    { revalidate: 3600, ...opts }
  );
}

export interface BackyardRankingParams extends ListParams {
  year?: string | number;
  gender?: DuvGender;
  cat?: string;
  nat?: string;
}

export function getBackyardRanking(
  params: BackyardRankingParams = {},
  opts?: DuvFetchOptions
) {
  return duvFetch<RankingResponse>(
    "mrankingbackyard.php",
    { ...EN, ...params },
    { revalidate: 3600, ...opts }
  );
}

export interface EventResultsParams extends ListParams {
  event: string | number;
  cat?: string;
  country?: string;
  speed?: boolean;
  aktype?: number;
  jsonescape?: boolean;
}

export function getEventResults(
  params: EventResultsParams,
  opts?: DuvFetchOptions
) {
  return duvFetch<EventResultsResponse>(
    "mgetresultevent.php",
    { ...EN, ...params },
    { revalidate: 3600, ...opts }
  );
}

export interface RunnerProfileParams extends LanguageParam {
  runner: string | number;
  plain?: boolean;
  /** Only IAU labelled races. */
  label?: boolean;
}

export function getRunnerProfile(
  params: RunnerProfileParams,
  opts?: DuvFetchOptions
) {
  return duvFetch<RunnerProfileResponse>(
    "mgetresultperson.php",
    { ...EN, ...params },
    { revalidate: 3600, ...opts }
  );
}

export interface EventSearchParams extends LanguageParam {
  /** Name, or comma separated filters e.g. "mors,100km,POL". A number is an EventID. */
  sname: string;
  dist?: string;
  nat?: string;
  jsonescape?: boolean;
  plain?: boolean;
}

export function searchEvents(params: EventSearchParams, opts?: DuvFetchOptions) {
  return duvFetch<EventSearchResponse>(
    "msearchevent.php",
    { ...EN, ...params },
    { revalidate: 300, ...opts }
  );
}

export interface RunnerSearchParams {
  /** Last name, or "Müller,Hans,GER". A number is a PersonID. */
  sname: string;
  fname?: string;
  nat?: string;
  exact?: boolean;
  fuzzy?: boolean;
  page?: number;
  perpage?: number;
  jsonescape?: boolean;
  plain?: boolean;
}

export function searchRunners(params: RunnerSearchParams, opts?: DuvFetchOptions) {
  return duvFetch<RunnerSearchResponse>(
    "msearchrunner.php",
    { ...EN, ...params },
    { revalidate: 300, ...opts }
  );
}

export interface TopRankAbroadParams extends LanguageParam {
  country: string;
  year?: string | number;
  dist?: string;
  /** Top N per race. */
  cnt?: number;
  gender?: DuvGender;
}

export function getTopRankAbroad(
  params: TopRankAbroadParams,
  opts?: DuvFetchOptions
) {
  return duvFetch<TopRankAbroadResponse>(
    "mtoprankabroad.php",
    { ...EN, ...params },
    { revalidate: 3600, ...opts }
  );
}
