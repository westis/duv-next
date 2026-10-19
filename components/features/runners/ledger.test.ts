import { describe, expect, it } from "vitest";
import type { PersonPBsForDistance, PersonYear } from "../../../lib/duv/types";
import {
  buildLedger,
  championshipOf,
  compareDistances,
  countWins,
  decodeEntities,
  filterLedger,
  parseLedgerFilter,
  pbLadder,
  seasonBars,
  splitLabel,
  type LivePerformance,
} from "./ledger";

function perf(p: Partial<LivePerformance> & { EvtID: string }): LivePerformance {
  return {
    EvtDate: "01.01.2022",
    EvtDateIso: "2022-01-01 10:00:00",
    EvtName: `Race ${p.EvtID}`,
    EvtDist: "24h",
    Perf: "200.000 km",
    AthleteName: "Sorokin, Aleksandr",
    PerfClub: "",
    RankOverall: "1",
    Gender: "M",
    RankMW: "1",
    Cat: "M40",
    RankCat: "1",
    EvtType: "3",
    EvtPartOf: "0",
    ...p,
  };
}

function year(y: string, perfs: LivePerformance[], km = "100 km", cnt = "1"): PersonYear {
  return { Year: y, EvtCnt: cnt, KmSum: km, PerfsPerYear: perfs };
}

// Taken from Aleksandr SOROKIN's DUV profile (#439692), shortened.
const taipei = [
  perf({ EvtID: "102799", EvtName: "IAU 24h WC Taipei (all races combined)", EvtDate: "01.-02.12.2023", EvtDateIso: "2023-12-01 10:00:00", Perf: "301.790 km" }),
  perf({ EvtID: "102408", EvtName: "IAU 24h WC Taipei - 12h Split", EvtDist: "12h", Perf: "166.800 km", EvtPartOf: "102799", EvtDateIso: "2023-12-01 10:00:00" }),
  perf({ EvtID: "102407", EvtName: "IAU 24h WC Taipei - 100mi Split", EvtDist: "100mi", Perf: "11:32:36 h", EvtPartOf: "102799", EvtDateIso: "2023-12-01 10:00:00" }),
  perf({ EvtID: "97462", EvtName: "IAU 24h WC Taipei", Perf: "301.790 km", EvtPartOf: "102799", EvtDateIso: "2023-12-01 10:00:00" }),
  perf({ EvtID: "97575", EvtName: "100 km run Vilnius", EvtDist: "100km", Perf: "6:05:35 h", EvtDateIso: "2023-05-14 06:00:00" }),
];
const y2016 = [
  perf({ EvtID: "33189", EvtName: "Kernavė - Vilnius Trail", EvtType: "2", EvtDist: "83.7km", Perf: "6:57:29 h", RankOverall: "2", RankMW: "2", EvtDateIso: "2016-06-18 00:00:00" }),
  perf({ EvtID: "37888", EvtName: "Spartathlon", EvtType: "1", EvtDist: "246km", Perf: "22:04:04 h", EvtDateIso: "2016-09-29 07:00:00" }),
];
const pbs: Record<string, PersonPBsForDistance>[] = [
  { "100km": { PB: "6:05:35", "2023": { Perf: "6:05:35", RankIntNat: " (1/1)" }, "2022": { Perf: "6:05:41", RankIntNat: " (1/1)" } } },
  { "100mi": { PB: "11:12:13", "2023": { Perf: "11:32:36", RankIntNat: " (2/1)" } } },
  { "24h": { PB: "319.614", "2023": { Perf: "301.790", RankIntNat: " (1/1)" } } },
  { "12h": { PB: "177.410", "2023": { Perf: "166.800", RankIntNat: " (1/1)" } } },
];
const years = [year("2023", taipei, "568.576 km", "3"), year("2016", y2016, "330 km", "2")];

describe("buildLedger", () => {
  const ledger = buildLedger(years, pbs);

  it("folds splits and parallel scorings under the race, championship first", () => {
    const [first, vilnius] = ledger[0].groups;
    expect(ledger[0].groups).toHaveLength(2);
    expect(first.main.id).toBe("97462");
    expect(first.also.map((r) => r.id)).toEqual(["102799"]);
    expect(first.splits.map((r) => r.dist)).toEqual(["12h", "100mi"]);
    expect(vilnius.main.pb).toBe(true);
  });

  it("groups splits whose race is not in the profile under the longest one", () => {
    const centurion = buildLedger(
      [
        year("2022", [
          perf({ EvtID: "86085", EvtName: "Centurion Track 100 - 100km Split", EvtDist: "100km", Perf: "6:05:41 h", EvtPartOf: "84831" }),
          perf({ EvtID: "86089", EvtName: "Centurion Track 100 - 6h Split", EvtDist: "6h", Perf: "98.496 km", EvtPartOf: "84831" }),
          perf({ EvtID: "86087", EvtName: "Centurion Track 100 - 50km Split", EvtDist: "50km", Perf: "3:01:51 h", EvtPartOf: "84831" }),
          perf({ EvtID: "26330", EvtName: "Daugavpils 50 km race", EvtDist: "50km", Perf: "3:14:20 h", EvtPartOf: "19732" }),
        ]),
      ],
      pbs
    );
    const groups = centurion[0].groups;
    expect(groups.map((g) => g.main.id)).toEqual(["86085", "26330"]);
    expect(groups[0].splits.map((r) => r.id)).toEqual(["86089", "86087"]);
  });

  it("keeps DUV's season totals", () => {
    expect(ledger[0]).toMatchObject({ year: "2023", events: 3, km: 568.576 });
  });

  it("never marks a trail result as a PB and flags trail rows", () => {
    const trail = ledger[1].groups.find((g) => g.main.id === "33189")!;
    expect(trail.main.trail).toBe(true);
    expect(trail.main.pb).toBe(false);
  });

  it("sorts each season newest first", () => {
    expect(ledger[1].groups.map((g) => g.main.id)).toEqual(["37888", "33189"]);
  });

  it("counts gender wins once per run", () => {
    expect(countWins(ledger)).toBe(3);
  });

  it("filters by distance, trail and other distances", () => {
    const keys = new Set(["100km", "100mi", "24h", "12h"]);
    const mi = filterLedger(ledger, parseLedgerFilter("100mi"), keys);
    expect(mi.years.flatMap((y) => y.groups.map((g) => g.main.id))).toEqual(["97462"]);
    expect(mi.open.has("97462")).toBe(true);
    const trail = filterLedger(ledger, parseLedgerFilter("trail"), keys);
    expect(trail.years.flatMap((y) => y.groups.map((g) => g.main.id))).toEqual(["33189"]);
    const other = filterLedger(ledger, parseLedgerFilter("other"), keys);
    expect(other.years.flatMap((y) => y.groups.map((g) => g.main.id))).toEqual(["37888"]);
  });
});

describe("pbLadder", () => {
  it("orders timed events first, longest first, and finds the PB season", () => {
    const ladder = pbLadder(pbs);
    expect(ladder.map((l) => l.dist)).toEqual(["24h", "12h", "100mi", "100km"]);
    expect(ladder[3]).toMatchObject({ pb: "6:05:35", pbYear: 2023, kind: "time" });
    expect(ladder[3].bests.map((b) => b.year)).toEqual([2022, 2023]);
    expect(ladder[3].bests[0].rank).toBe("1/1");
    expect(ladder[2].pbYear).toBeNull();
  });
});

describe("seasonBars", () => {
  it("keeps gap years as empty bars", () => {
    const bars = seasonBars([year("2026", [], "186 km", "2"), year("2023", [], "568.576 km", "3")]);
    expect(bars.map((b) => [b.year, b.raced])).toEqual([
      ["2023", true],
      ["2024", false],
      ["2025", false],
      ["2026", true],
    ]);
    expect(bars[0].km).toBeCloseTo(568.576);
  });
});

describe("helpers", () => {
  it("decodes DUV's HTML entities", () => {
    expect(decodeEntities("IAU 24h WC, 24 heures d&#039;Albi")).toBe("IAU 24h WC, 24 heures d'Albi");
    expect(decodeEntities("A &amp; B")).toBe("A & B");
  });

  it("reads IAU championships from the name", () => {
    expect(championshipOf("IAU 24h WC Taipei")).toBe("world");
    expect(championshipOf("IAU 100km World Championship")).toBe("world");
    expect(championshipOf("Lupatotissima - 24 ore, 23rd IAU 24H EC")).toBe("continental");
    expect(championshipOf("Western States 100")).toBeUndefined();
  });

  it("shortens split names to their own part", () => {
    expect(splitLabel("IAU 24h WC Taipei - 12h Split", ["IAU 24h WC Taipei (all races combined)", "IAU 24h WC Taipei"])).toBe("12h Split");
    expect(splitLabel("Other name", ["Race"])).toBe("Other name");
    expect(splitLabel("Centurion Track 100 - 6h Split", ["Centurion Track 100 - 100km Split"])).toBe("6h Split");
  });

  it("compares distances for the ladder", () => {
    expect(["50km", "6d", "100mi", "24h"].sort(compareDistances)).toEqual(["6d", "24h", "100mi", "50km"]);
  });
});
