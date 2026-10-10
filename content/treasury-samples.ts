import type { ApiSample } from "@/content/projects";

const BASE = "https://treasury-bills.onrender.com/api";

/** Real responses captured on 9 Oct 2026, trimmed where noted. */
export const treasurySamples: ApiSample[] = [
  {
    label: "T-bills",
    path: "/get-tbill?days=91",
    href: `${BASE}/get-tbill?days=91`,
    note: "91-day rates from bog.gov.gh, newest auction first. Trimmed to 2 of 4 auctions.",
    response: {
      success: true,
      data: [
        {
          _id: "6ac8df09e6aa897ea1161f77",
          days: "05 Oct 2026",
          securityType: "91 DAY BILL",
          discountRate: "4.5881",
          interestRate: "4.6413",
          createdAt: "2026-10-09T12:33:13.778Z",
          __v: 0,
          updatedAt: "2026-10-10T15:05:39.823Z",
        },
        {
          _id: "6ac8df09e6aa897ea1161f7a",
          days: "28 Sep 2026",
          securityType: "91 DAY BILL",
          discountRate: "4.6244",
          interestRate: "4.6785",
          createdAt: "2026-10-09T12:33:13.779Z",
          __v: 0,
          updatedAt: "2026-10-10T15:05:39.823Z",
        },
      ],
    },
  },
  {
    label: "Stock",
    path: "/gse/stocks/MTNGH",
    href: `${BASE}/gse/stocks/MTNGH`,
    note: "One listed company with its latest quote and how much history is stored.",
    response: {
      success: true,
      data: {
        symbol: "MTNGH",
        name: "MTN Ghana",
        board: "Main",
        listedDate: "2018-09-05",
        quote: {
          date: "2026-10-09",
          open: 6.45,
          close: 6.45,
          last: 6.45,
          previousClose: 6.45,
          change: 0,
          changePercent: 0,
          bid: 6.7,
          ask: 6.75,
          volume: 4434885,
          value: 28623394.45,
          yearHigh: 7.15,
          yearLow: 4.2,
        },
        history: { firstDate: "2018-09-05", lastDate: "2026-10-09", tradingDays: 1986 },
      },
      meta: { currency: "GHS" },
    },
  },
  {
    label: "History",
    path: "/gse/stocks/MTNGH/history?limit=3",
    href: `${BASE}/gse/stocks/MTNGH/history?limit=3`,
    note: "Daily prices, oldest first, with the change over the range in meta. Trimmed to 2 of 3 days and 6 of 13 fields per day.",
    response: {
      success: true,
      data: [
        {
          date: "2026-10-08",
          open: 6.3,
          close: 6.45,
          change: 0.15,
          changePercent: 2.38,
          volume: 515091,
        },
        {
          date: "2026-10-09",
          open: 6.45,
          close: 6.45,
          change: 0,
          changePercent: 0,
          volume: 4434885,
        },
      ],
      meta: {
        symbol: "MTNGH",
        period: "1y",
        from: "2026-10-07",
        to: "2026-10-09",
        count: 3,
        change: { from: 6.56, to: 6.45, changePercent: -1.68 },
        currency: "GHS",
      },
    },
  },
  {
    label: "Market",
    path: "/gse/market",
    href: `${BASE}/gse/market`,
    note: "The day's market summary, with each figure explained in meta.",
    response: {
      success: true,
      data: {
        date: "2026-10-09",
        previousDate: "2026-10-08",
        gseCI: { value: 14053.48, change: 29.3, changePercent: 0.21 },
        gseFSI: { value: 7416.25, change: -2.04, changePercent: -0.03 },
        marketCapMillion: { value: 266496.93, change: 244.24, changePercent: 0.09 },
        volume: { value: 5380378, change: 3742160, changePercent: 228.43 },
      },
      meta: {
        gseCI: "GSE Composite Index: all listed stocks",
        gseFSI: "GSE Financial Stock Index: banks and other financial stocks",
        marketCapMillion: "Total value of listed companies, in millions of GH¢",
        volume: "Shares traded that day",
      },
    },
  },
  {
    label: "Insights",
    path: "/gse/insights",
    href: `${BASE}/gse/insights`,
    note: "Plain-English takeaways for a period, plus the numbers behind them. Trimmed: 4 of 11 summary lines, the top gainer and loser, and the T-bill comparison.",
    response: {
      success: true,
      data: {
        period: "1m",
        from: "2026-09-09",
        to: "2026-10-09",
        summary: [
          "The market (GSE Composite Index) fell 4.74% over the past month, to 14,053.48.",
          "9 stocks rose, 16 fell and 15 were unchanged.",
          "Best performer: DIGICUT (+86.67%).",
          "For comparison, the 364 day T-bill pays 9.8018% a year, about 0.81% over the same 30 days, versus -4.74% for the market.",
        ],
        breadth: { up: 9, down: 16, unchanged: 15 },
        topGainers: [
          {
            symbol: "DIGICUT",
            name: "Digicut Advertising and Production Limited",
            from: 0.3,
            to: 0.56,
            changePercent: 86.67,
          },
        ],
        topLosers: [
          {
            symbol: "ACCESS",
            name: "Access Bank Ghana Plc",
            from: 26.56,
            to: 20.67,
            changePercent: -22.18,
          },
        ],
        tBills: [{ tenor: "364 day", interestRate: 9.8018, equivalentForPeriod: 0.81 }],
      },
    },
  },
];
