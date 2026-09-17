import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  ArrowRightLeft,
  Pencil,
  TrendingDown,
  TrendingUp,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CurrencyConversion, FinanceAccount, FinanceRecord } from "@/services/types";
import { accountColor, formatDate, formatMoney } from "@/lib/finance-utils";

const ROW =
  "flex flex-col gap-3 rounded-lg border border-border/70 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-start sm:justify-between";

function Actions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}) {
  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-11 w-11 flex-shrink-0 p-0 sm:h-9 sm:w-9"
        onClick={onEdit}
        aria-label={editLabel}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="destructive"
        size="sm"
        className="h-11 w-11 flex-shrink-0 p-0 sm:h-9 sm:w-9"
        onClick={onDelete}
        aria-label={deleteLabel}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

/** A named account with its colour dot, as it appears on every row. */
function AccountChip({
  name,
  color,
  kind,
}: {
  name: string;
  color: string | null;
  kind: string;
}) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted-foreground">
      <span
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: accountColor(color, kind) }}
        aria-hidden
      />
      {name}
    </span>
  );
}

export function RecordRow({
  record,
  baseCurrency,
  onEdit,
  onDelete,
}: {
  record: FinanceRecord;
  baseCurrency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const isIncome = record.type === "INCOME";

  // Only worth showing when it is the rate this page is actually reporting in.
  const ownRate =
    record.baseRate && record.baseCurrency === baseCurrency
      ? record.baseRate
      : null;

  return (
    <div className={ROW}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`flex-shrink-0 rounded-full p-1.5 ${
              isIncome ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {isIncome ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </div>
          <span
            className={`font-semibold tabular-nums ${
              isIncome ? "text-green-600" : "text-red-600"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatMoney(record.amount, record.currency)}
          </span>
          {record.article && (
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{
                backgroundColor: record.article.color
                  ? `${record.article.color}20`
                  : "#f1f5f9",
                color: record.article.color || "#64748b",
              }}
            >
              {record.article.name}
            </span>
          )}
          {record.account ? (
            <AccountChip
              name={record.account.name}
              color={record.account.color}
              kind={record.account.kind}
            />
          ) : (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
              {t("finance.rec.unassigned")}
            </span>
          )}
          {ownRate && (
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
              {t("finance.rec.atOwnRate", {
                rate: ownRate,
                currency: baseCurrency,
              })}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDate(record.operationDate)}
          {record.remark && ` · ${record.remark}`}
        </p>
      </div>
      <Actions
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={t("common.edit")}
        deleteLabel={t("common.delete")}
      />
    </div>
  );
}

/**
 * A transfer is two accounts, two amounts and the rate between them. Showing
 * only the amounts — as the old conversions list did — left you unable to tell
 * which of your accounts the money actually left.
 */
export function TransferRow({
  transfer,
  accounts,
  onEdit,
  onDelete,
}: {
  transfer: CurrencyConversion;
  accounts: FinanceAccount[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const from = accounts.find((a) => a.id === transfer.fromAccountId);
  const to = accounts.find((a) => a.id === transfer.toAccountId);
  const crossCurrency = transfer.fromCurrency !== transfer.toCurrency;

  return (
    <div className={ROW}>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-shrink-0 rounded-full bg-slate-100 p-1.5">
            <ArrowRightLeft className="h-4 w-4 text-slate-600" />
          </div>
          <span className="font-semibold tabular-nums">
            {formatMoney(transfer.fromAmount, transfer.fromCurrency)}
          </span>
          {/* Same-currency transfers arrive as what they left; repeating the
              figure would only read as an extra number to reconcile. */}
          {crossCurrency && (
            <>
              <ArrowRight
                className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="font-semibold tabular-nums">
                {formatMoney(transfer.toAmount, transfer.toCurrency)}
              </span>
            </>
          )}
        </div>

        {/* Which of your accounts the money left, and where it landed. */}
        <div className="flex flex-wrap items-center gap-1.5">
          {from ? (
            <AccountChip name={from.name} color={from.color} kind={from.kind} />
          ) : (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
              {t("finance.transfers.noAccount")}
            </span>
          )}
          <ArrowRight
            className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground"
            aria-hidden
          />
          {to ? (
            <AccountChip name={to.name} color={to.color} kind={to.kind} />
          ) : (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
              {t("finance.transfers.noAccount")}
            </span>
          )}
          {transfer.isCustomRate && (
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
              {t("finance.transfers.ownRateBadge")}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {formatDate(transfer.operationDate)}
          {crossCurrency && ` · ${t("finance.rate")} ${transfer.rateUsed}`}
          {transfer.feeAmount &&
            transfer.feeCurrency &&
            ` · ${t("finance.transfers.fee")} ${formatMoney(
              transfer.feeAmount,
              transfer.feeCurrency,
            )}`}
          {transfer.remark && ` · ${transfer.remark}`}
        </p>
      </div>
      <Actions
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={t("common.edit")}
        deleteLabel={t("common.delete")}
      />
    </div>
  );
}
