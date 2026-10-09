"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";

import { niceDay, num, parseDay } from "./format";
import type { MarketData } from "./schema";
import {
  type MarketSnapshot,
  type TickerState,
  getSnapshot,
  marketReady,
  subscribe,
} from "./store";

const TAG: Record<TickerState, string> = {
  live: "● Live",
  cached: "● Cached",
  offline: "● Offline",
};

function Pct({ value }: { value: number | undefined }) {
  if (value === undefined || !Number.isFinite(value)) return null;
  if (value > 0) return <b className="up">▲ {num(value)}%</b>;
  if (value < 0) return <b className="down">▼ {num(Math.abs(value))}%</b>;
  return <b>0.00%</b>;
}

export function tickerItems(state: TickerState, d: MarketData | null): ReactNode[] {
  const it: ReactNode[] = [
    <span key="tag" className="tag">
      {TAG[state]}
    </span>,
  ];
  const mk = d?.market;
  for (const [key, label] of [
    ["gseCI", "GSE-CI"],
    ["gseFSI", "GSE-FSI"],
  ] as const) {
    const idx = mk?.[key];
    if (idx)
      it.push(
        <span key={key}>
          {label} <b>{num(idx.value)}</b> <Pct value={idx.changePercent} />
        </span>,
      );
  }
  for (const b of d?.bills ?? [])
    it.push(
      <span key={`bill-${b.tenor}`}>
        T-Bill {b.tenor}D <b>{num(b.rate)}%</b>
      </span>,
    );
  const movers = (d?.stocks ?? [])
    .filter((s) => Number.isFinite(s.price) && (s.volume ?? 0) > 0)
    .sort(
      (a, b) =>
        Math.abs(b.changePercent ?? 0) - Math.abs(a.changePercent ?? 0) ||
        (b.volume ?? 0) - (a.volume ?? 0),
    )
    .slice(0, 8);
  for (const s of movers)
    it.push(
      <span key={`stock-${s.symbol}`}>
        {s.symbol} <b>{num(s.price)}</b> <Pct value={s.changePercent} />
      </span>,
    );
  if (it.length === 1) it.push(<span key="none">Market data is unavailable right now</span>);
  const asOf = mk?.date ?? d?.stocksDate;
  if (asOf)
    it.push(
      <span key="asof">
        As of <b>{niceDay(parseDay(asOf))}</b>
      </span>,
    );
  it.push(
    <span key="src">
      Source <b>GSE · Bank of Ghana via my API</b>
    </span>,
  );
  return it;
}

const getServerSnapshot = (): MarketSnapshot | null => null;

export function Ticker() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void marketReady();
  }, []);

  const items = snap ? tickerItems(snap.state, snap.data) : [];
  return (
    <div
      className="ticker mono muted"
      data-inspect="MarketTicker"
      role="region"
      aria-label="Ghana market data: GSE indices, T-bill rates and top movers"
    >
      <div
        className="ticker-track"
        style={{ animationDuration: `${Math.max(30, items.length * 4.5)}s` }}
      >
        {items}
        {/* Second copy makes the marquee loop seamlessly; hidden from assistive tech. */}
        <span className="ticker-dup" aria-hidden="true">
          {items}
        </span>
      </div>
    </div>
  );
}
