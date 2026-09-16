import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/ui/modal";
import {
  useCreateConversionMutation,
  useGetLatestRateQuery,
} from "@/services/api";
import type { FinanceAccount } from "@/services/types";
import {
  accountColor,
  formatMoney,
  toAmountString,
  toDateInputValue,
} from "@/lib/finance-utils";

/**
 * Moving money between your own accounts is the common case; crossing a
 * currency is the exception. So this asks for the two accounts first and reads
 * the currencies off them, rather than making you pick currencies and then
 * discover which accounts survive the filter.
 */
export default function TransferModal({
  accounts,
  onClose,
}: {
  accounts: FinanceAccount[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [createConversion, { isLoading }] = useCreateConversionMutation();

  // A valuation-based account holds an appraisal, not a ledger; it cannot
  // take a transfer.
  const transferable = useMemo(
    () =>
      accounts.filter((a) => a.valuationMode === "TRACKED" && !a.isArchived),
    [accounts],
  );

  const [fromId, setFromId] = useState(transferable[0]?.id ?? "");
  const [toId, setToId] = useState(transferable[1]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [operationDate, setOperationDate] = useState(() =>
    toDateInputValue(new Date().toISOString()),
  );
  const [remark, setRemark] = useState("");

  const from = transferable.find((a) => a.id === fromId);
  const to = transferable.find((a) => a.id === toId);
  const crossCurrency = Boolean(from && to && from.currency !== to.currency);

  // Only cross-currency moves need a rate; same-currency books at 1.
  const { data: rate, isError: rateMissing } = useGetLatestRateQuery(
    { base: from?.currency ?? "", quote: to?.currency ?? "" },
    { skip: !crossCurrency },
  );

  const amountValid = /^\d+(\.\d{1,8})?$/.test(amount) && parseFloat(amount) > 0;
  const sameAccount = Boolean(fromId) && fromId === toId;
  const canSubmit =
    Boolean(from) && Boolean(to) && !sameAccount && amountValid && !isLoading;

  // Preview only — the server books the authoritative figure. Rounded so
  // float noise does not surface as 1839.9999999999998.
  const converted =
    crossCurrency && rate && amountValid
      ? toAmountString(parseFloat(amount) * parseFloat(rate.effectiveRate))
      : null;

  const submit = async () => {
    if (!from || !to) return;
    try {
      await createConversion({
        fromAmount: toAmountString(parseFloat(amount)),
        fromCurrency: from.currency,
        toCurrency: to.currency,
        fromAccountId: from.id,
        toAccountId: to.id,
        operationDate: new Date(operationDate).toISOString(),
        remark: remark || undefined,
      }).unwrap();
      toast.success(t("finance.transfers.created"));
      onClose();
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? t("finance.transfers.createError"));
    }
  };

  const accountOption = (account: FinanceAccount) =>
    `${account.name} · ${account.currency}`;

  if (transferable.length < 2) {
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
      title={t("finance.transfers.title")}
      description={t("finance.transfers.description")}
      onClose={onClose}
    >
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="tr-from">{t("finance.transfers.fromAccount")}</Label>
          <select
            id="tr-from"
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10"
          >
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
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10"
          >
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
            {from
              ? t("finance.transfers.amountIn", { currency: from.currency })
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
          <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5 text-sm">
            {rateMissing ? (
              <p className="text-amber-700">
                {t("finance.transfers.noRate", {
                  from: from?.currency,
                  to: to?.currency,
                })}
              </p>
            ) : converted && to ? (
              <p>
                <span className="text-muted-foreground">
                  {t("finance.transfers.willArrive")}{" "}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(converted, to.currency)}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({t("finance.rate")} {rate?.effectiveRate})
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground">
                {t("finance.transfers.rateApplied")}
              </p>
            )}
          </div>
        )}

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
            {t("finance.transfers.transfer")}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
