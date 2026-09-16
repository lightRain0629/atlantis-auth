import { useTranslation } from "react-i18next";
import {
  Archive,
  ChevronRight,
  CalendarClock,
  Pencil,
  Scale,
  TrendingUp,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  AccountBalance,
  BalancesResponse,
  DebtsResponse,
  FinanceAccount,
} from "@/services/types";
import {
  MAX_CHART_SLICES,
  accountColor,
  accountKindMeta,
  formatMoney,
} from "@/lib/finance-utils";
import { Meter, ShareBreakdown } from "./chart-parts";
import type { ShareRow } from "./chart-parts";

export function AccountGroupCard({
  group,
  entries,
  baseCurrency,
  onEdit,
  onValue,
  onDrillDown,
}: {
  group: string;
  entries: AccountBalance[];
  baseCurrency: string;
  onEdit: (account: FinanceAccount) => void;
  onValue: (account: FinanceAccount) => void;
  onDrillDown: (account: FinanceAccount) => void;
}) {
  const { t } = useTranslation();

  const groupTotal = entries.reduce(
    (sum, entry) => sum + parseFloat(entry.balanceInBase ?? "0"),
    0,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium">
            {t(`finance.accounts.group.${group}`)}
          </CardTitle>
          {baseCurrency && (
            <span className="text-sm font-semibold tabular-nums">
              {formatMoney(String(groupTotal), baseCurrency)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-border/60 p-0">
        {entries.map((entry) => {
          const { account } = entry;
          const color = accountColor(account.color, account.kind);
          const negative = parseFloat(entry.balance) < 0;

          return (
            <div
              key={account.id}
              className="flex min-w-0 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <button
                type="button"
                onClick={() => onDrillDown(account)}
                title={t("finance.flow.drillDown")}
                className="flex min-h-[44px] min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className="h-9 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium">{account.name}</span>
                    {account.isArchived && (
                      <Archive
                        className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground"
                        aria-label={t("finance.accounts.archived")}
                      />
                    )}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span>{t(`finance.accounts.kind.${account.kind}`)}</span>
                    {account.institution && <span>· {account.institution}</span>}
                    {/* A bank loan often names the same party twice; show it once. */}
                    {account.counterparty &&
                      account.counterparty !== account.institution && (
                        <span>· {account.counterparty}</span>
                      )}
                    {account.valuationMode === "VALUED" && (
                      <span>· {t("finance.accounts.valued")}</span>
                    )}
                  </span>
                </span>
                <ChevronRight
                  className="ml-auto h-4 w-4 flex-shrink-0 text-muted-foreground sm:hidden"
                  aria-hidden
                />
              </button>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="text-right">
                  <p
                    className={`font-semibold tabular-nums ${
                      negative ? "text-[#d03b3b]" : ""
                    }`}
                  >
                    {formatMoney(entry.balance, account.currency)}
                  </p>
                  {entry.balanceInBase &&
                    account.currency !== baseCurrency && (
                      <p className="text-xs tabular-nums text-muted-foreground">
                        ≈ {formatMoney(entry.balanceInBase, baseCurrency)}
                      </p>
                    )}
                  {entry.rateMissing && (
                    <p className="text-xs text-amber-700">
                      {t("finance.accounts.noRate", {
                        from: account.currency,
                        to: baseCurrency,
                      })}
                    </p>
                  )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-1">
                  {account.valuationMode === "VALUED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[40px] min-w-[40px] px-2"
                      onClick={() => onValue(account)}
                      title={t("finance.accounts.updateValue")}
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span className="sr-only">
                        {t("finance.accounts.updateValue")}
                      </span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[40px] min-w-[40px] px-2"
                    onClick={() => onEdit(account)}
                    title={t("common.edit")}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">{t("common.edit")}</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/**
 * Asset allocation. Liabilities are deliberately absent: this answers "where is
 * my money", and a debt is not somewhere money sits.
 */
export function AllocationCard({
  balances,
  baseCurrency,
}: {
  balances: BalancesResponse;
  baseCurrency: string;
}) {
  const { t } = useTranslation();

  const rows: ShareRow[] = balances.byKind
    .filter((entry) => !accountKindMeta(entry.kind).liability)
    .filter((entry) => parseFloat(entry.total) > 0)
    .map((entry) => ({
      id: entry.kind,
      filterId: null,
      name: t(`finance.accounts.kind.${entry.kind}`),
      color: accountKindMeta(entry.kind).color,
      total: entry.total,
      percentage: entry.percentage,
      currency: baseCurrency,
    }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          {t("finance.accounts.allocation")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!baseCurrency ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("finance.accounts.pickBaseHint")}
          </p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("finance.noData")}
          </p>
        ) : (
          <ShareBreakdown
            rows={rows}
            maxSlices={MAX_CHART_SLICES}
            totalLabel={t("finance.accounts.assets")}
            total={balances.totalAssets}
            currency={baseCurrency}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function DebtsCard({
  debts,
  onDrillDown,
}: {
  debts: DebtsResponse;
  onDrillDown: (account: FinanceAccount) => void;
}) {
  const { t } = useTranslation();
  const currency = debts.baseCurrency ?? "";

  const section = (
    items: DebtsResponse["owed"],
    title: string,
    total: string,
    danger: boolean,
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </h4>
          {currency && (
            <span
              className={`text-sm font-semibold tabular-nums ${
                danger ? "text-[#d03b3b]" : ""
              }`}
            >
              {formatMoney(total, currency)}
            </span>
          )}
        </div>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.account.id}>
              <button
                type="button"
                onClick={() => onDrillDown(item.account)}
                className="w-full space-y-1.5 rounded-md py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium">
                    {item.account.name}
                  </span>
                  <span className="flex-shrink-0 text-sm tabular-nums">
                    {formatMoney(item.outstanding, item.account.currency)}
                  </span>
                </div>
                <Meter
                  value={item.progress}
                  tone={danger ? "danger" : "default"}
                  label={t("finance.accounts.repaidProgress")}
                />
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">
                    {item.account.counterparty ??
                      t(`finance.accounts.kind.${item.account.kind}`)}
                  </span>
                  {item.account.dueDate && (
                    <span
                      className={`flex flex-shrink-0 items-center gap-1 ${
                        item.isOverdue ? "font-medium text-[#d03b3b]" : ""
                      }`}
                    >
                      <CalendarClock className="h-3 w-3" aria-hidden />
                      {item.isOverdue
                        ? t("finance.accounts.overdue")
                        : t("finance.accounts.dueIn", {
                            days: item.daysUntilDue,
                          })}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Scale className="h-4 w-4" aria-hidden />
          {t("finance.accounts.debts")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {section(
          debts.owed,
          t("finance.accounts.youOwe"),
          debts.totalOwed,
          true,
        )}
        {section(
          debts.lent,
          t("finance.accounts.owedToYou"),
          debts.totalLent,
          false,
        )}
      </CardContent>
    </Card>
  );
}
