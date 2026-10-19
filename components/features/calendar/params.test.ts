import { describe, expect, it } from "vitest";
import { apiDist, presetRange, calendarQuery, defaultOrder, groupDistances, parseCalendarParams, yearToRange } from "./params";

const NOW = new Date("2026-10-19T10:00:00Z");

describe("yearToRange", () => {
  it("maps old year links to date ranges", () => {
    expect(yearToRange("past1", NOW)).toEqual({ from: "2025-10-19", to: "2026-10-19" });
    expect(yearToRange("2024", NOW)).toEqual({ from: "2024-01-01", to: "2024-12-31" });
    expect(yearToRange("all", NOW)?.from).toBe("1800-01-01");
    expect(yearToRange("futur", NOW)).toBeNull();
    expect(yearToRange(undefined, NOW)).toBeNull();
  });

  it("keeps 29 February inside the month", () => {
    expect(yearToRange("past1", new Date("2028-02-29T12:00:00Z"))).toEqual({ from: "2027-02-28", to: "2028-02-29" });
  });
});

describe("parseCalendarParams", () => {
  it("defaults to today onward, soonest first", () => {
    const state = parseCalendarParams({}, NOW);
    expect(state.from).toBeUndefined();
    expect(state.order).toBe("asc");
    expect(calendarQuery(state, NOW)).toBe("");
  });

  it("reads ?year=past1 as the last 12 months, newest first", () => {
    const state = parseCalendarParams({ year: "past1" }, NOW);
    expect(state).toMatchObject({ from: "2025-10-19", to: "2026-10-19", order: "desc" });
    expect(calendarQuery(state, NOW)).toBe("?from=2025-10-19&to=2026-10-19");
  });

  it("prefers an explicit range and ignores a reversed one", () => {
    expect(parseCalendarParams({ from: "2026-11-01", to: "2026-12-31", year: "2024" }, NOW)).toMatchObject({
      from: "2026-11-01",
      order: "asc",
    });
    expect(parseCalendarParams({ from: "2026-12-31", to: "2026-11-01" }, NOW).from).toBeUndefined();
  });
});

describe("defaultOrder", () => {
  it("is newest first for a range that starts in the past", () => {
    expect(defaultOrder("2026-01-01", NOW)).toBe("desc");
    expect(defaultOrder("2026-10-19", NOW)).toBe("asc");
    expect(defaultOrder(undefined, NOW)).toBe("asc");
  });
});

describe("surface", () => {
  it("reads old dist=Trail links as the surface filter", () => {
    const state = parseCalendarParams({ dist: "Trail" }, NOW);
    expect(state).toMatchObject({ dist: "all", surface: "trail" });
    expect(calendarQuery(state, NOW)).toBe("?surface=trail");
    expect(apiDist(state)).toBe("Trail");
  });

  it("sends the format when both are chosen", () => {
    const state = parseCalendarParams({ dist: "100mi", surface: "trail" }, NOW);
    expect(apiDist(state)).toBe("100mi");
    expect(calendarQuery(state, NOW)).toBe("?dist=100mi&surface=trail");
  });

  it("leaves surfaces out of the format list", () => {
    const groups = groupDistances(["all", "", "100km", "", "Road", "Trail", "Backy"], ["all", "-", "100 km", "-", "road", "trail", "Backyard"]);
    expect(groups.flatMap((g) => g.options.map((o) => o.value))).toEqual(["100km", "Backy"]);
  });
});

describe("presetRange", () => {
  it("fills in both dates", () => {
    expect(presetRange("last14", "2026-10-19")).toEqual({ from: "2026-10-05", to: "2026-10-19" });
    expect(presetRange("next30", "2026-10-19")).toEqual({ from: "2026-10-19", to: "2026-11-18" });
    expect(presetRange("thisYear", "2026-10-19")).toEqual({ from: "2026-01-01", to: "2026-12-31" });
  });
});
