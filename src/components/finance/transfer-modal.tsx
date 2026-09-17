import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowRight, Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/ui/modal";
import {
  useCreateConversionMutation,
  useUpdateConversionMutation,
  useGetLatestRateQuery,
} from "@/services/api";
import type { CurrencyConversion, FinanceAccount } from "@/services/types";
import {
  accountColor,
  formatMoney,
  toAmountString,
  toDateInputValue,
} from "@/lib/finance-utils";

const SELECT =
  "h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10";

const isPositiveDecimal = (value: string) =>
  /^\d*\.?\d+$/.test(value) && parseFloat(value) > 0;

/**
 * Moving money between your own accounts is the common case; crossing a
 * currency is the exception. So this asks for the two accounts first and reads
 * the currencies off them, rather than making you pick currencies and then
 * discover which accounts survive the filter.
 *
 * Passing `transfer` turns it into an edit of that transfer instead.
 */
export default function TransferModal({
  accounts,
  transfer,
  onClose,
}: {
  accounts: FinanceAccount[];
  transfer?: CurrencyConversion;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [createConversion, { isLoading: isCreating }] =
    useCreateConversionMutation();
  const [updateConversion, { isLoading: isUpdating }] =
    useUpdateConversionMutation();
  const isLoading = isCreating || isUpdating;
  const isEdit = Boolean(transfer);

  // A valuation-based account holds an appraisal, not a ledger; it cannot
  // take a transfer. An archived account still shows while editing a transfer
  // that already points at it, so the form can round-trip without rewriting it.
  const transferable = useMemo(
    () =>
      accounts.filter(
        (a) =>
          a.valuationMode === "TRACKED" &&
          (!a.isArchived ||
            a.id === transfer?.fromAccountId ||
            a.id === transfer?.toAccountId),
      ),
    [accounts, transfer],
  );

  // Editing starts from what the transfer actually holds, including "no
  // account at all" — a conversion booked without accounts must not silently
  // acquire two just because it was opened.
  const [fromId, setFromId] = useState(() =>
    transfer ? (transfer.fromAccountId ?? "") : (transferable[0]?.id ?? ""),
  );
  const [toId, setToId] = useState(() =>
    transfer ? (transfer.toAccountId ?? "") : (transferable[1]?.id ?? ""),
  );
  const [amount, setAmount] = useState(() => transfer?.fromAmount ?? "");
  const [operationDate, setOperationDate] = useState(() =>
    toDateInputValue(transfer?.operationDate ?? new Date().toISOString()),
  );
  const [remark, setRemark] = useState(() => transfer?.remark ?? "");
  const [feeAmount, setFeeAmount] = useState(() => transfer?.feeAmount ?? "");

  // A transfer already booked at a typed rate opens with that rate showing, so
  // saving an unrelated edit cannot quietly swap it for the table one.
  const [useCustomRate, setUseCustomRate] = useState(
    () => transfer?.isCustomRate ?? false,
  );
  const [customRate, setCustomRate] = useState(() =>
    transfer?.isCustomRate ? transfer.rateUsed : "",
  );

  const from = transferable.find((a) => a.id === fromId);
  const to = transferable.find((a) => a.id === toId);
  // An unlinked leg has no account to read a currency off, so it keeps the one
  // the transfer was booked in.
  const fromCurrency = from?.currency ?? transfer?.fromCurrency ?? "";
  const toCurrency = to?.currency ?? transfer?.toCurrency ?? "";
  const crossCurrency = Boolean(
    fromCurrency && toCurrency && fromCurrency !== toCurrency,
  );

  // Only cross-currency moves need a rate; same-currency books at 1.
  const { data: rate, isError: rateMissing } = useGetLatestRateQuery(
    { base: fromCurrency, quote: toCurrency },
    { skip: !crossCurrency || useCustomRate },
  );

  const amountValid = /^\d+(\.\d{1,8})?$/.test(amount) && parseFloat(amount) > 0;
  const sameAccount = Boolean(fromId) && fromId === toId;
  const customRateValid = !useCustomRate || isPositiveDecimal(customRate);
  const feeValid = feeAmount === "" || isPositiveDecimal(feeAmount);
  const canSubmit =
    Boolean(fromCurrency) &&
    Boolean(toCurrency) &&
    !sameAccount &&
    amountValid &&
    customRateValid &&
    feeValid &&
    !isLoading;

  // The rate this transfer will actually book at, whichever source it comes
  // from — so the arrival preview never disagrees with the rate on screen.
  const effectiveRate = !crossCurrency
    ? "1"
    : useCustomRate
      ? customRateValid
        ? customRate
        : null
      : (rate?.effectiveRate ?? null);

  // Preview only — the server books the authoritative figure. Rounded so
  // float noise does not surface as 1839.9999999999998.
  const converted =
    crossCurrency && effectiveRate && amountValid
      ? toAmountString(parseFloat(amount) * parseFloat(effectiveRate))
      : null;

  const submit = async () => {
    if (!fromCurrency || !toCurrency) return;

    const shared = {
      fromAmount: toAmountString(parseFloat(amount)),
      fromCurrency,
      toCurrency,
      operationDate: new Date(operationDate).toISOString(),
    };
    const fee = feeAmount
      ? {
          feeAmount: toAmountString(parseFloat(feeAmount)),
          feeCurrency: fromCurrency,
        }
      : null;

    try {
      if (transfer) {
        await updateConversion({
          id: transfer.id,
          data: {
            ...shared,
            fromAccountId: fromId || null,
            toAccountId: toId || null,
            // An emptied field means "clear this". Sending undefined would
            // instead keep whatever the transfer already carries, so a fee or
            // note you deleted would quietly come back.
            feeAmount: fee?.feeAmount ?? null,
            feeCurrency: fee?.feeCurrency ?? null,
            remark: remark || null,
            // Likewise null asks for the table rate back, where undefined
            // would keep the custom one.
            rate: useCustomRate && crossCurrency ? customRate : null,
          },
        }).unwrap();
        toast.success(t("finance.transfers.updated"));
      } else {
        await createConversion({
          ...shared,
          fromAccountId: fromId || undefined,
          toAccountId: toId || undefined,
          feeAmount: fee?.feeAmount,
          feeCurrency: fee?.feeCurrency,
          remark: remark || undefined,
          rate:
            useCustomRate && crossCurrency && customRateValid
              ? customRate
              : undefined,
        }).unwrap();
        toast.success(t("finance.transfers.created"));
      }
      onClose();
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(
        message ??
          t(
            transfer
              ? "finance.transfers.updateError"
              : "finance.transfers.createError",
          ),
      );
    }
  };

  const accountOption = (account: FinanceAccount) =>
    `${account.name} · ${account.currency}${
      account.isArchived ? ` (${t("finance.accounts.archived")})` : ""
    }`;

  if (!isEdit && transferable.length < 2) {
    return (
      <Modal
        title={t("finance.transfers.title")}
        description={t("finance.transfers.description")}
        onClose={onClose}
      >
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("finance.transfers.needTwoAccounts")}
        </p>
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal
      title={
        isEdit ? t("finance.transfers.editTitle") : t("finance.transfers.title")
      }
      description={
        isEdit
          ? t("finance.transfers.editDescription")
          : t("finance.transfers.description")
      }
      onClose={onClose}
    >
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="tr-from">{t("finance.transfers.fromAccount")}</Label>
          <select
            id="tr-from"
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className={SELECT}
          >
            {/* Only offered while editing: a transfer booked without accounts
                has to be able to stay that way. */}
            {isEdit && (
              <option value="">{t("finance.transfers.noAccount")}</option>
            )}
            {transferable.map((a) => (
              <option key={a.id} value={a.id}>
                {accountOption(a)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center" aria-hidden>
          <span
            className="flex h-8 w-8 rotate-90 items-center justify-center rounded-full border border-border/70 text-muted-foreground"
            style={{
              color: from ? accountColor(from.color, from.kind) : undefined,
            }}
          >
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tr-to">{t("finance.transfers.toAccount")}</Label>
          <select
            id="tr-to"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className={SELECT}
          >
            {/* Only offered while editing: a transfer booked without accounts
                has to be able to stay that way. */}
            {isEdit && (
              <option value="">{t("finance.transfers.noAccount")}</option>
            )}
            {transferable.map((a) => (
              <option key={a.id} value={a.id}>
                {accountOption(a)}
              </option>
            ))}
          </select>
          {sameAccount && (
            <p className="text-sm text-red-500">
              {t("finance.transfers.sameAccount")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tr-amount">
            {fromCurrency
              ? t("finance.transfers.amountIn", { currency: fromCurrency })
              : t("finance.amount")}
          </Label>
          <Input
            id="tr-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {amount.length > 0 && !amountValid && (
            <p className="text-sm text-red-500">{t("finance.invalidAmount")}</p>
          )}
        </div>

        {/* Crossing a currency is the only case that needs an FX rate. */}
        {crossCurrency && (
          <div className="space-y-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5 text-sm">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={useCustomRate}
                onChange={(e) => {
                  setUseCustomRate(e.target.checked);
                  // Seed from the looked-up rate so the common edit is a nudge,
                  // not retyping the whole figure.
                  if (e.target.checked && !customRate && rate) {
                    setCustomRate(rate.effectiveRate);
                  }
                }}
                className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-input"
              />
              <span className="flex items-center gap-1.5 font-medium">
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                {t("finance.transfers.ownRate")}
              </span>
            </label>

            {useCustomRate ? (
              <div className="space-y-2">
                <Label htmlFor="tr-rate" className="text-xs">
                  {t("finance.transfers.ownRateLabel", {
                    from: fromCurrency,
                    to: toCurrency,
                  })}
                </Label>
                <Input
                  id="tr-rate"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                />
                {customRate.length > 0 && !customRateValid && (
                  <p className="text-sm text-red-500">
                    {t("finance.invalidRate")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("finance.transfers.ownRateHint")}
                </p>
              </div>
            ) : rateMissing ? (
              <p className="text-amber-700">
                {t("finance.transfers.noRateTickOwn", {
                  from: fromCurrency,
                  to: toCurrency,
                })}
              </p>
            ) : null}

            {converted && to ? (
              <p>
                <span className="text-muted-foreground">
                  {t("finance.transfers.willArrive")}{" "}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(converted, toCurrency)}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({t("finance.rate")} {effectiveRate})
                </span>
              </p>
            ) : !useCustomRate && !rateMissing ? (
              <p className="text-muted-foreground">
                {t("finance.transfers.rateApplied")}
              </p>
            ) : null}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tr-date">{t("finance.date")}</Label>
            <Input
              id="tr-date"
              type="date"
              value={operationDate}
              onChange={(e) => setOperationDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tr-fee">
              {fromCurrency
                ? t("finance.transfers.feeIn", { currency: fromCurrency })
                : t("finance.transfers.fee")}
            </Label>
            <Input
              id="tr-fee"
              inputMode="decimal"
              placeholder="0.00"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
            />
            {feeAmount.length > 0 && !feeValid && (
              <p className="text-sm text-red-500">
                {t("finance.invalidAmount")}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tr-remark">{t("finance.remark")}</Label>
          <Input
            id="tr-remark"
            placeholder={t("finance.remarkPlaceholder")}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? t("common.save") : t("finance.transfers.transfer")}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
