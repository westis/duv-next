import { describe, expect, it } from "vitest";
import type { EventResultRow } from "@/lib/duv";
import {
  bandIndex,
  gapToWinner,
  genderOf,
  groupIntoBands,
  makeBands,
  nationTeams,
  parseWinnerField,
  raceFamily,
  readFinisher,
  resultKind,
  splitByGender,
  type WinnerRow,
} from "./raceModel";

const row = (p: Partial<EventResultRow>): EventResultRow =>
  ({
    RankTotal: "1",
    Performance: "",
    PerformanceNumeric: "",
    PersonID: "1",
    ParentID: "0",
    AthleteName: "",
    FirstName: "",
    LastName: "",
    OrigName: "",
    Club: "",
    Nationality: "GER",
    YOB: "",
    DOB: "",
    Gender: "M",
    RankMW: "1",
    Cat: "",
    RankCat: "",
    Speed: "",
    AgeGradePerf: "",
    ...p,
  }) as EventResultRow;

const win = (p: Partial<WinnerRow>): WinnerRow =>
  ({
    EventID: "1",
    PartOf: "0",
    EventName: "",
    FinisherM: "0",
    FinisherW: "0",
    Year: "2019",
    SDate: "26.10.2019",
    Length: "",
    Duration: "24h",
    Results: "C",
    Winner_M: "",
    Winner_W: "",
    ...p,
  }) as WinnerRow;

describe("genderOf", () => {
  it("reads F and W as women", () => {
    expect(genderOf("F")).toBe("W");
    expect(genderOf("W")).toBe("W");
    expect(genderOf("m")).toBe("M");
    expect(genderOf("")).toBeNull();
  });
});

describe("lists", () => {
  const rows = [
    row({ RankTotal: "1", RankMW: "1", Gender: "M", Performance: "6:09:25 h" }),
    row({ RankTotal: "2", RankMW: "2", Gender: "M", Performance: "6:12:41 h" }),
    row({ RankTotal: "39", RankMW: "1", Gender: "F", Performance: "7:10:31 h" }),
  ].map(readFinisher);

  it("splits by gender in place order and detects the kind", () => {
    const lists = splitByGender(rows);
    expect(lists.W).toHaveLength(1);
    expect(lists.M.map((f) => f.place)).toEqual([1, 2]);
    expect(resultKind(rows)).toBe("time");
  });

  it("measures the gap to the gender winner", () => {
    const lists = splitByGender(rows);
    expect(gapToWinner(lists.M[1], lists.M[0], "time")).toBe(196);
    expect(gapToWinner(lists.M[0], lists.M[0], "time")).toBeNull();
    const d = [row({ Performance: "278.622 km" }), row({ Performance: "274.172 km" })].map(readFinisher);
    expect(gapToWinner(d[1], d[0], "distance")).toBeCloseTo(4.45, 3);
  });
});

describe("makeBands", () => {
  it("makes hour bands for times, open at the bottom", () => {
    const bands = makeBands([5.5 * 3600, 6.5 * 3600, 11.9 * 3600], "time");
    expect(bands).toHaveLength(7);
    expect(bands[0]).toEqual({ from: null, to: 6 * 3600 });
    expect(bands[6]).toEqual({ from: 11 * 3600, to: 12 * 3600 });
  });

  it("makes km bands for distances, best first and open at both ends", () => {
    const bands = makeBands([294.3, 198.4, 61.2], "distance");
    expect(bands[0]).toEqual({ from: 250, to: null });
    expect(bands[bands.length - 1]).toEqual({ from: null, to: 100 });
    expect(bandIndex(294.3, bands)).toBe(0);
    expect(bandIndex(61.2, bands)).toBe(bands.length - 1);
  });

  it("groups rows and keeps unreadable ones last", () => {
    const fs = [row({ Performance: "6:09:25 h" }), row({ Performance: "DNF" }), row({ Performance: "8:01:00 h" })].map(
      readFinisher
    );
    const groups = groupIntoBands(fs, makeBands([6 * 3600, 8 * 3600], "time"));
    expect(groups.map((g) => g.rows.length)).toEqual([1, 1, 1]);
    expect(groups[2].band).toBeNull();
  });

  it("has no bands for laps", () => {
    expect(makeBands([38, 20], "laps")).toEqual([]);
  });
});

describe("nationTeams", () => {
  it("sums the best three of nations with three finishers", () => {
    const fs = [
      row({ Nationality: "GBR", Performance: "278.622" }),
      row({ Nationality: "GBR", Performance: "257.129" }),
      row({ Nationality: "GBR", Performance: "232.889" }),
      row({ Nationality: "GBR", Performance: "100.000" }),
      row({ Nationality: "AUS", Performance: "274.172" }),
      row({ Nationality: "AUS", Performance: "237.442" }),
    ].map(readFinisher);
    const teams = nationTeams(fs, "distance");
    expect(teams).toHaveLength(1);
    expect(teams[0].nat).toBe("GBR");
    expect(teams[0].total).toBeCloseTo(768.64, 3);
  });
});

describe("parseWinnerField", () => {
  it("reads rank, name and mark", () => {
    expect(parseWinnerField("39#Courtney Olsen 07:10:31")).toEqual({ rank: 39, name: "Courtney Olsen", perf: "07:10:31" });
    expect(parseWinnerField("1#Ondrej Pouc 187.207")?.perf).toBe("187.207");
    expect(parseWinnerField("")).toBeNull();
  });
});

describe("raceFamily", () => {
  const race = { EventID: "52840", PartOf: "0", Duration: "24h", Length: "", EventType: "3", SDate: "26.10.2019" };
  const list = [
    win({ EventID: "61055", PartOf: "52840", Duration: "6h" }),
    win({ EventID: "92030", PartOf: "52840", Duration: "", Length: "100mi" }),
    win({ EventID: "60954", PartOf: "52840", Duration: "", Length: "100km" }),
    win({ EventID: "61054", PartOf: "52840", Duration: "12h" }),
    win({ EventID: "60945", PartOf: "0", EventName: "open race" }),
    win({ EventID: "92033", PartOf: "60945", Duration: "12h" }),
    win({ EventID: "52840", PartOf: "0", Winner_M: "1#Aleksandr Sorokin 278.972" }),
    win({ EventID: "999", PartOf: "52840" }),
    win({ EventID: "44754", PartOf: "0", SDate: "20.10.2018", Year: "2018" }),
  ];

  it("orders splits along the race and tells classifications apart", () => {
    const fam = raceFamily(race, list);
    expect(fam.splits.map((s) => s.EventID)).toEqual(["61055", "60954", "61054", "92030"]);
    expect(fam.classifications.map((s) => s.EventID)).toEqual(["999"]);
    expect(fam.sameDay.map((s) => s.EventID)).toEqual(["60945"]);
    expect(fam.editions.map((s) => s.EventID)).toEqual(["60945", "52840", "44754"]);
    expect(fam.parent).toBeNull();
  });

  it("finds the parent of a split", () => {
    const fam = raceFamily({ ...race, EventID: "61055", PartOf: "52840", Duration: "6h" }, list);
    expect(fam.parent?.EventID).toBe("52840");
  });
});

describe("raceText", async () => {
  const { gapText, bandShortText, edgeText, totalText } = await import("./raceText");
  it("writes gaps", () => {
    expect(gapText(196, "time", "en")).toBe("+3:16");
    expect(gapText(3723, "time", "en")).toBe("+1:02:03");
    expect(gapText(4.45, "distance", "en")).toBe("−4.450");
    expect(gapText(null, "time", "en")).toBe("");
  });
  it("writes band edges and jump labels", () => {
    expect(edgeText(6 * 3600, "time", "en")).toBe("6:00");
    expect(edgeText(5.5 * 3600, "time", "en")).toBe("5:30");
    expect(bandShortText({ from: null, to: 6 * 3600 }, "time", "en")).toBe("<6:00");
    expect(bandShortText({ from: 250, to: null }, "distance", "en")).toBe("250+");
    expect(totalText(768.64, "distance", "en")).toBe("768.640");
  });
});
