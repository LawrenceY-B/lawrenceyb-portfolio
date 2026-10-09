import { describe, expect, it } from "vitest";

import { niceDay, num, parseDay } from "@/features/market/format";

describe("parseDay", () => {
  it("parses ISO dates", () => {
    expect(parseDay("2026-10-08")).toBe(Date.UTC(2026, 9, 8));
  });
  it("parses '05 Oct 2026' and long month names", () => {
    expect(parseDay("05 Oct 2026")).toBe(Date.UTC(2026, 9, 5));
    expect(parseDay("5 September 2026")).toBe(Date.UTC(2026, 8, 5));
  });
  it("returns 0 for empty or unknown input", () => {
    expect(parseDay("")).toBe(0);
    expect(parseDay(undefined)).toBe(0);
    expect(parseDay("soon")).toBe(0);
  });
});

describe("formatting", () => {
  it("formats numbers with fixed decimals", () => {
    expect(num(6123.456)).toBe("6,123.46");
    expect(num(3, 0)).toBe("3");
  });
  it("formats days in UTC", () => {
    expect(niceDay(Date.UTC(2026, 9, 8))).toBe("8 Oct 2026");
    expect(niceDay(0)).toBe("");
  });
});
