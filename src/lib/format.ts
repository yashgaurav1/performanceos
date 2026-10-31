/** Display formatting. All numbers rendered through these should sit in a `.num` element. */

export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-IN");
export const fmt1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
export const fmtKg = (n: number) => `${Number(n.toFixed(2))}`;
export const fmtSigned = (n: number, dp = 1) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(n).toFixed(dp)}`;

export function fmtMoney(minor: number, currency = "INR", opts: { compact?: boolean; decimals?: boolean } = {}) {
  const major = minor / 100;
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: opts.decimals ? 2 : opts.compact ? 1 : 0,
    minimumFractionDigits: opts.decimals ? 2 : 0,
  }).format(major);
}

export function currencySymbol(currency = "INR") {
  return (0).toLocaleString(currency === "INR" ? "en-IN" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).replace(/\d/g, "").trim();
}

export function fmtMins(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export function fmtDateLong(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

export function fmtDateShort(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function weekdayLetter(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-GB", { weekday: "narrow" });
}

export const titleCase = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
