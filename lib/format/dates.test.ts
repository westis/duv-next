import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateRange,
  formatDayMonth,
  formatMonthYear,
  formatStartTime,
  formatYear,
  parseDuvDate,
} from "./dates";

describe("parseDuvDate", () => {
  it("reads DUV and ISO forms", () => {
    expect(parseDuvDate("30.09.1981")).toEqual({ start: "1981-09-30" });
    expect(parseDuvDate("6.4.2024")).toEqual({ start: "2024-04-06" });
    expect(parseDuvDate("06.-07.04.2024")).toEqual({ start: "2024-04-06", end: "2024-04-07" });
    expect(parseDuvDate("30.09.-02.10.2024")).toEqual({ start: "2024-09-30", end: "2024-10-02" });
    expect(parseDuvDate("31.12.2024-01.01.2025")).toEqual({ start: "2024-12-31", end: "2025-01-01" });
    expect(parseDuvDate("31.12.2024 – 01.01.2025")).toEqual({ start: "2024-12-31", end: "2025-01-01" });
    expect(parseDuvDate("2024-04-06")).toEqual({ start: "2024-04-06" });
    expect(parseDuvDate("2024-04-06 12:00:00")).toEqual({ start: "2024-04-06" });
    expect(parseDuvDate("2024-04-06T12:00:00Z")).toEqual({ start: "2024-04-06" });
  });

  it("drops an end equal to the start", () => {
    expect(parseDuvDate("06.-06.04.2024")).toEqual({ start: "2024-04-06" });
  });

  it("returns null on bad input instead of throwing", () => {
    for (const bad of [null, undefined, "", "&nbsp;", "abc", "31.02.2024", "00.00.1981", "07.-06.04.2024", "2024-13-01", "13.2024"]) {
      expect(parseDuvDate(bad)).toBeNull();
    }
  });
});

describe("formatDate", () => {
  it("pads the day and uppercases the short month", () => {
    expect(formatDate("30.09.1981", "en")).toEqual({ text: "30 SEP 1981", dateTime: "1981-09-30" });
    expect(formatDate("2024-04-06", "en")?.text).toBe("06 APR 2024");
    expect(formatDate("2024-04-06 12:00:00", "en")?.text).toBe("06 APR 2024");
  });

  it("follows the locale's month names", () => {
    expect(formatDate("01.03.2024", "de")?.text).toBe("01 MÄRZ 2024");
    expect(formatDate("02.10.2024", "de")?.text).toBe("02 OKT 2024");
    expect(formatDate("30.09.1981", "fr")?.text).toBe("30 SEPT 1981");
    expect(formatDate("01.06.2024", "fr")?.text).toBe("01 JUIN 2024");
    expect(formatDate("01.07.2024", "fr")?.text).toBe("01 JUIL 2024");
    expect(formatDate("01.02.2024", "fr")?.text).toBe("01 FÉVR 2024");
    expect(formatDate("01.03.2024", "ru")?.text).toBe("01 МАРТ 2024");
    expect(formatDate("01.04.2024", "tr")?.text).toBe("01 NİS 2024");
  });

  it("uses the native pattern for scripts without letter case", () => {
    expect(formatDate("30.09.1981", "ja")).toEqual({ text: "1981年9月30日", dateTime: "1981-09-30" });
    expect(formatDate("30.09.1981", "zh")?.text).toBe("1981年9月30日");
    expect(formatDate("30.09.1981", "ko")?.text).toBe("1981년 9월 30일");
  });

  it("uses the start of a range", () => {
    expect(formatDate("06.-07.04.2024", "en")).toEqual({ text: "06 APR 2024", dateTime: "2024-04-06" });
  });

  it("falls back to en for a malformed locale", () => {
    expect(formatDate("30.09.1981", "not a locale!")?.text).toBe("30 SEP 1981");
  });

  it("returns null for bad input", () => {
    expect(formatDate("soon", "en")).toBeNull();
  });
});

describe("formatDateRange", () => {
  it("formats the three range shapes", () => {
    expect(formatDateRange("06.-07.04.2024", "en")).toEqual({ text: "06–07 APR 2024", dateTime: "2024-04-06" });
    expect(formatDateRange("30.09.-02.10.2024", "en")?.text).toBe("30 SEP – 02 OCT 2024");
    expect(formatDateRange("31.12.2024-01.01.2025", "en")?.text).toBe("31 DEC 2024 – 01 JAN 2025");
  });

  it("takes a separate end date", () => {
    expect(formatDateRange("2024-04-06 12:00:00", "en", "2024-04-07 12:00:00")?.text).toBe("06–07 APR 2024");
    expect(formatDateRange("30.09.2024", "de", "02.10.2024")?.text).toBe("30 SEP – 02 OKT 2024");
  });

  it("collapses a one-day range", () => {
    expect(formatDateRange("2024-04-06", "en", "2024-04-06")?.text).toBe("06 APR 2024");
    expect(formatDateRange("2024-04-06", "en")?.text).toBe("06 APR 2024");
  });

  it("localises month names", () => {
    expect(formatDateRange("31.12.2024-01.01.2025", "de")?.text).toBe("31 DEZ 2024 – 01 JAN 2025");
    expect(formatDateRange("30.09.-02.10.2024", "fr")?.text).toBe("30 SEPT – 02 OCT 2024");
  });

  it("uses the native pattern in ja", () => {
    expect(formatDateRange("06.-07.04.2024", "ja")?.text).toBe("2024年4月6–7日");
    expect(formatDateRange("30.09.-02.10.2024", "ja")?.text).toBe("2024年9月30日–10月2日");
    expect(formatDateRange("31.12.2024-01.01.2025", "ja")?.text).toBe("2024年12月31日–2025年1月1日");
  });
});

describe("formatMonthYear", () => {
  it("uppercases the long month", () => {
    expect(formatMonthYear("2026-10", "en")).toEqual({ text: "OCTOBER 2026", dateTime: "2026-10" });
    expect(formatMonthYear({ year: 2026, month: 10 }, "de")?.text).toBe("OKTOBER 2026");
    expect(formatMonthYear("10.2026", "fr")?.text).toBe("OCTOBRE 2026");
    expect(formatMonthYear("15.10.2026", "ru")?.text).toBe("ОКТЯБРЬ 2026");
    expect(formatMonthYear("2026-10-01", "el")?.text).toBe("ΟΚΤΩΒΡΙΟΣ 2026");
  });

  it("uses the native pattern in ja", () => {
    expect(formatMonthYear("2026-10", "ja")?.text).toBe("2026年10月");
  });

  it("returns null for bad input", () => {
    expect(formatMonthYear({ year: 2026, month: 13 }, "en")).toBeNull();
    expect(formatMonthYear("", "en")).toBeNull();
  });
});

describe("formatYear", () => {
  it("prints four digits", () => {
    expect(formatYear("2024", "ja")).toEqual({ text: "2024", dateTime: "2024" });
    expect(formatYear(2024)).toEqual({ text: "2024", dateTime: "2024" });
    expect(formatYear("30.09.1981", "de")?.text).toBe("1981");
    expect(formatYear("x")).toBeNull();
  });
});

describe("formatDayMonth", () => {
  it("gives day and short month", () => {
    expect(formatDayMonth("15.06.2024", "en")).toEqual({ text: "15 JUN", dateTime: "2024-06-15" });
    expect(formatDayMonth("15.06.2024", "fr")?.text).toBe("15 JUIN");
    expect(formatDayMonth("05.12.2024", "de")?.text).toBe("05 DEZ");
    expect(formatDayMonth("15.06.2024", "ja")?.text).toBe("6月15日");
  });
});

describe("formatStartTime", () => {
  it("prints 24-hour time", () => {
    expect(formatStartTime("2024-04-06 12:00:00")).toBe("12:00");
    expect(formatStartTime("2024-04-06 18:30:00")).toBe("18:30");
    expect(formatStartTime("9:05")).toBe("09:05");
  });

  it("gives an empty string for midnight or no time", () => {
    expect(formatStartTime("2024-04-06 00:00:00")).toBe("");
    expect(formatStartTime("2024-04-06 00:00:00", { keepMidnight: true })).toBe("00:00");
    expect(formatStartTime("2024-04-06")).toBe("");
    expect(formatStartTime(undefined)).toBe("");
    expect(formatStartTime("25:00")).toBe("");
  });
});
