import { describe, expect, it } from "vitest";
import type { RankingEntry } from "@/lib/duv/types";
import { backyardLaps, buildRows, gapPercent, gapScale, gapTo, isRepeat, mergeLists, resultOf } from "./rows";
import { groupDistances, parseDistanceValue, parseGender, parseRankingParams, rankingQuery } from "./params";

function entry(over: Partial<RankingEntry>): RankingEntry {
  return {
    PersonID: "1",
    LastName: "Doe",
    FirstName: "Jane",
    OrigName: "",
    Nationality: "GBR",
    Privacy: "0",
    ParentID: "0",
    DOB_Display: "",
    PerfID: Math.random().toString(36).slice(2),
    Distance: "0.000",
    CatInt: "W35",
    City: "Somewhere",
    Country: "GBR",
    EventID: "1",
    EvtdateShort: "01.01.2026",
    Rank: 1,
    Perf: " 7:00:00 h",
    CatRank: 1,
    ...over,
  };
}

describe("isRepeat", () => {
  it("reads DUV's bracketed ranks", () => {
    expect(isRepeat("(2)")).toBe(true);
    expect(isRepeat(12)).toBe(false);
    expect(isRepeat("12")).toBe(false);
  });
});

describe("gapTo", () => {
  it("counts a time behind and a distance short", () => {
    const lead = { kind: "time" as const, value: 22165 };
    expect(gapTo(lead, { kind: "time", value: 22222 })).toBe(57);
    expect(gapTo({ kind: "distance", value: 285.211 }, { kind: "distance", value: 280.1 })).toBe(5.111);
    expect(gapTo({ kind: "laps", value: 114 }, { kind: "laps", value: 110 })).toBe(4);
  });
  it("gives null across kinds", () => {
    expect(gapTo({ kind: "laps", value: 114 }, { kind: "distance", value: 400 })).toBeNull();
  });
});

describe("backyardLaps", () => {
  it("takes DUV's laps, or works them out from a whole number of 6.706 km laps", () => {
    expect(backyardLaps(entry({ Laps: "114", Distance: "764.484" }))).toBe(114);
    expect(backyardLaps(entry({ Laps: "0", Distance: "409.066" }))).toBe(61);
    expect(backyardLaps(entry({ Laps: "0", Distance: "400.000" }))).toBeNull();
  });
  it("ranks a 0-lap row by its laps when they can be worked out", () => {
    expect(resultOf(entry({ Laps: "0", Distance: "409.066" }), "backyard")).toEqual({ kind: "laps", value: 61 });
    expect(resultOf(entry({ Laps: "0", Distance: "400.000" }), "backyard")).toEqual({ kind: "distance", value: 400 });
  });
});

describe("buildRows", () => {
  const list = [
    entry({ PersonID: "a", Rank: 1, Perf: "6:09:25 h" }),
    entry({ PersonID: "b", Rank: 2, Perf: "6:10:22 h" }),
    entry({ PersonID: "a", Rank: "(2)", Perf: "6:20:00 h" }),
    entry({ PersonID: "c", Rank: "(2)", Perf: "6:30:00 h" }),
  ];
  const leader = { kind: "time" as const, value: 6 * 3600 + 9 * 60 + 25 };

  it("folds repeats into the runner's best row and drops those whose best is on an earlier page", () => {
    const rows = buildRows(list, { kind: "international", view: "best", leader });
    expect(rows.map((r) => r.rank)).toEqual(["1", "2"]);
    expect(rows[0].also.map((e) => e.Perf)).toEqual(["6:20:00 h"]);
    expect(rows[1].gap).toBe(57);
  });

  it("keeps every performance in the all view", () => {
    const rows = buildRows(list, { kind: "international", view: "all", leader });
    expect(rows.map((r) => r.rank)).toEqual(["1", "2", "(2)", "(2)"]);
    expect(rows[2].repeat).toBe(true);
    expect(rows[0].also).toEqual([]);
  });
});

describe("gapScale", () => {
  const rows = [0, 57, 171].map((gap) => ({ gap }) as never);
  it("starts at 0 on page 1 and at the smallest gap later", () => {
    expect(gapScale(rows, 1)).toEqual({ lo: 0, hi: 171 });
    expect(gapScale(rows.slice(1), 2)).toEqual({ lo: 57, hi: 171 });
    expect(gapPercent(57, { lo: 0, hi: 171 })).toBe(33.3);
  });
});

describe("mergeLists", () => {
  it("merges parts in result order with DUV's ranks, repeats and age group ranks", () => {
    const merged = mergeLists(
      [
        [entry({ PersonID: "a", Perf: "7:00:00 h", CatInt: "W35" }), entry({ PersonID: "a", Perf: "7:30:00 h", CatInt: "W35" })],
        [entry({ PersonID: "b", Perf: "7:10:00 h", CatInt: "W40" }), entry({ PersonID: "c", Perf: "7:10:00 h", CatInt: "W40" })],
      ],
      "international"
    );
    expect(merged.map((e) => [e.PersonID, e.Rank, e.CatRank])).toEqual([
      ["a", 1, 1],
      ["b", 2, 1],
      ["c", 2, 2],
      ["a", "(2)", 2],
    ]);
  });
  it("ranks distances longest first", () => {
    const merged = mergeLists(
      [[entry({ PersonID: "a", Perf: "250.000 km" })], [entry({ PersonID: "b", Perf: "260.000 km" })]],
      "international"
    );
    expect(merged.map((e) => e.PersonID)).toEqual(["b", "a"]);
  });
});

describe("params", () => {
  it("reads F as women, since the API ignores it", () => {
    expect(parseGender("F")).toBe("W");
    expect(parseGender("w")).toBe("W");
    expect(parseGender("x")).toBe("all");
  });

  it("parses defaults and writes short links", () => {
    const state = parseRankingParams({}, 2026);
    expect(state).toMatchObject({ year: "2026", dist: "100km", gender: "all", view: "best", page: 1 });
    expect(rankingQuery(state, {}, 2026)).toBe("");
    expect(rankingQuery(state, { dist: "24h", gender: "W" }, 2026)).toBe("?dist=24h&gender=W");
    expect(rankingQuery({ ...state, page: 3 }, { view: "all" }, 2026)).toBe("?view=all");
    expect(rankingQuery(state, { page: 2 }, 2026)).toBe("?page=2");
    expect(rankingQuery({ ...state, dist: "24h", iau: true }, { year: "all" }, 2026, { backyard: true })).toBe("?year=all");
  });

  it("ignores a year that is not a year", () => {
    expect(parseRankingParams({ year: "abc" }, 2026).year).toBe("2026");
    expect(parseRankingParams({ year: "all" }, 2026).year).toBe("all");
  });

  it("groups and orders distances", () => {
    expect(parseDistanceValue("6d")).toEqual({ kind: "time", amount: 6, unit: "d" });
    expect(groupDistances(["50km", "50mi", "100km", "6h", "10d", "72h", "1000mi", "1000km", "100mi"])).toEqual({
      distance: ["50km", "50mi", "100km", "100mi", "1000km", "1000mi"],
      time: ["6h", "72h", "10d"],
    });
  });
});

describe("formatGap", () => {
  it("writes time, distance and lap gaps", async () => {
    const { formatGap } = await import("./rows");
    expect(formatGap(57, "time", "en")).toBe("+0:57");
    expect(formatGap(3723, "time", "en")).toBe("+1:02:03");
    expect(formatGap(5.111, "distance", "en")).toBe("−5.111");
    expect(formatGap(4, "laps", "en")).toBe("−4");
    expect(formatGap(0, "time", "en")).toBe("");
  });
});
