// Response types for the DUV JSON API, based on sample responses in
// /instructions. The API returns most numbers as strings; types follow that.
// Fields not listed here may still be present.

export type DuvLanguage = "EN" | "DE" | "FR" | "IT" | "ES" | "RU" | "JA" | "ZH";
export type DuvGender = "all" | "M" | "W";

/** Language-specific GUI labels, present unless `plain=1`. */
export type NlsText = Record<string, string>;

export interface Pagination {
  CurrPage: number;
  MaxPage: number;
  PageSize: number;
  NextPageURL: string;
}

// testjson.php
export interface AuthTestResponse {
  success?: boolean;
  message?: string;
  client?: string;
  error?: string;
}

// mbestperfcountry.php
export interface BestPerfRecord {
  AK: string;
  Perf: string;
  PerfID: string;
  PersonID: string;
  FirstName: string;
  LastName: string;
  OrigName: string;
  DOB: string;
  YOB: string;
  Club: string;
  Nat: string;
  Privacy: string;
  EventID: string;
  Eventname: string;
  City: string;
  Country: string;
  Startdate: string;
  Enddate: string;
  Split: string;
}

export interface BestPerfCountryResponse {
  HitCnt: number;
  TitleW: string;
  TitleM: string;
  Disclaimer: string;
  /** Keyed by age class, e.g. "WOverall", "W40", "MOverall". */
  Records: Record<string, BestPerfRecord>;
}

// mcalendar.php
export interface CalendarRace {
  EventID: string;
  ParentID: string;
  PartOf: string;
  EventName: string;
  Edition: string;
  City: string;
  Country: string;
  EventType: string;
  /** "N" none, "C" complete, "P" partial. */
  Results: string;
  Length: string;
  Duration: string;
  IAULabel: string;
  Startdate: string;
  Enddate: string;
  Year: string;
  Month: string;
  Day: string;
  Cupname: string | null;
  CupYear: string | null;
}

export interface CalendarResponse {
  nlsText?: NlsText;
  URLs?: Record<string, string>;
  FltYearlist?: (string | number)[];
  FltCupValue?: string[];
  FltCupLabel?: string[];
  FltDistValue?: string[];
  FltDistLabel?: string[];
  FltEventTypes?: string[];
  FltCountryValues?: string[];
  FltCountryLabels?: string[];
  HitCnt?: number;
  Pagination?: Pagination;
  Races: CalendarRace[] | null;
}

// meventdetail.php
export interface EventDetails {
  EventID: string;
  PartOf: string;
  Edition: string;
  EventName: string;
  PromOrg: string;
  Contact: string;
  Address: string;
  Phone: string;
  Email: string;
  URL: string;
  EventType: string;
  Startdate: string;
  Enddate: string;
  Length: string;
  Duration: string;
  AltitudeDiff: string;
  Postcode: string;
  City: string;
  Country: string;
  StartLoc: string;
  CourseDesc: string;
  MoreInfo: string;
  TimeLimit: string;
  FieldLimit: string;
  Fee: string;
  IAULabel: string;
  RecordProof: string;
  FinisherM: string | null;
  FinisherW: string | null;
  ParentID: string;
  Display: string;
  Results: string;
  Diploma: string;
  ResultSource: string;
  Comments: string;
  CreatedBy: string;
  CreatedOn: string;
  ChangedBy: string;
  ChangedOn: string;
  DisplayPrio: string;
  // Seen in the meventdetail.php sample, not in msearchevent.php
  BinCat?: string;
  NormLen?: string;
  MethodVersion?: string;
  /** Start date as dd.mm.yyyy. */
  SDate?: string;
  CountryName?: string;
  /** Human-readable race type, e.g. "road race on a loop < 5km/3mi". */
  RaceType?: string;
}

export interface EventWinnerRow {
  EventID: string;
  PartOf: string;
  EventName: string;
  FinisherM: string;
  FinisherW: string;
  Year: string;
  SDate: string;
  Length: string;
  Duration: string;
  Results: string;
  /** Format "<rank>#<name> <performance>". */
  Winner_M: string;
  Winner_W: string;
}

/**
 * Shapes of `valuation`, `gpsTracks` and `raceReports` entries are not known
 * yet (every sample so far has empty arrays), so they are typed loosely.
 */
export type EventDetailListEntry = Record<string, string | number | null>;

export interface EventDetailResponse {
  nlsText?: NlsText;
  raceDetails: EventDetails | null;
  valuation: EventDetailListEntry[] | null;
  LinkURLs: Record<string, string> | null;
  winnerList: EventWinnerRow[] | null;
  gpsTracks: EventDetailListEntry[] | null;
  raceReports: EventDetailListEntry[] | null;
}

// mgetintbestlist.php and mrankingbackyard.php
export interface RankingEntry {
  PersonID: string;
  LastName: string;
  FirstName: string;
  OrigName: string;
  Nationality: string;
  Gender?: string;
  Privacy: string;
  ParentID: string;
  DOB_Display: string;
  DOBiso?: string;
  PerfID: string;
  Distance: string;
  CatInt: string;
  City: string;
  Country: string;
  EventID: string;
  EvtdateShort: string;
  Rank: number | string;
  Perf: string;
  CatRank: number | string;
  // international best list only
  Time?: string;
  PartOf?: string;
  EventType?: string;
  IAULabel?: string;
  Startdate?: string;
  AgeGradePerf?: string;
  // backyard only
  Laps?: string;
  EvtdateShortIso?: string;
}

export interface RankingResponse {
  nlsText?: NlsText;
  FltYearlist?: (string | number)[];
  FltDistValue?: string[];
  FltDistLabel?: string[];
  FltAgeCat?: string[];
  FltGenderValues?: string[];
  FltGenderLabels?: string[];
  FltCountryValues?: string[];
  FltCountryLabels?: string[];
  Pagination?: Pagination;
  RankingList: RankingEntry[] | null;
}

// mgetresultevent.php
export interface EventResultsHeader {
  EvtID: number | string;
  ParentID: string;
  PartOf: string;
  EvtDate: string;
  StartDate: string;
  EndDate: string;
  Edition: string;
  EventName: string;
  EvtName: string;
  City: string;
  Country: string;
  URL: string;
  Email: string;
  EvtDetailLink: string;
  AllTimeLink: string;
  MultFinishLink: string;
  EvtDistance: string;
  EvtDist: string;
  EvtType: string;
  AltitudeDiff?: string;
  FinisherCnt: string;
  RecordEligible: string;
  Valuation: string;
  Resultsource: string;
  RecordedBy: string;
  RecordedAt: string;
  SearchRsltCnt: string;
}

export interface EventResultRow {
  RankTotal: string;
  Performance: string;
  PerformanceNumeric: string;
  PersonID: string;
  ParentID: string;
  AthleteName: string;
  FirstName: string;
  LastName: string;
  OrigName: string;
  Club: string;
  Nationality: string;
  YOB: string;
  DOB: string;
  Gender: string;
  RankMW: string;
  Cat: string;
  RankCat: string;
  Speed: string;
  AgeGradePerf: string;
}

export interface EventResultsResponse {
  nlsText?: NlsText;
  FltCatTypeValue?: number[];
  FltCatTypeLabel?: string[];
  FltSpeedTypeValue?: number[];
  FltSpeedTypeLabel?: string[];
  FltCatValues?: string[];
  FltCatLabels?: string[];
  FltCountryValues?: string[];
  FltCountryLabels?: string[];
  Pagination?: Pagination;
  EvtHeader: EventResultsHeader;
  Resultlist: EventResultRow[] | null;
}

// mgetresultperson.php
export interface PersonHeader {
  PersonName: string;
  OrigName: string;
  Club: string;
  Residence: string;
  YOB: string;
  DOB: string;
  NationalityShort: string;
  NationalityLong: string;
  Flag: string;
  Homepage: string;
  Misc: string;
  CatNAT: string;
  CatINT: string;
  SearchRslts: number;
  TotalEvtCnt: number;
  TotalKm: string;
}

export interface PersonPerformance {
  EvtDate: string;
  EvtID: string;
  EvtName: string;
  EvtDist: string;
  Perf: string;
  AthleteName: string;
  PerfClub: string;
  RankOverall: string;
  Gender: string;
  RankMW: string;
  Cat: string;
  RankCat: string;
}

export interface PersonYear {
  Year: string;
  EvtCnt: string;
  KmSum: string;
  PerfsPerYear: PersonPerformance[];
}

/** Keyed by year; "PB" holds the best performance. */
export type PersonPBsForDistance = { PB: string } & Record<
  string,
  { Perf: string; RankIntNat: string } | string
>;

export interface PersonCompRow {
  EvtID: number | string;
  EvtName: string;
  EvtCnt: number | string;
  /** Year columns; "" when no result. */
  [year: string]: number | string;
}

export interface RunnerProfileResponse {
  nlsText?: NlsText;
  PersonHeader: PersonHeader;
  AllPerfs: PersonYear[];
  /** Array of single-key objects, e.g. [{ "50km": {...} }]. */
  AllPBs: Record<string, PersonPBsForDistance>[];
  CompTable: PersonCompRow[];
}

// msearchevent.php
export type EventSearchHit = EventDetails;

export interface EventSearchResponse {
  HitCnt: number;
  Hitlist: EventSearchHit[] | null;
}

// msearchrunner.php
export interface RunnerSearchHit {
  PersonID: string;
  LastName: string;
  FirstName: string;
  OrigName: string;
  Club: string;
  City: string;
  Nationality: string;
  YOB: string;
  Gender: string;
  Privacy: string;
  ActivRange: string;
  HitCnt: number;
}

export interface RunnerSearchResponse {
  HitCnt: number;
  Pagination?: Pagination;
  Hitlist: RunnerSearchHit[] | null;
}

// mtoprankabroad.php
export interface TopRankAbroadHeader {
  Country: string;
  CountryName: string;
  Year: string;
  Dist: string;
  TopCount: number;
  Gender: string;
  Title: string;
}

export interface TopRankAbroadRow {
  Year: string;
  Month: string;
  Date: string;
  DateF: string;
  EventID: string;
  EventName: string;
  Country: string;
  Dist: string;
  RankTotal: string;
  RankMW: string;
  FinisherM: string;
  FinisherW: string;
  PersonID: string;
  NameLF: string;
  LastName: string;
  FirstName: string;
  OrigName: string;
  Performance: string;
  Nationality: string;
  Gender: string;
}

export interface TopRankAbroadResponse {
  Pageheader: TopRankAbroadHeader;
  nlsText?: NlsText;
  FltDistValue?: string[];
  FltDistLabel?: string[];
  FltTopCntValues?: number[];
  FltGenderValues?: string[];
  FltGenderLabels?: string[];
  Resultlist: TopRankAbroadRow[] | null;
}
