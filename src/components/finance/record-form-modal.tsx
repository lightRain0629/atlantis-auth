import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/ui/modal";
import type {
  FinanceAccount,
  FinanceArticle,
  FinanceRecord,
  FinanceRecordType,
} from "@/services/types";
import {
  COMMON_CURRENCIES,
  formatMoney,
  toAmountString,
  toDateInputValue,
} from "@/lib/finance-utils";

const SELECT =
  "h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10";

const isPositiveDecimal = (value: string) =>
  /^\d*\.?\d+$/.test(value) && parseFloat(value) > 0;

/**
 * What the form hands back. `null` means "clear this", which create and update
 * spell differently — the caller translates, so the form can stay one shape.
 */
export type RecordFormValues = {
  type: FinanceRecordType;
  amount: string;
  currency: string;
  articleId: string | null;
  accountId: string | null;
  remark: string | null;
  operationDate: string;
  baseCurrency: string | null;
  baseRate: string | null;
};

/**
 * One form for both creating and correcting a record. They ask for exactly the
 * same fields, and keeping two copies is how the custom rate ends up on only
 * one of them.
 */
export default function RecordFormModal({
  record,
  articles,
  accounts,
  baseCurrency,
  isSaving,
  onSave,
  onClose,
}: {
  record?: FinanceRecord;
  articles: FinanceArticle[];
  accounts: FinanceAccount[];
  /** The currency the page reports in — what a custom rate converts into. */
  baseCurrency: string;
  isSaving: boolean;
  onSave: (values: RecordFormValues) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = Boolean(record);

  const [type, setType] = useState<FinanceRecordType>(record?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(record?.amount ?? "");
  const [currency, setCurrency] = useState(record?.currency ?? "TMT");
  const [articleId, setArticleId] = useState(record?.articleId ?? "");
  const [accountId, setAccountId] = useState(record?.accountId ?? "");
  const [remark, setRemark] = useState(record?.remark ?? "");
  const [operationDate, setOperationDate] = useState(() =>
    toDateInputValue(record?.operationDate ?? new Date().toISOString()),
  );

  // The override is only offered against the currency the page reports in, so
  // there is one unambiguous answer to "a rate into what?".
  const editsThisBase = record?.baseCurrency === baseCurrency;
  const [useCustomRate, setUseCustomRate] = useState(
    () => editsThisBase && Boolean(record?.baseRate),
  );
  const [customRate, setCustomRate] = useState(() =>
    editsThisBase ? (record?.baseRate ?? "") : "",
  );

  /**
   * A rate stored against some other base currency is not editable here and
   * must not be destroyed by an unrelated edit — switch the page to that
   * currency to change it.
   */
  const foreignOverride =
    record?.baseRate && !editsThisBase ? record.baseCurrency : null;

  const filteredArticles = articles.filter((a) => a.kind === type);
  // A record must sit in an account of the same currency, so only offer those.
  const eligibleAccounts = useMemo(
    () =>
      accounts.filter(
        (a) =>
          a.valuationMode === "TRACKED" &&
          !a.isArchived &&
          a.currency === currency,
      ),
    [accounts, currency],
  );

  // A record already in the base currency needs no rate into it.
  const rateApplies = currency !== baseCurrency;
  const amountValid = /^\d+(\.\d{1,8})?$/.test(amount) && parseFloat(amount) > 0;
  const rateValid = !useCustomRate || isPositiveDecimal(customRate);
  const canSave = amountValid && rateValid && !isSaving;

  const convertedPreview =
    rateApplies && useCustomRate && rateValid && amountValid
      ? toAmountString(parseFloat(amount) * parseFloat(customRate))
      : null;

  /** Switching currency can strand the record on an account it no longer fits. */
  const changeCurrency = (next: string) => {
    setCurrency(next);
    const stillValid = accounts.some(
      (a) =>
        a.id === accountId &&
        a.valuationMode === "TRACKED" &&
        a.currency === next,
    );
    if (!stillValid) setAccountId("");
    // A rate into the record's own currency is meaningless, and the API
    // rejects it, so drop it rather than let the save fail.
    if (next === baseCurrency) setUseCustomRate(false);
  };

  const submit = () => {
    const overrideOn = rateApplies && useCustomRate && rateValid;
    // Both halves move together. A rate against another base is passed back
    // untouched rather than cleared, since this form never offered to edit it.
    const override = overrideOn
      ? { baseCurrency, baseRate: customRate }
      : foreignOverride
        ? { baseCurrency: record!.baseCurrency, baseRate: record!.baseRate }
        : { baseCurrency: null, baseRate: null };

    onSave({
      type,
      amount: toAmountString(parseFloat(amount)),
      currency: currency.toUpperCase(),
      articleId: articleId || null,
      accountId: accountId || null,
      remark: remark || null,
      operationDate: new Date(operationDate).toISOString(),
      ...override,
    });
  };

  return (
    <Modal
      title={isEdit ? t("finance.editRecord") : t("finance.newRecord")}
      description={
        isEdit ? t("finance.editRecordDesc") : t("finance.newRecordDesc")
      }
      onClose={onClose}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="rec-type">{t("finance.type")}</Label>
            <select
              id="rec-type"
              value={type}
              onChange={(e) => setType(e.target.value as FinanceRecordType)}
              className={SELECT}
            >
              <option value="EXPENSE">{t("finance.expense")}</option>
              <option value="INCOME">{t("finance.income")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rec-currency">{t("finance.currency")}</Label>
            <select
              id="rec-currency"
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
              className={SELECT}
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rec-amount">{t("finance.amount")}</Label>
          <Input
            id="rec-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSaving}
          />
          {amount.length > 0 && !amountValid && (
            <p className="text-sm text-red-500">{t("finance.invalidAmount")}</p>
          )}
        </div>

        {/* Only a record in a foreign currency has a rate to override. */}
        {rateApplies && (
          <div className="space-y-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5 text-sm">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={useCustomRate}
                onChange={(e) => setUseCustomRate(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-input"
                disabled={isSaving}
              />
              <span className="flex items-center gap-1.5 font-medium">
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                {t("finance.rec.ownRate", { currency: baseCurrency })}
              </span>
            </label>

            {foreignOverride && !useCustomRate && (
              <p className="text-xs text-muted-foreground">
                {t("finance.rec.otherBaseRate", {
                  rate: record?.baseRate,
                  currency: foreignOverride,
                })}
              </p>
            )}

            {useCustomRate && (
              <div className="space-y-2">
                <Label htmlFor="rec-rate" className="text-xs">
                  {t("finance.transfers.ownRateLabel", {
                    from: currency,
                    to: baseCurrency,
                  })}
                </Label>
                <Input
                  id="rec-rate"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  disabled={isSaving}
                />
                {customRate.length > 0 && !rateValid && (
                  <p className="text-sm text-red-500">
                    {t("finance.invalidRate")}
                  </p>
                )}
                {convertedPreview ? (
                  <p>
                    <span className="text-muted-foreground">
                      {t("finance.rec.countsAs")}{" "}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(convertedPreview, baseCurrency)}
                    </span>
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {t("finance.rec.ownRateHint", { currency: baseCurrency })}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="rec-article">{t("finance.category")}</Label>
          <select
            id="rec-article"
            value={articleId}
            onChange={(e) => setArticleId(e.target.value)}
            className={SELECT}
          >
            <option value="">{t("finance.noCategory")}</option>
            {filteredArticles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rec-account">{t("finance.account")}</Label>
          <select
            id="rec-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className={SELECT}
          >
            <option value="">{t("finance.rec.noAccount")}</option>
            {eligibleAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {eligibleAccounts.length === 0
              ? t("finance.rec.noAccountForCurrency", { currency })
              : t("finance.rec.accountHint")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rec-date">{t("finance.date")}</Label>
          <Input
            id="rec-date"
            type="date"
            value={operationDate}
            onChange={(e) => setOperationDate(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rec-remark">{t("finance.remark")}</Label>
          <Input
            id="rec-remark"
            placeholder={t("finance.remarkPlaceholder")}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={!canSave}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
