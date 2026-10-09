import type { z } from "zod";

import { env } from "@/lib/env";

import { parseDay } from "./format";
import {
  type Bill,
  type MarketData,
  billsResponse,
  marketResponse,
  stocksResponse,
} from "./schema";

export async function getJSON<S extends z.ZodType>(
  path: string,
  schema: S,
  timeoutMs: number,
  fetchImpl: typeof fetch = fetch,
): Promise<z.infer<S>> {
  const res = await fetchImpl(env.NEXT_PUBLIC_API_URL + path, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  const parsed = schema.parse(json) as z.infer<S> & { success?: boolean; message?: string };
  if (parsed.success === false) throw new Error(parsed.message ?? "Bad response");
  return parsed;
}

/** Latest rate per tenor (91/182/364-day), in tenor order. */
export function parseBills(rows: z.infer<typeof billsResponse>["data"]): Bill[] {
  const by: Record<string, { t: number; rate: number }> = {};
  for (const r of rows) {
    const m = /(\d+)/.exec(r.securityType ?? "");
    const rate = parseFloat(String(r.interestRate));
    const t = parseDay(r.days);
    const key = m?.[1];
    if (key && Number.isFinite(rate) && (!by[key] || t > by[key].t)) by[key] = { t, rate };
  }
  return ["91", "182", "364"].flatMap((k) => {
    const b = by[k];
    return b ? [{ tenor: k, rate: b.rate, t: b.t }] : [];
  });
}

export type MarketResult = {
  ok: { bills: boolean; market: boolean; stocks: boolean };
  any: boolean;
  data: MarketData;
};

/** Fetches the three endpoints in parallel; each one may fail on its own. */
export async function loadMarket(
  timeoutMs: number,
  fetchImpl: typeof fetch = fetch,
): Promise<MarketResult> {
  const data: MarketData = {};
  const settle = (p: Promise<unknown>) =>
    p.then(
      () => true,
      () => false,
    );
  const [bills, market, stocks] = await Promise.all([
    settle(
      getJSON("/get-all-tbill", billsResponse, timeoutMs, fetchImpl).then(
        (j) => (data.bills = parseBills(j.data)),
      ),
    ),
    settle(
      getJSON("/gse/market", marketResponse, timeoutMs, fetchImpl).then(
        (j) => (data.market = j.data),
      ),
    ),
    settle(
      getJSON("/gse/stocks", stocksResponse, timeoutMs, fetchImpl).then((j) => {
        data.stocks = j.data;
        data.stocksDate = j.meta?.date;
      }),
    ),
  ]);
  return { ok: { bills, market, stocks }, any: bills || market || stocks, data };
}
