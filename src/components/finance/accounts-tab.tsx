import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Loader2, Plus, RefreshCw, Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useGetBalancesQuery,
  useGetNetWorthHistoryQuery,
  useGetDebtsQuery,
} from "@/services/api";
import type { AccountBalance, FinanceAccount } from "@/services/types";
import {
  COMMON_CURRENCIES,
  accountKindMeta,
  monthsAgo,
} from "@/lib/finance-utils";
import NetWorthHero from "./net-worth-hero";
import {
  AccountGroupCard,
  AllocationCard,
  DebtsCard,
} from "./account-cards";
import { AccountFormModal, ValuationModal } from "./account-form-modal";

const GROUP_ORDER = ["liquid", "savings", "assets", "debts"] as const;

export default function AccountsTab({
  baseCurrency,
  onBaseCurrencyChange,
  onDrillDown,
}: {
  baseCurrency: string;
  onBaseCurrencyChange: (currency: string) => void;
  onDrillDown: (account: FinanceAccount) => void;
}) {
  const { t } = useTranslation();
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<FinanceAccount | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [valuing, setValuing] = useState<FinanceAccount | null>(null);

  const {
    data: balances,
    isLoading,
    isFetching,
    refetch,
  } = useGetBalancesQuery({
    baseCurrency: baseCurrency || undefined,
    includeArchived: showArchived,
  });

  /**
   * Start the trend where the data actually starts. Opening an account today
   * would otherwise draw eleven months of flat zero before the first real point.
   */
  const historyRange = useMemo(() => {
    const to = new Date().toISOString();
    const defaultFrom = monthsAgo(11);
    const openings = (balances?.accounts ?? [])
      .filter((entry) => !entry.account.excludeFromNetWorth)
      .map((entry) => entry.account.openingDate);

    if (openings.length === 0) return { from: defaultFrom, to, clamped: false };

    const earliest = openings.reduce((a, b) => (a < b ? a : b));
    const clamped = earliest > defaultFrom;
    return { from: clamped ? earliest : defaultFrom, to, clamped };
  }, [balances]);

  const { data: history } = useGetNetWorthHistoryQuery(
    {
      from: historyRange.from,
      to: historyRange.to,
      interval: "month",
      baseCurrency: baseCurrency || "USD",
    },
    { skip: !baseCurrency },
  );

  const { data: debts } = useGetDebtsQuery({
    baseCurrency: baseCurrency || undefined,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, AccountBalance[]>();
    for (const entry of balances?.accounts ?? []) {
      const group = accountKindMeta(entry.account.kind).group;
      map.set(group, [...(map.get(group) ?? []), entry]);
    }
    return map;
  }, [balances]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("finance.baseCurrency")}</Label>
            <select
              value={baseCurrency}
              onChange={(e) => onBaseCurrencyChange(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">{t("finance.accounts.pickBase")}</option>
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <label className="flex min-h-[40px] items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            {t("finance.accounts.showArchived")}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreate} className="min-h-[40px]">
            <Plus className="mr-1 h-4 w-4 text-white" />
            {t("finance.accounts.add")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="min-h-[40px]"
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            {t("common.refresh")}
          </Button>
        </div>
      </div>

      {!baseCurrency && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-start gap-3 py-4 text-sm">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600"
              aria-hidden
            />
            <span className="text-amber-900">
              {t("finance.accounts.pickBaseHint")}
            </span>
          </CardContent>
        </Card>
      )}

      {balances && balances.missingRates.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-start gap-3 py-4 text-sm">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600"
              aria-hidden
            />
            <div className="text-amber-900">
              <p className="font-medium">
                {t("finance.accounts.missingRatesTitle")}
              </p>
              <p>
                {t("finance.accounts.missingRatesBody", {
                  pairs: balances.missingRates
                    .map((r) => `${r.from}/${r.to}`)
                    .join(", "),
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t("finance.loading")}</span>
        </div>
      ) : (
        balances && (
          <div
            className={
              isFetching ? "opacity-60 transition-opacity" : undefined
            }
          >
            <NetWorthHero
              balances={balances}
              history={history}
              baseCurrency={baseCurrency}
              windowStart={historyRange.clamped ? historyRange.from : null}
            />

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="min-w-0 space-y-6 lg:col-span-2">
                {GROUP_ORDER.map((group) => {
                  const entries = grouped.get(group) ?? [];
                  if (entries.length === 0) return null;
                  return (
                    <AccountGroupCard
                      key={group}
                      group={group}
                      entries={entries}
                      baseCurrency={baseCurrency}
                      onEdit={(account) => {
                        setEditing(account);
                        setFormOpen(true);
                      }}
                      onValue={setValuing}
                      onDrillDown={onDrillDown}
                    />
                  );
                })}

                {balances.accounts.length === 0 && (
                  <Card>
                    <CardContent className="space-y-3 py-12 text-center">
                      <Wallet
                        className="mx-auto h-8 w-8 text-muted-foreground"
                        aria-hidden
                      />
                      <p className="text-sm text-muted-foreground">
                        {t("finance.accounts.empty")}
                      </p>
                      <Button
                        size="sm"
                        onClick={openCreate}
                        className="min-h-[40px]"
                      >
                        <Plus className="mr-1 h-4 w-4 text-white" />
                        {t("finance.accounts.add")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="min-w-0 space-y-6">
                <AllocationCard
                  balances={balances}
                  baseCurrency={baseCurrency}
                />
                {debts && (debts.owed.length > 0 || debts.lent.length > 0) && (
                  <DebtsCard debts={debts} onDrillDown={onDrillDown} />
                )}
              </div>
            </div>
          </div>
        )
      )}

      {formOpen && (
        <AccountFormModal
          account={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}

      {valuing && (
        <ValuationModal account={valuing} onClose={() => setValuing(null)} />
      )}
    </div>
  );
}
