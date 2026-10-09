import type { MarketData } from "./schema";

const KEY = "lyb-market-v1";

export function readCache(): MarketData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { data?: MarketData } | null;
    return v?.data ?? null;
  } catch {
    return null;
  }
}

export function writeCache(data: MarketData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), data }));
  } catch {
    // Storage full or blocked: the ticker still works, just without a warm start.
  }
}
