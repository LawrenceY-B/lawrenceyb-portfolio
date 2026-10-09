import { type MarketResult, loadMarket } from "./api";
import { readCache, writeCache } from "./cache";
import type { MarketData } from "./schema";

export type TickerState = "live" | "cached" | "offline";
export type MarketSnapshot = { state: TickerState; data: MarketData | null };

type Listener = (s: MarketSnapshot) => void;
const listeners = new Set<Listener>();
let snapshot: MarketSnapshot | null = null;
let ready: Promise<MarketResult> | null = null;

function publish(s: MarketSnapshot) {
  snapshot = s;
  listeners.forEach((fn) => fn(s));
}

function apply(res: MarketResult): MarketResult {
  if (res.any) {
    const merged = { ...snapshot?.data, ...res.data };
    writeCache(merged);
    publish({ state: "live", data: merged });
  }
  return res;
}

/**
 * Starts loading market data once per page. The first attempt is short so the preloader never
 * hangs; a free-tier host can take ~30s to wake, so one longer retry runs in the background.
 */
export function marketReady(): Promise<MarketResult> {
  if (ready) return ready;
  const cached = readCache();
  publish({ state: cached ? "cached" : "offline", data: cached });
  ready = loadMarket(7000)
    .then(apply)
    .then((res) => {
      if (!res.any) setTimeout(() => void loadMarket(40000).then(apply), 1500);
      return res;
    });
  return ready;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const getSnapshot = () => snapshot;
