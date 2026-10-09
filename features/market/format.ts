const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/** Parses "05 Oct 2026" or "2026-10-08" to a UTC timestamp; 0 when unknown. */
export function parseDay(s: string | null | undefined): number {
  if (!s) return 0;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const iso = Date.parse(s);
    if (Number.isFinite(iso)) return iso;
  }
  const m = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(s);
  if (!m) return 0;
  const [, d, mon, y] = m;
  return Date.UTC(Number(y), MONTHS[mon!.toLowerCase()] ?? 0, Number(d));
}

export const niceDay = (t: number) =>
  t
    ? new Date(t).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";

export const num = (n: number, digits = 2) =>
  Number(n).toLocaleString("en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
