import { describe, expect, it } from "vitest";
import { externalUrl, linkHost, splitLinks } from "./links";

describe("externalUrl", () => {
  it("accepts a lone link", () => {
    expect(externalUrl("https://itra.run/Races/RaceResults/Tour.de.Huangnichuan.50K/2025/106386")).toBe(
      "https://itra.run/Races/RaceResults/Tour.de.Huangnichuan.50K/2025/106386"
    );
    expect(externalUrl(" www.race.de ")).toBe("https://www.race.de/");
  });

  it("rejects text that is not just a link", () => {
    expect(externalUrl("Organiser")).toBeNull();
    expect(externalUrl("see www.race.de")).toBeNull();
    expect(externalUrl("race.de")).toBeNull();
    expect(externalUrl("&nbsp;")).toBeNull();
    expect(externalUrl(null)).toBeNull();
  });
});

describe("linkHost", () => {
  it("drops the scheme, www and path", () => {
    expect(linkHost("https://www.itra.run/Races/1")).toBe("itra.run");
    expect(linkHost("not a url")).toBe("not a url");
  });
});

describe("splitLinks", () => {
  it("keeps text around links and drops trailing punctuation", () => {
    expect(splitLinks("Organiser, https://x.de/r. Thanks")).toEqual([
      { text: "Organiser, " },
      { url: "https://x.de/r", raw: "https://x.de/r" },
      { text: ". Thanks" },
    ]);
  });

  it("returns plain text as one segment", () => {
    expect(splitLinks("Organiser")).toEqual([{ text: "Organiser" }]);
    expect(splitLinks("")).toEqual([]);
  });
});

describe("splitLinks line breaks", () => {
  it("keeps them", () => {
    expect(splitLinks("Line 1\nLine 2")).toEqual([{ text: "Line 1\nLine 2" }]);
  });
});
