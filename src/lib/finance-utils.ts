/**
 * Intl only throws on codes that are the wrong *shape*, so a well-formed
 * three-letter ticker like BTC sails through and gets rounded to 2 decimals.
 * supportedValuesOf is the real ISO-4217 list, which BTC is not on.
 */
const isoCurrencyCache = new Map<string, boolean>();

const ISO_CURRENCIES: Set<string> | null = (() => {
  try {
    return new Set(Intl.supportedValuesOf("currency"));
  } catch {
    return null;
  }
})();

function isIsoCurrency(currency: string): boolean {
  const cached = isoCurrencyCache.get(currency);
  if (cached !== undefined) return cached;

  let supported: boolean;
  if (ISO_CURRENCIES) {
    supported = ISO_CURRENCIES.has(currency);
  } else {
    try {
      new Intl.NumberFormat("en-US", { style: "currency", currency });
      supported = true;
    } catch {
      supported = false;
    }
  }

  isoCurrencyCache.set(currency, supported);
  return supported;
}

export function formatMoney(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return `${amount} ${currency}`;

  // Crypto tickers get a plain number plus a suffix, and more decimals so a
  // fraction of a coin does not round away to zero.
  if (!isIsoCurrency(currency)) {
    const magnitude = Math.abs(num);
    const decimals = magnitude > 0 && magnitude < 1000 ? 8 : 2;
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    }).format(num);
    return `${formatted} ${currency}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Compact form for hero figures: 1.2M instead of 1,234,567.00 */
export function formatMoneyCompact(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return `${amount} ${currency}`;
  if (Math.abs(num) < 100000) return formatMoney(amount, currency);

  const compact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);

  if (!isIsoCurrency(currency)) return `${compact} ${currency}`;
  const symbol =
    new Intl.NumberFormat("en-US", { style: "currency", currency })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency;
  return `${num < 0 ? "-" : ""}${symbol}${compact.replace("-", "")}`;
}

export function toAmountString(value: number): string {
  return value.toFixed(8).replace(/\.?0+$/, "") || "0";
}

export function parseAmount(value: string): number {
  return parseFloat(value) || 0;
}

export function toDateInputValue(isoString: string): string {
  return isoString.split("T")[0];
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function toISODateString(date: Date): string {
  return date.toISOString();
}

export function getStartOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function getEndOfMonth(): string {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  ).toISOString();
}

export function getToday(): string {
  return new Date().toISOString();
}

export const COMMON_CURRENCIES = [
  "TMT",
  "USD",
  "EUR",
  "RUB",
  "TRY",
  "CNY",
  "GBP",
  "KZT",
];

export function getStartOfYear(): string {
  return new Date(new Date().getFullYear(), 0, 1).toISOString();
}

/** Months back from today, used for the net worth window. */
export function monthsAgo(count: number): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - count, 1).toISOString();
}

export function formatMonth(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

// ============ Account presentation ============

export type AccountGroup = "liquid" | "savings" | "assets" | "debts";

/**
 * Chart colors come from a validated categorical palette; each kind keeps a
 * fixed slot so a filter that drops a kind never repaints the survivors.
 * Kinds past the palette (and every liability) render in the de-emphasis gray,
 * since the allocation chart only ever plots assets.
 */
const PALETTE = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  magenta: "#e87ba4",
  green: "#008300",
  violet: "#4a3aa7",
  red: "#e34948",
  gray: "#64748b",
} as const;

/** Chart chrome, matched to the app light surface. */
export const CHART_INK = {
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  muted: "#898781",
  netWorth: PALETTE.blue,
  liability: "#d03b3b",
  positive: "#006300",
  negative: "#d03b3b",
} as const;

export const ACCOUNT_KINDS = [
  { kind: "CASH", group: "liquid", liability: false, color: PALETTE.blue },
  { kind: "BANK", group: "liquid", liability: false, color: PALETTE.orange },
  { kind: "CARD", group: "liquid", liability: false, color: PALETTE.aqua },
  { kind: "CRYPTO", group: "savings", liability: false, color: PALETTE.yellow },
  { kind: "SAVINGS", group: "savings", liability: false, color: PALETTE.magenta },
  { kind: "PROPERTY", group: "assets", liability: false, color: PALETTE.green },
  { kind: "EWALLET", group: "liquid", liability: false, color: PALETTE.violet },
  { kind: "INVESTMENT", group: "savings", liability: false, color: PALETTE.red },
  { kind: "RECEIVABLE", group: "debts", liability: false, color: PALETTE.gray },
  { kind: "LOAN", group: "debts", liability: true, color: PALETTE.gray },
  { kind: "CREDIT_CARD", group: "debts", liability: true, color: PALETTE.gray },
  { kind: "OTHER", group: "assets", liability: false, color: PALETTE.gray },
] as const;

export type AccountKindMeta = (typeof ACCOUNT_KINDS)[number];

const KIND_META = new Map<string, AccountKindMeta>(
  ACCOUNT_KINDS.map((k) => [k.kind, k]),
);

export function accountKindMeta(kind: string): AccountKindMeta {
  return KIND_META.get(kind) ?? ACCOUNT_KINDS[ACCOUNT_KINDS.length - 1];
}

export function accountColor(
  color: string | null | undefined,
  kind: string,
): string {
  return color || accountKindMeta(kind).color;
}

export const OTHER_SLICE_COLOR = PALETTE.gray;

/**
 * The palette validates four adjacent series at once, so the allocation chart
 * plots the four largest kinds and folds the tail into one gray "Other" slice.
 */
export const MAX_CHART_SLICES = 4;

/** Kinds that hold a manually set value rather than a transaction history. */
export const VALUED_BY_DEFAULT_KINDS = ["PROPERTY", "INVESTMENT"];

export const ACCOUNT_KIND_LIST = ACCOUNT_KINDS.map((k) => k.kind);
