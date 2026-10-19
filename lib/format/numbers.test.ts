import { describe, expect, it } from "vitest";
import {
  formatCount,
  formatDistance,
  formatDuration,
  formatLaps,
  formatPace,
  formatPerformance,
  formatSpeed,
  parseDuration,
  parsePerformance,
  formatPerformanceText,
} from "./numbers";

describe("formatDistance", () => {
  it("prints 3 decimals with the locale's decimal sign", () => {
    expect(formatDistance("187.207 km", "en")).toEqual({ number: "187.207", unit: "km", text: "187.207 km" });
    expect(formatDistance(187.207, "de")?.text).toBe("187,207 km");
    expect(formatDistance("187.207", "fr")?.text).toBe("187,207 km");
    expect(formatDistance("187.207", "ja")?.text).toBe("187.207 km");
    expect(formatDistance(100, "en")?.text).toBe("100.000 km");
  });

  it("does not group thousands", () => {
    expect(formatDistance("1036.851", "en")?.text).toBe("1036.851 km");
  });

  it("can force the classic dot", () => {
    expect(formatDistance("187.207", "de", { classicDot: true })?.text).toBe("187.207 km");
  });

  it("converts to miles", () => {
    expect(formatDistance("160.9344", "en", { unit: "mi" })).toEqual({ number: "100.000", unit: "mi", text: "100.000 mi" });
    expect(formatDistance("187.207", "de", { unit: "mi" })?.text).toBe("116,325 mi");
  });

  it("returns null for bad input", () => {
    expect(formatDistance("&nbsp;", "en")).toBeNull();
    expect(formatDistance("7:52:31 h", "en")).toBeNull();
  });
});

describe("formatDuration", () => {
  it("prints h:mm:ss and keeps counting hours past 24", () => {
    expect(formatDuration("7:52:31 h")).toBe("7:52:31");
    expect(formatDuration("07:52:31")).toBe("7:52:31");
    expect(formatDuration("165:13:22 h")).toBe("165:13:22");
    expect(formatDuration(28351)).toBe("7:52:31");
    expect(formatDuration(594802)).toBe("165:13:22");
    expect(formatDuration(59)).toBe("0:00:59");
  });

  it("parses to seconds", () => {
    expect(parseDuration("165:13:22 h")).toBe(594802);
    expect(parseDuration("7:61:00")).toBeNull();
    expect(parseDuration("187.207")).toBeNull();
    expect(formatDuration(-1)).toBeNull();
  });
});

describe("counts and laps", () => {
  it("groups by locale", () => {
    expect(formatCount(2115800, "en")).toBe("2,115,800");
    expect(formatCount("2115800", "de")).toBe("2.115.800");
    expect(formatCount(2115800, "fr")).toBe("2 115 800");
    expect(formatCount("x", "en")).toBeNull();
  });

  it("formats laps as a bare number", () => {
    expect(formatLaps(38, "en")).toBe("38");
    expect(formatLaps("38", "de")).toBe("38");
    expect(formatLaps(1234, "en")).toBe("1,234");
    expect(formatLaps(3.5, "en")).toBeNull();
  });
});

describe("speed and pace", () => {
  it("prints speed with 2 decimals", () => {
    expect(formatSpeed(7.8, "en")).toEqual({ number: "7.80", unit: "km/h", text: "7.80 km/h" });
    expect(formatSpeed("7.804", "de")?.text).toBe("7,80 km/h");
    expect(formatSpeed("7.804", "de", { classicDot: true })?.text).toBe("7.80 km/h");
    expect(formatSpeed(16.09344, "en", { unit: "mi" })?.text).toBe("10.00 mph");
  });

  it("prints pace per km or mile", () => {
    expect(formatPace("7.804")).toEqual({ number: "7:41", unit: "/km", text: "7:41 /km" });
    expect(formatPace(12)?.text).toBe("5:00 /km");
    expect(formatPace(9.656064, { unit: "mi" })?.text).toBe("10:00 /mi");
    expect(formatPace(0.5)?.text).toBe("2:00:00 /km");
    expect(formatPace(0)).toBeNull();
  });
});

describe("performances", () => {
  it("detects the kind", () => {
    expect(parsePerformance("7:52:31 h")).toEqual({ kind: "time", value: 28351 });
    expect(parsePerformance("187.207 km")).toEqual({ kind: "distance", value: 187.207 });
    expect(parsePerformance("187.207")).toEqual({ kind: "distance", value: 187.207 });
    expect(parsePerformance("38 laps")).toEqual({ kind: "laps", value: 38 });
    expect(parsePerformance("&nbsp;")).toBeNull();
  });

  it("formats by kind", () => {
    expect(formatPerformance("7:52:31 h", "de")?.text).toBe("7:52:31");
    expect(formatPerformance("165:13:22 h", "en")?.text).toBe("165:13:22");
    expect(formatPerformance("187.207 km", "en")?.text).toBe("187.207 km");
    expect(formatPerformance("187.207", "de")?.text).toBe("187,207 km");
    expect(formatPerformance("187.207", "en", { unit: "mi" })?.unit).toBe("mi");
    expect(formatPerformance("38 laps", "en")).toEqual({ kind: "laps", value: 38, text: "38", unit: "" });
    expect(formatPerformance("DNF", "en")).toBeNull();
  });
});

describe("formatPerformanceText", () => {
  it("drops the trailing h and a leading zero hour", () => {
    expect(formatPerformanceText("6:10:55 h", "en")).toBe("6:10:55");
    expect(formatPerformanceText("08:57:49", "en")).toBe("8:57:49");
    expect(formatPerformanceText("03:37:16 h", "en")).toBe("3:37:16");
    expect(formatPerformanceText("165:13:22 h", "en")).toBe("165:13:22");
  });

  it("keeps km on distances", () => {
    expect(formatPerformanceText("187.207", "en")).toBe("187.207 km");
    expect(formatPerformanceText("117.865 km", "en")).toBe("117.865 km");
  });

  it("returns laps and unreadable values as sent, minus a trailing h", () => {
    expect(formatPerformanceText("38 laps", "en")).toBe("38 laps");
    expect(formatPerformanceText("DNF", "en")).toBe("DNF");
    expect(formatPerformanceText("ca. 7:52 h", "en")).toBe("ca. 7:52");
    expect(formatPerformanceText(null, "en")).toBe("");
  });
});
