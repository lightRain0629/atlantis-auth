import { useMemo } from "react";
import { useAppSelector } from "@/hooks";
import {
  formatAxisAmount,
  formatMoney,
  formatMoneyCompact,
} from "./finance-utils";

/**
 * The money formatters, bound to the global "hide amounts" toggle. Components
 * that display amounts take their formatters from here rather than importing
 * them from finance-utils, so they re-render — and mask — when it flips.
 * Form inputs keep their raw values: only read-only display goes through this.
 */
export function useMoneyFormatter() {
  const hidden = useAppSelector((s) => s.privacy.amountsHidden);

  return useMemo(
    () => ({
      hidden,
      formatMoney: (amount: string, currency: string) =>
        formatMoney(amount, currency, { hidden }),
      formatMoneyCompact: (amount: string, currency: string) =>
        formatMoneyCompact(amount, currency, { hidden }),
      formatAxisAmount: (value: number) => formatAxisAmount(value, { hidden }),
    }),
    [hidden],
  );
}
