import { describe, expect, it } from "vitest";
import { evaluateRow, evaluateRows, markerKey, markerLabel, type RecordBook } from "./evaluate";
import { applyHolder, matchRuns, pickHolder } from "./match";
import { OVERALL, WORLD, type DuvBest, type RatifiedMark } from "./types";

function duv(over: Partial<DuvBest>): DuvBest {
  return {
    dist: "100km", gender: "M", scope: "world", scopeCode: WORLD, category: OVERALL,
    value: 0, perfRaw: "", personId: "", eventId: "", perfId: "", firstName: "", lastName: "",
    nat: "", dob: "", date: null, eventName: "", city: "", country: "", split: "", ...over,
  };
}

function iau(over: Partial<RatifiedMark>): RatifiedMark {
  return {
    dist: "100km", gender: "M", scope: "world", scopeCode: WORLD, category: OVERALL, body: "IAU",
    status: "current", value: 0, perfRaw: "", holder: "", nat: null, dob: null, date: null, endDate: null,
    venue: null, notes: null, personId: null, eventId: null, matchedBy: null, ...over,
  };
}

const T = (h: number, m: number, s: number) => h * 3600 + m * 60 + s;

// 100 km men: world best = IAU WR (Sorokin). North America: DUV 6:07:10 is better
// than the IAU-ratified 6:27:44 (Max King, 2014). Sweden only in DUV.
const book: RecordBook = {
  dist: "100km",
  duv: [
    duv({ value: T(6, 5, 35), perfRaw: "6:05:35", personId: "1", eventId: "100", firstName: "Aleksandr", lastName: "Sorokin", nat: "LTU", date: "2023-05-14" }),
    duv({ scope: "area", scopeCode: "EUR", value: T(6, 5, 35), perfRaw: "6:05:35", personId: "1", eventId: "100", date: "2023-05-14" }),
    duv({ scope: "area", scopeCode: "NAM", value: T(6, 7, 10), perfRaw: "6:07:10", personId: "2", eventId: "200", firstName: "Jim", lastName: "Walmsley", nat: "USA", date: "2022-01-29" }),
    duv({ scope: "nation", scopeCode: "SWE", value: T(6, 40, 0), perfRaw: "6:40:00", personId: "3", eventId: "300", nat: "SWE", date: "2019-01-01" }),
    duv({ scope: "nation", scopeCode: "SWE", category: "50", value: T(7, 30, 0), perfRaw: "7:30:00", personId: "4", eventId: "400", nat: "SWE", date: "2020-01-01" }),
    duv({ category: "50", value: T(6, 38, 51), perfRaw: "6:38:51", personId: "5", eventId: "500", date: "2010-01-01" }),
  ],
  ratified: [
    iau({ value: T(6, 5, 35), perfRaw: "6:05:35", holder: "Aleksandr Sorokin", date: "2023-05-14" }),
    iau({ scope: "area", scopeCode: "NAM", value: T(6, 27, 44), perfRaw: "6:27:44", holder: "Max King", date: "2014-11-21", personId: "6", eventId: "600" }),
    iau({ category: "50", value: T(6, 38, 51), perfRaw: "6:38:51", holder: "André Collet", date: "2010-01-01" }),
    iau({ status: "pending", category: "85", value: T(14, 0, 0), perfRaw: "14:00:00", holder: "Old Man", date: "2025-05-03" }),
  ],
  updated: { IAU: "2026-05-06" },
};

describe("evaluateRow", () => {
  it("gives a solid, ratified WR to the world best that is the IAU record", () => {
    const [m] = evaluateRow(book, { eventId: "100", personId: "1", perf: "6:05:35 h", gender: "M", nat: "LTU", date: "2023-05-14" });
    expect(m).toMatchObject({ kind: "WR", tier: "solid", status: "ratified", ratifiedBy: "IAU", sourceUpdated: "2026-05-06" });
    expect(markerLabel(m)).toBe("WR");
  });

  it("finds DUV bests by ids alone", () => {
    const [m] = evaluateRow(book, { eventId: "300", personId: "3" });
    expect(m).toMatchObject({ kind: "NR", scopeCode: "SWE", tier: "solid", status: "duvBest", ratifiedBy: null });
  });

  it("solid AR for DUV's area best that trails no ratified mark, with the beaten IAU record", () => {
    const [m] = evaluateRow(book, { eventId: "200", personId: "2", perf: "6:07:10", gender: "M", nat: "USA" });
    expect(m).toMatchObject({ kind: "AR", scopeCode: "NAM", tier: "solid", status: "duvBest", ratified: { perf: "6:27:44", holder: "Max King", year: "2014" } });
  });

  it("outlined IAU AR when a run beats the ratified record but not the best known mark", () => {
    const [m] = evaluateRow(book, { eventId: "700", personId: "7", perf: "6:20:00 h", gender: "M", nat: "USA" });
    expect(m).toMatchObject({ kind: "AR", tier: "outlined", body: "IAU", status: "beatsRatified", best: { perf: "6:07:10", holder: "Jim Walmsley" } });
    expect(markerLabel(m)).toBe("IAU AR");
  });

  it("outlined IAU AR on the ratified record itself when DUV knows a better mark", () => {
    const [m] = evaluateRow(book, { eventId: "600", personId: "6", perf: "6:27:44", gender: "M", nat: "USA" });
    expect(m).toMatchObject({ kind: "AR", tier: "outlined", status: "ratified", best: { perf: "6:07:10" } });
  });

  it("no marker for a run below every mark", () => {
    expect(evaluateRow(book, { eventId: "800", personId: "8", perf: "6:50:00", gender: "M", nat: "USA" })).toEqual([]);
  });

  it("an open and an age group marker at most", () => {
    const markers = evaluateRow(book, { eventId: "500", personId: "5", perf: "6:38:51", gender: "M", cat: "M50", nat: "FRA", date: "2010-01-01" });
    expect(markers.map(markerLabel)).toEqual(["WR M50"]);
    expect(markers[0]).toMatchObject({ status: "ratified", tier: "solid" });
  });

  it("national age group records per DUV", () => {
    const [m] = evaluateRow(book, { eventId: "400", personId: "4", gender: "M", cat: "M50", nat: "SWE" });
    expect(markerLabel(m)).toBe("NR M50");
    expect(m.status).toBe("duvBest");
  });

  it("an application under ratification with no record yet", () => {
    const [m] = evaluateRow(book, { eventId: "900", personId: "9", perf: "14:00:00", gender: "M", cat: "M85", date: "2025-05-03" });
    expect(m).toMatchObject({ category: "M85", tier: "outlined", status: "pending", pending: true });
  });

  it("a split entry only marks the row with the same mark", () => {
    const split: RecordBook = { ...book, duv: [duv({ scope: "nation", scopeCode: "GER", value: T(7, 0, 0), personId: "10", eventId: "1000", split: "S" })], ratified: [] };
    expect(evaluateRow(split, { eventId: "1000", personId: "10", perf: "230.000 km", nat: "GER" })).toEqual([]);
    expect(evaluateRow(split, { eventId: "1000", personId: "10", perf: "7:00:00", nat: "GER" })[0]).toMatchObject({ kind: "NR", split: true });
  });

  it("keys rows by event and person", () => {
    const map = evaluateRows(book, [{ eventId: 300, personId: 3 }, { eventId: 1, personId: 1 }]);
    expect(Array.from(map.keys())).toEqual([markerKey("300", "3")]);
  });
});

describe("matching", () => {
  it("matches a ratified record to the same run", () => {
    const [m] = matchRuns([iau({ value: T(6, 5, 35), date: "2023-05-14" })], book.duv);
    expect(m).toMatchObject({ personId: "1", eventId: "100", matchedBy: "run" });
  });

  it("allows the start day to differ by one day", () => {
    const [m] = matchRuns([iau({ value: T(6, 5, 35), date: "2023-05-15" })], book.duv);
    expect(m.personId).toBe("1");
  });

  it("leaves a record unmatched when date or mark differ", () => {
    const [a] = matchRuns([iau({ value: T(6, 5, 38), date: "2023-05-14" })], book.duv);
    const [b] = matchRuns([iau({ value: T(6, 5, 35), date: "2023-05-16" })], book.duv);
    expect(a.personId).toBeNull();
    expect(b.personId).toBeNull();
  });

  it("matches a holder by full birth date and name, only when exactly one fits", () => {
    const mark = iau({ holder: "André Collet", dob: "05.03.1959", nat: "GER", value: T(6, 38, 51), date: "2010-01-01" });
    const one = { personId: "5", firstName: "Andre", lastName: "COLLET", dob: "05.03.1959", nat: "GER", perfs: [{ eventId: "500", date: "2010-01-01", value: T(6, 38, 51) }] };
    expect(pickHolder(mark, [one])?.personId).toBe("5");
    expect(applyHolder(mark, one)).toMatchObject({ personId: "5", eventId: "500", matchedBy: "holder" });
    // Two runners with the same name and birth date: not guessed.
    expect(pickHolder(mark, [one, { ...one, personId: "55" }])).toBeNull();
    // A year alone never matches.
    expect(pickHolder({ ...mark, dob: "1959" }, [one])).toBeNull();
    // Another nationality rules a candidate out.
    expect(pickHolder(mark, [{ ...one, nat: "FRA" }])).toBeNull();
  });
});
