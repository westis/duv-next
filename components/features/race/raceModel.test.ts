import { describe, expect, it } from "vitest";
import type { EventResultRow } from "@/lib/duv";
import {
  ageGroupOf,
  ageGroupOptions,
  gapToWinner,
  genderOf,
  nationOptions,
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

describe("result filters", () => {
  it("puts women's and men's categories in one age group", () => {
    expect(ageGroupOf("W50")).toBe("50");
    expect(ageGroupOf("M50")).toBe("50");
    expect(ageGroupOf("WU23")).toBe("23");
    expect(ageGroupOf("M23")).toBe("23");
    expect(ageGroupOf("W")).toBe("open");
    expect(ageGroupOf("")).toBe("");
  });

  it("lists age groups youngest first, women's category first", () => {
    const fs = [
      row({ Cat: "M50", Gender: "M" }),
      row({ Cat: "W50", Gender: "F" }),
      row({ Cat: "M", Gender: "M" }),
      row({ Cat: "WU23", Gender: "F" }),
      row({ Cat: "M23", Gender: "M" }),
      row({ Cat: "MU23", Gender: "M" }),
      row({ Cat: "#NA", Gender: "M" }),
    ].map(readFinisher);
    expect(ageGroupOptions(fs)).toEqual([
      { value: "23", label: "WU23 / M23" },
      { value: "open", label: "M" },
      { value: "50", label: "W50 / M50" },
    ]);
  });

  it("counts nations", () => {
    const fs = [row({ Nationality: "SWE" }), row({ Nationality: "GER" }), row({ Nationality: "SWE" })].map(readFinisher);
    expect(nationOptions(fs)).toEqual([
      { value: "GER", count: 1 },
      { value: "SWE", count: 2 },
    ]);
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
  const { gapText } = await import("./raceText");
  it("writes gaps", () => {
    expect(gapText(196, "time", "en")).toBe("+3:16");
    expect(gapText(3723, "time", "en")).toBe("+1:02:03");
    expect(gapText(4.45, "distance", "en")).toBe("−4.450");
    expect(gapText(null, "time", "en")).toBe("");
  });

});
