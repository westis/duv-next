import { describe, expect, it } from "vitest";
import { discoverGomuSheets, gomuCsvUrl, parseCsv, parseGomuDate, parseGomuSheet, parseGomuTime } from "./gomu";

const SHEET_72H = [
  "72 Hours Women,,,,,,,,,",
  "Category,Status,Distance (km),Athlete,Nationality,Date of Birth,Place,Start Date,End Date,Notes",
  'GOMU WR,GOMU-ratified,"1,045.519 ","Barbulescu, Ana",ROU,1972-Mar-02,"Athens, GRE",2023-May-01,2023-May-04,R',
  "35,Initial,350.100,Jane Doe,USA,1980-June-1,Phoenix,2022-Jan-01,2022-Jan-04,",
  "40,,,,,,,,,",
  "45,Pending,400.000,Pending Runner,GER,,Berlin,2025-May-30,2025-Jun-02,",
  ",,,,,,,,,",
  "Old table,something,else,,,,,,,",
].join("\n");

describe("GOMU", () => {
  it("finds the published workbook and tabs in the page", () => {
    const iframes = Array.from({ length: 22 }, (_, i) =>
      `<div data-code="&lt;iframe src=&quot;https://docs.google.com/spreadsheets/d/e/2PACX-abc_DEF/pubhtml?gid=${1000 + i}&amp;single=true&quot;&gt;"></div>`
    ).join("");
    const found = discoverGomuSheets(iframes);
    expect(found.pubId).toBe("2PACX-abc_DEF");
    expect(found.gids).toHaveLength(22);
    expect(gomuCsvUrl(found.pubId, "1000")).toBe(
      "https://docs.google.com/spreadsheets/d/e/2PACX-abc_DEF/pub?gid=1000&single=true&output=csv"
    );
    expect(() => discoverGomuSheets("<p>no sheets</p>")).toThrow();
  });

  it("parses quoted CSV fields", () => {
    expect(parseCsv('a,"b, c","d ""e"""\r\n1,2,3')).toEqual([
      ["a", "b, c", 'd "e"'],
      ["1", "2", "3"],
    ]);
  });

  it("reads GOMU times and dates", () => {
    expect(parseGomuTime("12d 14:38:40")).toBe(12 * 86400 + 14 * 3600 + 38 * 60 + 40);
    expect(parseGomuTime("14:38:40")).toBe(14 * 3600 + 38 * 60 + 40);
    expect(parseGomuDate("2025-May-30")).toBe("2025-05-30");
    expect(parseGomuDate("2024-June-2")).toBe("2024-06-02");
    expect(parseGomuDate("2024-Foo-2")).toBeNull();
  });

  it("reads a sheet's records and skips empty bands and scrap", () => {
    const warnings: string[] = [];
    const records = parseGomuSheet(SHEET_72H, warnings);
    expect(records).toHaveLength(3);
    expect(records[0]).toMatchObject({
      dist: "72h",
      gender: "W",
      category: "Overall",
      body: "GOMU",
      status: "current",
      value: 1045.519,
      holder: "Ana Barbulescu",
      nat: "ROU",
      dob: "02.03.1972",
      date: "2023-05-01",
      endDate: "2023-05-04",
    });
    expect(records[1]).toMatchObject({ category: "35", value: 350.1 });
    expect(records[2]).toMatchObject({ category: "45", status: "pending" });
    expect(warnings).toEqual([]);
  });

  it("leaves 48 h and 6 days to the IAU, and other events DUV has no list for", () => {
    const warnings: string[] = [];
    const header = "Category,Status,Distance (km),Athlete\nGOMU WR,GOMU-ratified,400,A B";
    expect(parseGomuSheet(`48 Hours Women\n${header}`, warnings)).toEqual([]);
    expect(parseGomuSheet(`500 Miles Women\n${header}`, warnings)).toEqual([]);
  });

  it("reads time sheets", () => {
    const csv = "1000 Miles Men\nCategory,Status,Time,Athlete\nGOMU WR,GOMU-ratified,10d 10:30:36,\"Smith, Yiannis\"";
    expect(parseGomuSheet(csv, [])[0]).toMatchObject({ dist: "1000mi", value: 10 * 86400 + 10 * 3600 + 30 * 60 + 36, holder: "Yiannis Smith" });
  });
});
