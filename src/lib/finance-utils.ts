export function formatMoney(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return `${amount} ${currency}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function toAmountString(value: number): string {
  return value.toFixed(4).replace(/\.?0+$/, "") || "0";
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
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
}

export function getToday(): string {
  return new Date().toISOString();
}

export const COMMON_CURRENCIES = ["USD", "EUR", "TMT", "RUB", "TRY", "CNY", "GBP"];
