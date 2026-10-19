import { describe, expect, it } from "vitest";
import { formatClimb, formatCourseLength, formatLengthAndClimb, parseClimb } from "./course";

const nb = " ";

describe("parseClimb", () => {
  it("reads DUV's AltitudeDiff forms", () => {
    expect(parseClimb("6500Hm")).toBe(6500);
    expect(parseClimb("600Hm")).toBe(600);
    expect(parseClimb("6.500 Hm")).toBe(6500);
    expect(parseClimb("6,500m")).toBe(6500);
    expect(parseClimb("1200 m+")).toBe(1200);
    expect(parseClimb("D+ 2500")).toBe(2500);
    expect(parseClimb("+2500 m")).toBe(2500);
    expect(parseClimb("2500/2500Hm")).toBe(2500);
    expect(parseClimb(812)).toBe(812);
  });

  it("gives null for empty, zero, per-lap and unreadable values", () => {
    expect(parseClimb("")).toBeNull();
    expect(parseClimb("&nbsp;")).toBeNull();
    expect(parseClimb(null)).toBeNull();
    expect(parseClimb("0Hm")).toBeNull();
    expect(parseClimb("10m/lap")).toBeNull();
    expect(parseClimb("hilly")).toBeNull();
  });
});

describe("formatClimb", () => {
  it("groups thousands with a space and adds m+", () => {
    expect(formatClimb("6500Hm", "en")).toBe(`6${nb}500${nb}m+`);
    expect(formatClimb("6500Hm", "de")).toBe(`6${nb}500${nb}m+`);
    expect(formatClimb("12000Hm", "en")).toBe(`12${nb}000${nb}m+`);
    expect(formatClimb("600Hm", "en")).toBe(`600${nb}m+`);
    expect(formatClimb("10m/lap", "en")).toBeNull();
  });
});

describe("formatCourseLength", () => {
  it("spaces the unit and uses the locale's decimal sign", () => {
    expect(formatCourseLength("117km", "en")).toBe("117 km");
    expect(formatCourseLength("45.6km", "en")).toBe("45.6 km");
    expect(formatCourseLength("45.6km", "de")).toBe("45,6 km");
    expect(formatCourseLength("100mi", "en")).toBe("100 mi");
    expect(formatCourseLength("24h", "en")).toBe("24 h");
  });

  it("handles lists, thousands commas and stage races", () => {
    expect(formatCourseLength("100mi,100km", "en")).toBe("100 mi, 100 km");
    expect(formatCourseLength("1,461km", "en")).toBe("1461 km");
    expect(formatCourseLength("1284km/21Etappen", "en")).toBe("1284 km");
  });

  it("returns unknown shapes trimmed", () => {
    expect(formatCourseLength(" approx. 50 km ", "en")).toBe("approx. 50 km");
    expect(formatCourseLength("", "en")).toBe("");
  });
});

describe("formatLengthAndClimb", () => {
  it("joins length and climb", () => {
    expect(formatLengthAndClimb({ length: "117km", climb: "6500Hm" }, "en")).toBe(`117 km · 6${nb}500${nb}m+`);
  });

  it("leaves out the half DUV does not have", () => {
    expect(formatLengthAndClimb({ length: "100km", climb: "" }, "en")).toBe("100 km");
    expect(formatLengthAndClimb({ length: "", climb: "2500Hm" }, "en")).toBe(`2${nb}500${nb}m+`);
    expect(formatLengthAndClimb({}, "en")).toBe("");
  });
});
