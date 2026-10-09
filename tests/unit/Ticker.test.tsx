import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { tickerItems } from "@/features/market/Ticker";

const renderItems = (...args: Parameters<typeof tickerItems>) =>
  render(<div>{tickerItems(...args)}</div>);

describe("tickerItems", () => {
  it("shows an unavailable message when offline with no data", () => {
    renderItems("offline", null);
    expect(screen.getByText("● Offline")).toBeInTheDocument();
    expect(screen.getByText("Market data is unavailable right now")).toBeInTheDocument();
  });

  it("renders indices, bills and the top movers by absolute change", () => {
    renderItems("live", {
      market: { gseCI: { value: 6000, changePercent: 1 }, date: "2026-10-08" },
      bills: [{ tenor: "91", rate: 15.5, t: 0 }],
      stocks: [
        { symbol: "AAA", price: 1, volume: 5, changePercent: 0.5 },
        { symbol: "BBB", price: 2, volume: 5, changePercent: -3 },
        { symbol: "ZERO", price: 2, volume: 0, changePercent: 9 },
      ],
    });
    const text = document.body.textContent ?? "";
    expect(text).toContain("● Live");
    expect(text).toContain("GSE-CI 6,000.00 ▲ 1.00%");
    expect(text).toContain("T-Bill 91D 15.50%");
    expect(text.indexOf("BBB")).toBeLessThan(text.indexOf("AAA"));
    expect(text).not.toContain("ZERO");
    expect(text).toContain("As of 8 Oct 2026");
  });
});
