import { describe, expect, it } from "vitest";
import { bestFromRanking, bestsFromCountryList, duvDateIso, worldFromAreas } from "./duv-lists";
import { disciplineOfRace, isBetter, isSameMark, raceSize, splitAgeClass } from "./disciplines";
import { parseDuvPerf } from "./perf";
import type { BestPerfCountryResponse, RankingResponse } from "../duv/types";

const COUNTRY = {
  HitCnt: 2,
  TitleW: "",
  TitleM: "",
  Disclaimer: "",
  Records: {
    WOverall: {
      AK: "WOverall", Perf: "07:20:48", PerfID: "6555889", PersonID: "805573", FirstName: "Kajsa", LastName: "Berg",
      OrigName: "", DOB: "16.01.1979", YOB: "1979", Club: "", Nat: "SWE", Privacy: "0", EventID: "65101",
      Eventname: "IAU 100 km WC", City: "Winschoten", Country: "NED", Startdate: "12.09.2015", Enddate: "00.00.0000", Split: "",
    },
    M40: {
      AK: "M40", Perf: "06:59:59", PerfID: "1", PersonID: "2", FirstName: "Erik", LastName: "Lind",
      OrigName: "", DOB: "", YOB: "1970", Club: "", Nat: "SWE", Privacy: "0", EventID: "3",
      Eventname: "24h", City: "X", Country: "SWE", Startdate: "01.06.2012", Enddate: "02.06.2012", Split: "S",
    },
    "#NA": { AK: "#NA", Perf: "x" },
  },
} as unknown as BestPerfCountryResponse;

describe("DUV lists", () => {
  it("normalises mbestperfcountry by age class", () => {
    const bests = bestsFromCountryList(COUNTRY, "100km", "nation", "SWE");
    expect(bests).toHaveLength(2);
    expect(bests[0]).toMatchObject({ gender: "W", category: "Overall", scope: "nation", scopeCode: "SWE", value: 26448, personId: "805573", eventId: "65101", date: "2015-09-12", split: "" });
    expect(bests[1]).toMatchObject({ gender: "M", category: "40", split: "S" });
    expect(bestsFromCountryList(null, "100km", "nation", "SWE")).toEqual([]);
  });

  it("takes rank 1 of an all-time list", () => {
    const list = {
      RankingList: [
        { PersonID: "9", LastName: "Sustic", FirstName: "Natasa", Nationality: "CRO", DOB_Display: "24.07.1987", PerfID: "1", Distance: "80.992", CatInt: "W35", City: "Kranj", Country: "SLO", EventID: "108186", PartOf: "0", Startdate: "2024-06-02", EvtdateShort: "02.06.2024", Rank: 1, Perf: "80.992 km", CatRank: 1 },
      ],
    } as unknown as RankingResponse;
    expect(bestFromRanking(list, "6h", "W")).toMatchObject({ scope: "world", scopeCode: "WORLD", category: "Overall", value: 80.992, eventId: "108186", date: "2024-06-02", split: "" });
    expect(bestFromRanking(list, "6h", "W", "35")).toMatchObject({ category: "35" });
    // A band DUV did not filter by gives nothing rather than the open mark.
    expect(bestFromRanking(list, "6h", "W", "50")).toBeNull();
    expect(bestFromRanking({ RankingList: null } as unknown as RankingResponse, "6h", "W")).toBeNull();
  });

  it("reads backyard laps", () => {
    const list = { RankingList: [{ PersonID: "1", EventID: "2", Laps: "119", Perf: "797.966 km", Rank: "1", CatRank: "1", CatInt: "M45", EvtdateShortIso: "2025-10-18" }] } as unknown as RankingResponse;
    expect(bestFromRanking(list, "backyard", "M")).toMatchObject({ value: 119, date: "2025-10-18" });
  });

  it("derives the open world best from the area lists", () => {
    const eur = bestsFromCountryList(COUNTRY, "100km", "area", "EUR");
    const nam = eur.map((d) => ({ ...d, scopeCode: "NAM", value: d.value - 60, personId: "x" }));
    const world = worldFromAreas([...eur, ...nam]);
    expect(world).toHaveLength(2);
    expect(world[0]).toMatchObject({ scope: "world", scopeCode: "WORLD", gender: "W", category: "Overall", personId: "x" });
    expect(world[1]).toMatchObject({ gender: "M", category: "40", personId: "x" });
  });

  it("reads dates", () => {
    expect(duvDateIso("12.09.2015")).toBe("2015-09-12");
    expect(duvDateIso("2024-06-02 12:00:00")).toBe("2024-06-02");
    expect(duvDateIso("00.00.0000")).toBeNull();
  });
});

describe("disciplines", () => {
  it("maps races to record disciplines", () => {
    expect(disciplineOfRace({ EventType: "3", Duration: "24h" })).toBe("24h");
    expect(disciplineOfRace({ EventType: "1", Length: "100km" })).toBe("100km");
    expect(disciplineOfRace({ EventType: "5", Length: "100 mi" })).toBe("100mi");
    expect(disciplineOfRace({ EventType: "1", Duration: "6d" })).toBe("6d");
    expect(disciplineOfRace({ EventType: "10", Length: "" })).toBe("backyard");
    expect(disciplineOfRace({ EventType: "2", Length: "100km" })).toBeNull();
    expect(disciplineOfRace({ EventType: "1", Length: "80km" })).toBeNull();
  });

  it("compares marks", () => {
    expect(isBetter(100, 101, "100km")).toBe(true);
    expect(isBetter(250, 249, "24h")).toBe(true);
    expect(isSameMark(250.004, 250.0, "24h")).toBe(true);
    expect(isSameMark(250.02, 250.0, "24h")).toBe(false);
    expect(isSameMark(3601, 3600, "50km")).toBe(true);
    expect(isSameMark(3602, 3600, "50km")).toBe(false);
  });

  it("reads performances, age classes and sizes", () => {
    expect(parseDuvPerf("6:05:35 h", "100km")).toBe(21935);
    expect(parseDuvPerf("265:12:33 h", "1000mi")).toBe(265 * 3600 + 12 * 60 + 33);
    expect(parseDuvPerf("187.207 km", "24h")).toBe(187.207);
    expect(parseDuvPerf("187.207 km", "100km")).toBeNull();
    expect(splitAgeClass("WU23")).toEqual({ gender: "W", band: "U23" });
    expect(splitAgeClass("MOverall")).toEqual({ gender: "M", band: "Overall" });
    expect(splitAgeClass("#NA")).toBeNull();
    expect(raceSize({ Length: "50mi" })?.value).toBeCloseTo(80.467, 2);
    expect(raceSize({ Duration: "6d" })).toEqual({ unit: "h", value: 144 });
  });
});
