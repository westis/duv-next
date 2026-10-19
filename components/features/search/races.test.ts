import { describe, expect, it } from "vitest";
import type { EventSearchHit } from "../../../lib/duv/types";
import { groupRaces, parseActiveRange, sortByDate, sortByRelevance, spanAxis } from "./races";

function hit(over: Partial<EventSearchHit>): EventSearchHit {
  return {
    EventID: "1",
    PartOf: "0",
    ParentID: "0",
    EventName: "Race",
    EventType: "1",
    Startdate: "2020-01-01 00:00:00",
    Enddate: "2020-01-01 00:00:00",
    Length: "100km",
    Duration: "",
    AltitudeDiff: "",
    City: "Town",
    Country: "GER",
    FinisherM: "10",
    FinisherW: "5",
    NormLen: "100",
    ...over,
  } as EventSearchHit;
}

const TODAY = "2026-10-19";

describe("groupRaces", () => {
  it("joins a series by ParentID across renames and leaves other series apart", () => {
    const groups = groupRaces(
      [
        hit({ EventID: "3", ParentID: "1", EventName: "100 Miles - Around Mors", Startdate: "2024-09-07", City: "Nykøbing Mors" }),
        hit({ EventID: "1", ParentID: "1", EventName: "Mors 100 miles", Startdate: "2008-05-31", City: "Nykoebing Mors" }),
        hit({ EventID: "9", ParentID: "9", EventName: "Other", Startdate: "2016-02-27" }),
      ],
      TODAY
    );
    expect(groups).toHaveLength(2);
    const mors = groups.find((g) => g.key === "3")!;
    expect(mors.name).toBe("100 Miles - Around Mors");
    expect(mors.editionCount).toBe(2);
    expect(mors.firstYear).toBe(2008);
    expect(mors.years).toHaveLength(2024 - 2008 + 1);
    expect(mors.years[1]).toEqual({ year: 2009, id: null, finishers: null });
  });

  it("joins the distances of one event and counts its day once", () => {
    const [g] = groupRaces(
      [
        hit({ EventID: "10", ParentID: "10", EventName: "Camp Croft", Length: "50km", NormLen: "50", Startdate: "2027-03-20" }),
        hit({ EventID: "11", ParentID: "11", EventName: "Camp Croft", Length: "100mi", NormLen: "160.9", Startdate: "2027-03-20" }),
      ],
      TODAY
    );
    expect(g.editionCount).toBe(1);
    expect(g.distances.map((d) => d.length)).toEqual(["100mi", "50km"]);
    expect(g.shown.upcoming).toBe(true);
  });

  it("shows the next edition, and the last field from the latest results", () => {
    const [g] = groupRaces(
      [
        hit({ EventID: "a", ParentID: "a", Startdate: "2027-09-25", FinisherM: null, FinisherW: null }),
        hit({ EventID: "b", ParentID: "a", Startdate: "2026-09-26", FinisherM: "250", FinisherW: "28" }),
        hit({ EventID: "c", ParentID: "a", Startdate: "2020-09-26", FinisherM: null, FinisherW: null }),
      ],
      TODAY
    );
    expect(g.shown.id).toBe("a");
    expect(g.lastField).toBe(278);
    expect(g.years.find((y) => y.year === 2020)).toEqual({ year: 2020, id: "c", finishers: null });
  });

  it("leaves out splits and marks trail races", () => {
    const groups = groupRaces(
      [
        hit({ EventID: "5", ParentID: "5", EventType: "2", AltitudeDiff: "6500Hm", Length: "117km" }),
        hit({ EventID: "6", PartOf: "5" }),
      ],
      TODAY
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].trail).toBe(true);
    expect(groups[0].shown.climb).toBe("6500Hm");
  });

  it("sorts newest first, or by relevance for quick search", () => {
    const groups = groupRaces(
      [
        hit({ EventID: "1", ParentID: "1", EventName: "Spartathlon", Startdate: "2025-09-26" }),
        hit({ EventID: "2", ParentID: "1", EventName: "Spartathlon", Startdate: "2026-09-26" }),
        hit({ EventID: "3", ParentID: "3", EventName: "Fuji Sparta", Startdate: "2027-04-18" }),
      ],
      TODAY
    );
    expect(sortByDate(groups).map((g) => g.name)).toEqual(["Fuji Sparta", "Spartathlon"]);
    expect(sortByRelevance(groups, "sparta").map((g) => g.name)).toEqual(["Spartathlon", "Fuji Sparta"]);
  });
});

describe("parseActiveRange and spanAxis", () => {
  it("reads DUV's ranges", () => {
    expect(parseActiveRange("1983-2014")).toEqual({ from: 1983, to: 2014 });
    expect(parseActiveRange("2022-2022")).toEqual({ from: 2022, to: 2022 });
    expect(parseActiveRange("2022")).toEqual({ from: 2022, to: 2022 });
    expect(parseActiveRange("")).toBeNull();
  });

  it("spans the earliest to the latest year", () => {
    expect(spanAxis([{ from: 1991, to: 2002 }, { from: 1983, to: 2014 }, { from: null, to: null }])).toEqual({
      from: 1983,
      to: 2014,
    });
    expect(spanAxis([{ from: null, to: null }])).toBeNull();
  });
});

describe("formatDistances", () => {
  it("keeps the readable lengths of a combined field and names a trail race's climb", async () => {
    const { formatDistances } = await import("./raceText");
    expect(formatDistances([{ length: "24h,12h,6h,100mi,100", climb: "", trail: false }], "en")).toBe(
      "24 h, 12 h, 6 h, 100 mi"
    );
    expect(formatDistances([{ length: "117km", climb: "6500Hm", trail: true }], "en")).toBe("117 km · 6\u00a0500\u00a0m+");
    expect(formatDistances([{ length: "246km", climb: "2600m", trail: false }], "en")).toBe("246 km");
  });
});

describe("groupRaces, distances of one event", () => {
  it("joins differently named distances held in one place and year", async () => {
    const { groupRaces, nameStem } = await import("./races");
    expect(nameStem("Camp Croft 100 Miler")).toBe("camp croft");
    expect(nameStem("Spartanion 24-Hour Race")).toBe("spartanion");
    const groups = groupRaces(
      [
        hit({ EventID: "1", ParentID: "1", EventName: "Camp Croft 100 Miler", Startdate: "2027-03-20", NormLen: "160.9", Length: "100mi" }),
        hit({ EventID: "2", ParentID: "2", EventName: "Camp Croft 50 km", Startdate: "2027-03-20", NormLen: "50", Length: "50km" }),
        hit({ EventID: "3", ParentID: "1", EventName: "Camp Croft 100 Miler", Startdate: "2026-03-21", NormLen: "160.9", Length: "100mi" }),
        hit({ EventID: "4", ParentID: "4", EventName: "Prisoner of War 50 km", Startdate: "2026-10-24" }),
      ],
      TODAY
    );
    expect(groups).toHaveLength(2);
    const croft = groups.find((g) => g.name === "Camp Croft")!;
    expect(croft.editionCount).toBe(2);
    expect(croft.distances.map((d) => d.id)).toEqual(["1", "2"]);
  });
});
