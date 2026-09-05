// Single source of truth for money display across the whole app — every screen showing
// an amount should import formatCurrency from here rather than calling toLocaleString
// inline. Two problems this specifically works around:
//
// 1. The backend serializes Prisma Decimal fields (net, gross, wage, etc.) as STRINGS in
//    JSON (e.g. "64800", not 64800) — this is correct on the backend's side, since it
//    avoids floating-point precision loss for money in transit. But calling
//    "64800".toLocaleString('en-IN', {style:'currency', currency:'INR'}) on a string
//    silently returns "64800" unchanged — no error, no ₹ symbol, no formatting at all.
//    Every amount coming from the API MUST be coerced with Number(...) before formatting.
// 2. Industry standard for money display is Intl.NumberFormat with an explicit ISO 4217
//    currency code (INR) rather than string-concatenating a "₹" symbol — the Intl API
//    handles locale-correct symbol placement, decimal rules, and digit grouping (en-IN's
//    lakh/crore grouping: ₹1,23,456 not ₹123,456) automatically and consistently.
const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return "—";
  return inrFormatter.format(value);
}

// For inline editing / form inputs where you want the raw number, not a formatted string.
export function toAmountNumber(amount: number | string | null | undefined): number {
  if (amount === null || amount === undefined || amount === "") return 0;
  const value = typeof amount === "string" ? Number(amount) : amount;
  return Number.isNaN(value) ? 0 : value;
}
