import { type Page, test as base, expect } from "@playwright/test";

export const API = "https://treasury-bills.onrender.com/api";

export const market = {
  bills: {
    success: true,
    data: [
      { securityType: "91 DAY BILL", interestRate: "15.12", days: "06 Oct 2026" },
      { securityType: "182 DAY BILL", interestRate: "16.40", days: "06 Oct 2026" },
      { securityType: "364 DAY BILL", interestRate: "17.05", days: "06 Oct 2026" },
    ],
  },
  market: {
    success: true,
    data: {
      gseCI: { value: 6123.45, changePercent: 0.42 },
      gseFSI: { value: 3010.1, changePercent: -0.1 },
      date: "2026-10-08",
    },
  },
  stocks: {
    success: true,
    meta: { date: "2026-10-08" },
    data: [
      { symbol: "MTNGH", price: 3.1, volume: 120000, changePercent: 1.2 },
      { symbol: "GCB", price: 6.5, volume: 8000, changePercent: -2.5 },
    ],
  },
};

/** Serves the market API from fixtures (or fails it) so tests never depend on the live service. */
export async function mockMarket(page: Page, mode: "ok" | "down" = "ok") {
  await page.route(`${API}/**`, (route) => {
    if (mode === "down") return route.abort("failed");
    const url = route.request().url();
    const body = url.endsWith("/get-all-tbill")
      ? market.bills
      : url.endsWith("/gse/market")
        ? market.market
        : market.stocks;
    return route.fulfill({ json: body });
  });
}

/** Collects uncaught page errors and console errors for the test to assert on. */
export const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await provide(errors);
  },
});

export { expect };
