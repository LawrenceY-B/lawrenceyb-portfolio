import { z } from "zod";

const numeric = z.union([z.number(), z.string()]).transform(Number).pipe(z.number());

/** Every response is wrapped as { success, data, meta? }. */
const envelope = <T extends z.ZodType>(data: T) =>
  z.object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    data,
    meta: z.object({ date: z.string().optional() }).partial().optional(),
  });

export const billRow = z.object({
  securityType: z.string().optional(),
  interestRate: z.union([z.string(), z.number()]).optional(),
  days: z.string().optional(),
});
export const billsResponse = envelope(z.array(billRow));

const index = z.object({ value: numeric, changePercent: numeric.optional() });
export const marketSummary = z.object({
  gseCI: index.optional(),
  gseFSI: index.optional(),
  date: z.string().optional(),
});
export const marketResponse = envelope(marketSummary);

export const stock = z.object({
  symbol: z.string(),
  price: numeric,
  volume: numeric.optional(),
  changePercent: numeric.optional(),
});
// Skip individual malformed rows instead of failing the whole list.
export const stocksResponse = envelope(
  z.array(z.unknown()).transform((rows) =>
    rows.flatMap((r) => {
      const p = stock.safeParse(r);
      return p.success ? [p.data] : [];
    }),
  ),
);

export type MarketSummary = z.infer<typeof marketSummary>;
export type Stock = z.infer<typeof stock>;
export type Bill = { tenor: string; rate: number; t: number };

export type MarketData = {
  bills?: Bill[];
  market?: MarketSummary;
  stocks?: Stock[];
  stocksDate?: string;
};
