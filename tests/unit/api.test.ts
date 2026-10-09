import { describe, expect, it, vi } from "vitest";

import { loadMarket, parseBills } from "@/features/market/api";

const json = (body: unknown, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );

describe("parseBills", () => {
  it("keeps the latest rate per tenor, in tenor order", () => {
    const bills = parseBills([
      { securityType: "364 DAY BILL", interestRate: "17.0", days: "01 Oct 2026" },
      { securityType: "91 DAY BILL", interestRate: "15.0", days: "01 Oct 2026" },
      { securityType: "91 DAY BILL", interestRate: "15.5", days: "08 Oct 2026" },
      { securityType: "NOTE", interestRate: "x" },
    ]);
    expect(bills.map((b) => [b.tenor, b.rate])).toEqual([
      ["91", 15.5],
      ["364", 17],
    ]);
  });
});

describe("loadMarket", () => {
  it("reports each endpoint separately and drops malformed stock rows", async () => {
    const fetchImpl = vi.fn((input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/get-all-tbill"))
        return json({
          success: true,
          data: [{ securityType: "91 DAY", interestRate: 15, days: "2026-10-08" }],
        });
      if (url.endsWith("/gse/market")) return json({ message: "down" }, 503);
      return json({
        success: true,
        data: [{ symbol: "MTNGH", price: "3.10", volume: 10 }, { price: 1 }],
      });
    }) as unknown as typeof fetch;

    const res = await loadMarket(1000, fetchImpl);

    expect(res.ok).toEqual({ bills: true, market: false, stocks: true });
    expect(res.any).toBe(true);
    expect(res.data.stocks).toEqual([{ symbol: "MTNGH", price: 3.1, volume: 10 }]);
  });

  it("treats success: false as a failure", async () => {
    const fetchImpl = vi.fn(() =>
      json({ success: false, message: "nope", data: [] }),
    ) as unknown as typeof fetch;
    const res = await loadMarket(1000, fetchImpl);
    expect(res.any).toBe(false);
  });
});
