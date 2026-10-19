import { describe, expect, it } from "vitest";
import {
  htmlTables,
  parseIauDates,
  parseIauDistance,
  parseIauRecords,
  parseIauTime,
  parseIauUpdated,
  parsePendingCell,
} from "./iau";

const HEADER = "<tr><td>Category</td><td>Status</td><td>Time</td><td>Athlete</td><td>Country</td><td>DOB</td><td>Place</td><td>MF</td><td>Date</td><td>Comments</td></tr>";

function row(cells: string[]) {
  return `<tr>${cells.map((c) => `<td class="x"><p>${c}</p></td>`).join("")}</tr>`;
}

function table(title: string, rows: string[][]) {
  return `<table border="1"><tr><td colspan="10"><b>${title}</b></td></tr>${HEADER}${rows.map(row).join("\n")}</table>`;
}

const TITLES = [
  "50 Km", "50 Miles", "100 Km", "100 Miles", "6 hours", "12 hours", "24 hours", "48 hours", "6 days",
].flatMap((d) => [`${d} Women`, `${d} Men`]);

/** Nine age bands per table, so 18 tables give 162 current records plus the special rows. */
function filler(title: string): string[][] {
  const time = /km|miles/i.test(title);
  return ["40", "45", "50", "55", "60", "65", "70", "75", "80"].map((band, i) => [
    band,
    "Current",
    time ? `${7 + i}:0${i}:1${i}` : `${200 - i * 10},50${i}`,
    `Runner${i}, Test`,
    "GER",
    `0${i + 1}.02.1960`,
    "Berlin",
    "GER",
    `1${i}.05.2019`,
    "",
  ]);
}

function page(extra: Record<string, string[][]> = {}, pending: string[][] = []) {
  const pendingTable = `<table><tr><td colspan="7">Pending IAU Records under ratification process</td></tr>
    <tr><td>Distance</td><td>Time / Distance</td><td>Athlete</td><td>Country</td><td>Place</td><td>Event date</td><td>Status</td></tr>
    ${pending.map(row).join("")}</table>`;
  const tables = TITLES.map((t) => table(t, [...(extra[t] ?? []), ...filler(t)])).join("\n");
  return `<html><body><h2>IAU Records (updated on 6th May 2026)</h2><table><tr><td>menu</td></tr></table>${pendingTable}${tables}</body></html>`;
}

describe("IAU cell readers", () => {
  it("reads times with colons or dots", () => {
    expect(parseIauTime("3:04:24")).toBe(3 * 3600 + 4 * 60 + 24);
    expect(parseIauTime("2.59.54")).toBe(2 * 3600 + 59 * 60 + 54);
    expect(parseIauTime("05:21:33")).toBe(5 * 3600 + 21 * 60 + 33);
    expect(parseIauTime("3:64:00")).toBeNull();
  });

  it("reads distances with the last separator as decimal", () => {
    expect(parseIauDistance("100,224")).toBeCloseTo(100.224);
    expect(parseIauDistance("1.007,600")).toBeCloseTo(1007.6);
    expect(parseIauDistance("278.621")).toBeCloseTo(278.621);
    expect(parseIauDistance("1045.519")).toBeCloseTo(1045.519);
    expect(parseIauDistance("1.036")).toBe(1036);
  });

  it("reads single days and ranges", () => {
    expect(parseIauDates("13.04.2021")).toEqual({ start: "2021-04-13", end: null });
    expect(parseIauDates("24/03/2024")).toEqual({ start: "2024-03-24", end: null });
    expect(parseIauDates("9-10.12.2017")).toEqual({ start: "2017-12-09", end: "2017-12-10" });
    expect(parseIauDates("28.04-04.05.2025")).toEqual({ start: "2025-04-28", end: "2025-05-04" });
    expect(parseIauDates("28.12.2014-3.01.2015")).toEqual({ start: "2014-12-28", end: "2015-01-03" });
    expect(parseIauDates("N.A.")).toBeNull();
    expect(parseIauDates("31.02.2020")).toBeNull();
  });

  it("reads the pending table's packed cell", () => {
    expect(parsePendingCell("12H / M45")).toEqual({ dist: "12h", gender: "M", category: "45" });
    expect(parsePendingCell("6D / W WBP")).toEqual({ dist: "6d", gender: "W", category: "Overall" });
    expect(parsePendingCell("50KW70")).toEqual({ dist: "50km", gender: "W", category: "70" });
    expect(parsePendingCell("1OOM/WR/W40")).toEqual({ dist: "100mi", gender: "W", category: "40" });
    expect(parsePendingCell("6D, Women WBP")).toEqual({ dist: "6d", gender: "W", category: "Overall" });
    expect(parsePendingCell("72H / M")).toBeNull();
  });

  it("finds the updated date", () => {
    expect(parseIauUpdated("<h2>IAU Records (updated on 6th May 2026)</h2>")).toBe("2026-05-06");
    expect(parseIauUpdated("<p>nothing</p>")).toBeNull();
  });

  it("splits tables into plain-text cells", () => {
    const tables = htmlTables("<table><tr><th>A&nbsp;b</th><td>S&oslash;rensen<br>J&uuml;rgen</td></tr></table>");
    expect(tables).toEqual([[["A b", "Sørensen Jürgen"]]]);
  });
});

describe("parseIauRecords", () => {
  const html = page(
    {
      "100 Km Men": [
        ["WR", "Current", "6:05:35", "Sorokin, Aleksandr", "LTU", "30.05.1981", "Vilnius", "LTU", "14.05.2023", ""],
        ["North America", "Current", "6:27:44", "Max King", "USA", "24.02.1980", "Doha", "QAT", "21.11.2014", ""],
        ["35", "N.A.", "N.A.", "", "", "", "", "", "", ""],
        ["Antarctica", "Current", "9:00:00", "X, Y", "ATA", "", "", "", "01.01.2020", ""],
      ],
      "24 hours Women": [
        ["IAU WR", "Initial", "278.621", "Camille Herron", "USA", "", "Albi", "FRA", "17-18.09.2022", "track"],
      ],
      "6 days Men": [["WBP", "New", "1.036,851", "Sorokin, Aleksandr", "JAP", "", "", "", "28.04-04.05.2025", ""]],
    },
    [["12H / M45", "160,378", "Fernando Martínez", "URU", "Montevideo", "22.06.2024", "Data requested"]]
  );
  const parsed = parseIauRecords(html);

  it("reads world, area and age group records", () => {
    const wr = parsed.records.find((r) => r.dist === "100km" && r.gender === "M" && r.category === "Overall" && r.scope === "world");
    expect(wr).toMatchObject({ body: "IAU", status: "current", value: 6 * 3600 + 5 * 60 + 35, holder: "Aleksandr Sorokin", nat: "LTU", dob: "30.05.1981", date: "2023-05-14", venue: "Vilnius (LTU)" });
    const ar = parsed.records.find((r) => r.scope === "area" && r.scopeCode === "NAM");
    expect(ar).toMatchObject({ dist: "100km", gender: "M", value: 6 * 3600 + 27 * 60 + 44, holder: "Max King" });
    expect(parsed.records.some((r) => r.dist === "100km" && r.category === "35")).toBe(false);
  });

  it("reads distances, WBP and country aliases", () => {
    const w24 = parsed.records.find((r) => r.dist === "24h" && r.gender === "W" && r.category === "Overall");
    expect(w24).toMatchObject({ value: 278.621, date: "2022-09-17", endDate: "2022-09-18" });
    const d6 = parsed.records.find((r) => r.dist === "6d" && r.gender === "M" && r.category === "Overall");
    expect(d6).toMatchObject({ value: 1036.851, nat: "JPN" });
  });

  it("keeps pending applications apart", () => {
    const pending = parsed.records.filter((r) => r.status === "pending");
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ dist: "12h", gender: "M", category: "45", value: 160.378, date: "2024-06-22" });
  });

  it("warns about unreadable rows instead of failing", () => {
    expect(parsed.warnings.some((w) => w.includes('unknown category "Antarctica"'))).toBe(true);
    expect(parsed.updated).toBe("2026-05-06");
  });

  it("refuses a page that lost its tables", () => {
    expect(() => parseIauRecords("<table><tr><td>50 Km Women</td></tr></table>")).toThrow(/record tables/);
  });

  it("refuses a page with too few current records", () => {
    const thin = TITLES.map((t) => table(t, [["WR", "Current", "7:00:00", "A B", "GER", "", "", "", "01.01.2020", ""]])).join("");
    expect(() => parseIauRecords(thin)).toThrow(/current records/);
  });
});
