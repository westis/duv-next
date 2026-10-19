import { describe, expect, it } from "vitest";
import type { CalendarRace } from "@/lib/duv/types";
import { formatOf, groupRows, isoDay, runningState, sharedName } from "./races";

function race(over: Partial<CalendarRace>): CalendarRace {
  return {
    EventID: "1",
    ParentID: "1",
    PartOf: "0",
    EventName: "Race",
    Edition: "",
    City: "Clarksville, AR",
    Country: "USA",
    EventType: "1",
    Results: "N",
    Length: "",
    Duration: "",
    IAULabel: "N",
    Startdate: "2026-10-23",
    Enddate: "0000-00-00 00:00:00",
    Year: "2026",
    Month: "10",
    Day: "23",
    Cupname: null,
    CupYear: null,
    ...over,
  };
}

describe("formatOf", () => {
  it("shows length, duration, or length and climb for trail", () => {
    expect(formatOf(race({ Length: "100mi" }), "en")).toBe("100 mi");
    expect(formatOf(race({ Duration: "48h" }), "en")).toBe("48 h");
    expect(formatOf(race({ EventType: "2", Length: "117km" }), "en", "6500Hm")).toBe("117 km · 6\u00a0500\u00a0m+");
    expect(formatOf(race({ EventType: "2", Length: "117km" }), "en")).toBe("117 km");
    expect(formatOf(race({ EventType: "10", Duration: "37h" }), "en")).toBe("");
  });
});

describe("sharedName", () => {
  it("cuts the shared start back to the race name", () => {
    expect(sharedName(["Glacial Trail 50 Mile Race", "Glacial Trail 50 km Race"])).toBe("Glacial Trail");
    expect(sharedName(["Hare Mountain 100", "Hare Mountain 50 Mile", "Hare Mountain 60K"])).toBe("Hare Mountain");
    expect(sharedName(["Self-Transcendence 6 hour", "Self-Transcendence 12 hour"])).toBe("Self-Transcendence");
    expect(sharedName(["Rocky Gap 50k", "Bizz Johnson 50 km"])).toBeNull();
    expect(sharedName(["Run 50k", "Run 100k"])).toBeNull();
  });
});

describe("groupRows", () => {
  it("puts the distances of one race on one row, longest first", () => {
    const rows = groupRows(
      [
        race({ EventID: "a", EventName: "Hare Mountain 50 Mile", Length: "50mi", EventType: "2" }),
        race({ EventID: "b", EventName: "Hare Mountain 100", Length: "100mi", EventType: "2", IAULabel: "B" }),
        race({ EventID: "c", EventName: "No Business 100", Length: "100mi", EventType: "2", City: "Jamestown, TN" }),
      ],
      "en"
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: "Hare Mountain", eventId: "b", iau: "B", surface: "trail" });
    expect(rows[0].formats.map((f) => f.text)).toEqual(["100 mi", "50 mi"]);
  });

  it("keeps different races in the same town apart", () => {
    const rows = groupRows(
      [race({ EventID: "a", EventName: "Rocky Gap 50k", Length: "50km" }), race({ EventID: "b", EventName: "Bizz Johnson 50 km", Length: "50km" })],
      "en"
    );
    expect(rows).toHaveLength(2);
  });

  it("puts timed races before distances", () => {
    const rows = groupRows(
      [
        race({ EventID: "a", EventName: "Weekend at Burney 12h", Duration: "12h" }),
        race({ EventID: "b", EventName: "Weekend at Burney 24h", Duration: "24h" }),
        race({ EventID: "c", EventName: "Weekend at Burney 100 km", Length: "100km" }),
      ],
      "en"
    );
    expect(rows[0].formats.map((f) => f.text)).toEqual(["24 h", "12 h", "100 km"]);
  });
});

describe("runningState", () => {
  it("counts the day of a multi-day race under way", () => {
    expect(runningState({ Startdate: "2026-08-30", Enddate: "2026-10-20 18:00:00" }, "2026-10-19")).toEqual({
      day: 51,
      total: 52,
      progress: 51 / 52,
    });
    expect(runningState({ Startdate: "2026-10-19", Enddate: "2026-10-21" }, "2026-10-19")).toBeNull();
    expect(runningState({ Startdate: "2026-10-10", Enddate: "0000-00-00 00:00:00" }, "2026-10-19")).toBeNull();
    expect(runningState({ Startdate: "2026-10-10", Enddate: "2026-10-18" }, "2026-10-19")).toBeNull();
  });

  it("reads DUV's empty end dates as none", () => {
    expect(isoDay("0000-00-00 00:00:00")).toBeNull();
    expect(isoDay(null)).toBeNull();
    expect(isoDay("2026-10-20 18:00:00")).toBe("2026-10-20");
  });
});
