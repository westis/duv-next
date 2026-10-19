import { describe, expect, it } from "vitest";
import { compareRunnerNames, formatRunnerName, parseDuvName, runnerSortKey } from "./names";

describe("names", () => {
  it("puts the given name first and uppercases the surname", () => {
    expect(formatRunnerName({ first: "Ondrej", last: "Pouc" }, "en")).toBe("Ondrej POUC");
    expect(formatRunnerName({ first: "Åsa", last: "Ölund" }, "de")).toBe("Åsa ÖLUND");
    expect(formatRunnerName({ first: "Ali", last: "Yildiz" }, "tr")).toBe("Ali YİLDİZ");
    expect(formatRunnerName({ first: "&nbsp;", last: "Pouc" }, "en")).toBe("POUC");
    expect(formatRunnerName({ first: "Ondrej", last: null }, "en")).toBe("Ondrej");
  });

  it("parses DUV's surname-first form", () => {
    expect(parseDuvName("Pouc, Ondrej")).toEqual({ first: "Ondrej", last: "Pouc" });
    expect(parseDuvName("van der Berg, Anna Maria")).toEqual({ first: "Anna Maria", last: "van der Berg" });
    expect(parseDuvName("Pouc")).toEqual({ first: "", last: "Pouc" });
    expect(parseDuvName(undefined)).toEqual({ first: "", last: "" });
  });

  it("sorts by surname", () => {
    expect(runnerSortKey({ first: "Ondrej", last: "Pouc" }, "en")).toBe("pouc, ondrej");
    const names = [
      { first: "B", last: "Öberg" },
      { first: "A", last: "Zeller" },
      { first: "A", last: "Oberg" },
    ];
    expect([...names].sort((a, b) => compareRunnerNames(a, b, "de")).map((n) => n.last)).toEqual([
      "Oberg",
      "Öberg",
      "Zeller",
    ]);
  });
});
