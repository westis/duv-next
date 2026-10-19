import { describe, expect, it } from "vitest";
import type { DuvBest, RatifiedMark } from "../../../lib/records/types";
import { flagWords, resolveCell, splitHolder, type CellInput } from "./cells";

const duv = (over: Partial<DuvBest> = {}): DuvBest => ({
  dist: "24h",
  gender: "W",
  scope: "world",
  scopeCode: "WORLD",
  category: "Overall",
  value: 278.622,
  perfRaw: "278.622 km",
  personId: "1",
  eventId: "10",
  perfId: "100",
  firstName: "Sarah",
  lastName: "Webster",
  nat: "GBR",
  dob: "",
  date: "2025-10-18",
  eventName: "IAU 24h",
  city: "Albi",
  country: "FRA",
  split: "",
  ...over,
});

const iau = (over: Partial<RatifiedMark> = {}): RatifiedMark => ({
  dist: "24h",
  gender: "W",
  scope: "world",
  scopeCode: "WORLD",
  category: "Overall",
  body: "IAU",
  status: "current",
  value: 270.116,
  perfRaw: "270.116",
  holder: "Camille Herron",
  nat: "USA",
  dob: null,
  date: "2023-03-04",
  endDate: null,
  venue: "Taipei (TPE)",
  notes: null,
  personId: null,
  eventId: null,
  matchedBy: null,
  ...over,
});

const input = (over: Partial<CellInput>): CellInput => ({
  dist: "24h",
  scope: "world",
  gender: "W",
  category: "Overall",
  best: null,
  ratified: null,
  pending: [],
  body: "IAU",
  sourceUpdated: null,
  ...over,
});

describe("resolveCell", () => {
  it("is null when nothing is known", () => {
    expect(resolveCell(input({}))).toBeNull();
  });

  it("marks DUV's best as ratified when it is the ratified mark", () => {
    const cell = resolveCell(input({ best: duv({ value: 270.116 }), ratified: iau() }))!;
    expect(cell).toMatchObject({ status: "ratified", source: "duv", personId: "1", previous: null });
  });

  it("keeps the beaten ratified record as the previous one", () => {
    const cell = resolveCell(input({ best: duv(), ratified: iau() }))!;
    expect(cell.status).toBe("duvBest");
    expect(cell.previous).toMatchObject({ first: "Camille", last: "Herron", value: 270.116 });
  });

  it("says pending when an application matches DUV's best", () => {
    const cell = resolveCell(input({ best: duv(), ratified: iau(), pending: [iau({ status: "pending", value: 278.62 })] }))!;
    expect(cell.status).toBe("pending");
  });

  it("shows the ratified mark when it beats everything in DUV's lists", () => {
    const cell = resolveCell(input({ best: duv({ value: 260 }), ratified: iau() }))!;
    expect(cell).toMatchObject({ status: "ratified", source: "ratified", place: "Taipei (TPE)" });
    expect(cell.duvBest?.value).toBe(260);
  });

  it("is unratified where no body ratifies", () => {
    const cell = resolveCell(input({ scope: "nation", body: null, best: duv() }))!;
    expect(cell.status).toBe("unratified");
  });

  it("compares times the other way round", () => {
    const best = duv({ dist: "100km", value: 6 * 3600 + 5 * 60 + 35, perfRaw: "6:05:35" });
    const ratified = iau({ dist: "100km", value: 6 * 3600 + 9 * 60 + 14, perfRaw: "6:09:14" });
    const cell = resolveCell(input({ dist: "100km", best, ratified }))!;
    expect(cell.status).toBe("duvBest");
    expect(cell.previous?.perf).toBe("6:09:14");
  });
});

describe("helpers", () => {
  it("splits an IAU holder into given name and surname", () => {
    expect(splitHolder("Aleksandr Sorokin")).toEqual({ first: "Aleksandr", last: "Sorokin" });
    expect(splitHolder("Sorokin")).toEqual({ first: "", last: "Sorokin" });
    expect(splitHolder("Desiree LINDEN")).toEqual({ first: "Desiree", last: "LINDEN" });
    expect(splitHolder("LINDEN Desiree")).toEqual({ first: "Desiree", last: "LINDEN" });
  });

  it("writes DUV's flags as words", () => {
    expect(flagWords("ST")).toEqual(["split", "track"]);
    expect(flagWords("")).toEqual([]);
  });
});
