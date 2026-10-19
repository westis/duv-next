import { describe, expect, it } from "vitest";
import { courseProgression, courseRecordsOfEdition, parseWinner, sameCourse, type EditionRow } from "./course";

const editions: EditionRow[] = [
  { EventID: "101140", Year: "2024", SDate: "06.04.2024", Duration: "24h", Winner_M: "1#Ondrej Pouc 187.207", Winner_W: "2#Sona Mihulova 165.405" },
  { EventID: "96534", Year: "2023", SDate: "21.10.2023", Duration: "24h", Winner_M: "1#Dusan Curda 165.753", Winner_W: "6#Yvonne Wiesner 100.000" },
  { EventID: "90000", Year: "2022", SDate: "01.10.2022", Duration: "24h", Winner_M: "1#Old Winner 190.000", Winner_W: "" },
  { EventID: "80000", Year: "2022", SDate: "01.10.2022", Duration: "48h", Winner_M: "1#Other Course 300.000", Winner_W: "" },
];

describe("course records", () => {
  it("reads winner cells", () => {
    expect(parseWinner("1#Ondrej Pouc 187.207", "distance")).toEqual({ rank: 1, name: "Ondrej Pouc", perf: "187.207", value: 187.207 });
    expect(parseWinner("3#Anna van der Berg 7:12:44 h", "time")).toMatchObject({ rank: 3, name: "Anna van der Berg", value: 7 * 3600 + 12 * 60 + 44 });
    expect(parseWinner("", "time")).toBeNull();
  });

  it("compares courses by duration, or by length within 1%", () => {
    expect(sameCourse({ Duration: "24h" }, { Duration: "24h" })).toBe(true);
    expect(sameCourse({ Duration: "24h" }, { Duration: "48h" })).toBe(false);
    expect(sameCourse({ Length: "100km" }, { Length: "100.8km" })).toBe(true);
    expect(sameCourse({ Length: "100km" }, { Length: "102km" })).toBe(false);
    expect(sameCourse({ Length: "100km" }, { Duration: "24h" })).toBe(false);
  });

  it("builds the progression per gender, oldest first", () => {
    const p = courseProgression({ Duration: "24h" }, editions);
    expect(p.M.map((w) => w.value)).toEqual([190]);
    expect(p.W.map((w) => w.value)).toEqual([100, 165.405]);
  });

  it("gives a CR only when an earlier edition is beaten", () => {
    const crs = courseRecordsOfEdition({ EventID: "101140", Duration: "24h" }, editions);
    expect(crs.M).toBeUndefined();
    expect(crs.W).toMatchObject({ kind: "CR", previous: { name: "Yvonne Wiesner", value: 100, year: "2023" } });
    // Never in a first edition.
    expect(courseRecordsOfEdition({ EventID: "90000", Duration: "24h" }, editions)).toEqual({});
  });
});
