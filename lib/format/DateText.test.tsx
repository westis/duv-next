import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DateText } from "./DateText";

describe("DateText", () => {
  it("renders a time element with the ISO value", () => {
    expect(renderToStaticMarkup(<DateText value="30.09.1981" locale="en" />)).toBe(
      '<time dateTime="1981-09-30" class="tabular-nums">30 SEP 1981</time>'
    );
  });

  it("uses the start date for a range", () => {
    expect(renderToStaticMarkup(<DateText value="2024-04-06" end="2024-04-07" locale="ja" variant="range" />)).toBe(
      '<time dateTime="2024-04-06" class="tabular-nums">2024年4月6–7日</time>'
    );
  });

  it("supports the other variants and a class", () => {
    expect(renderToStaticMarkup(<DateText value="2026-10" locale="en" variant="month" className="font-bold" />)).toBe(
      '<time dateTime="2026-10" class="tabular-nums font-bold">OCTOBER 2026</time>'
    );
    expect(renderToStaticMarkup(<DateText value="15.06.2024" locale="en" variant="dayMonth" />)).toContain(">15 JUN<");
    expect(renderToStaticMarkup(<DateText value="15.06.2024" locale="en" variant="year" />)).toContain(">2024<");
  });

  it("shows unreadable input as text", () => {
    expect(renderToStaticMarkup(<DateText value="spring 2024" locale="en" />)).toBe(
      '<span class="tabular-nums">spring 2024</span>'
    );
    expect(renderToStaticMarkup(<DateText value="&nbsp;" locale="en" />)).toBe("");
  });

  it("renders nothing for an unknown birth date and the year for a partial one", () => {
    expect(renderToStaticMarkup(<DateText value="00.00.0000" locale="en" variant="birth" />)).toBe("");
    expect(renderToStaticMarkup(<DateText value="00.00.1981" locale="en" variant="birth" />)).toBe(
      '<time dateTime="1981" class="tabular-nums">1981</time>'
    );
  });
});
