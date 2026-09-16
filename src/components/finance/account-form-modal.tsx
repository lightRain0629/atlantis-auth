import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useCreateValuationMutation,
} from "@/services/api";
import type { FinanceAccount, FinanceAccountKind } from "@/services/types";
import {
  ACCOUNT_KINDS,
  COMMON_CURRENCIES,
  VALUED_BY_DEFAULT_KINDS,
  toDateInputValue,
} from "@/lib/finance-utils";

/** Shared shell so every finance dialog behaves the same on phone and desktop. */
export function ModalShell({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

const DEBT_KINDS: FinanceAccountKind[] = ["LOAN", "CREDIT_CARD", "RECEIVABLE"];

export function AccountFormModal({
  account,
  onClose,
}: {
  account: FinanceAccount | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = Boolean(account);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("finance.accounts.nameRequired")).max(100),
        kind: z.string().min(1),
        currency: z
          .string()
          .regex(/^[A-Za-z0-9]{2,10}$/, t("finance.accounts.invalidCurrency")),
        valuationMode: z.enum(["TRACKED", "VALUED"]),
        openingBalance: z
          .string()
          .regex(/^-?\d*(\.\d{1,8})?$/, t("finance.invalidAmount"))
          .optional(),
        openingDate: z.string().min(1, t("finance.dateRequired")),
        institution: z.string().max(100).optional(),
        counterparty: z.string().max(120).optional(),
        creditLimit: z.string().optional(),
        interestRate: z.string().optional(),
        dueDate: z.string().optional(),
        excludeFromNetWorth: z.boolean(),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: account?.name ?? "",
      kind: account?.kind ?? "CASH",
      currency: account?.currency ?? "TMT",
      valuationMode: account?.valuationMode ?? "TRACKED",
      openingBalance: account?.openingBalance ?? "0",
      openingDate: toDateInputValue(
        account?.openingDate ?? new Date().toISOString(),
      ),
      institution: account?.institution ?? "",
      counterparty: account?.counterparty ?? "",
      creditLimit: account?.creditLimit ?? "",
      interestRate: account?.interestRate ?? "",
      dueDate: account?.dueDate ? toDateInputValue(account.dueDate) : "",
      excludeFromNetWorth: account?.excludeFromNetWorth ?? false,
    },
  });

  const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();
  const [updateAccount, { isLoading: isUpdating }] = useUpdateAccountMutation();
  const [deleteAccount] = useDeleteAccountMutation();

  const kind = watch("kind") as FinanceAccountKind;
  const isDebt = DEBT_KINDS.includes(kind);
  const valuationMode = watch("valuationMode");

  // Property and investments are worth what they are appraised at, not what the
  // ledger adds up to, so default those kinds to valuation mode.
  useEffect(() => {
    if (isEdit) return;
    setValue(
      "valuationMode",
      VALUED_BY_DEFAULT_KINDS.includes(kind) ? "VALUED" : "TRACKED",
    );
  }, [kind, isEdit, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      kind: values.kind as FinanceAccountKind,
      valuationMode: values.valuationMode,
      openingBalance: values.openingBalance || "0",
      openingDate: new Date(values.openingDate).toISOString(),
      institution: values.institution || undefined,
      counterparty: values.counterparty || undefined,
      creditLimit: values.creditLimit || undefined,
      interestRate: values.interestRate || undefined,
      dueDate: values.dueDate
        ? new Date(values.dueDate).toISOString()
        : undefined,
      excludeFromNetWorth: values.excludeFromNetWorth,
    };

    try {
      if (account) {
        await updateAccount({ id: account.id, data: payload }).unwrap();
        toast.success(t("finance.accounts.updated"));
      } else {
        await createAccount({
          ...payload,
          currency: values.currency.toUpperCase(),
        }).unwrap();
        toast.success(t("finance.accounts.created"));
      }
      onClose();
    } catch (err) {
      const message = (err as { data?: { message?: string | string[] } })?.data
        ?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(", ")
          : (message ?? t("finance.accounts.saveError")),
      );
    }
  });

  const onDelete = async () => {
    if (!account) return;
    try {
      const result = await deleteAccount(account.id).unwrap();
      toast.info(
        result.isArchived
          ? t("finance.accounts.archivedToast")
          : t("finance.accounts.deleted"),
      );
      onClose();
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? t("finance.accounts.deleteError"));
    }
  };

  const busy = isCreating || isUpdating;

  return (
    <ModalShell
      title={
        isEdit ? t("finance.accounts.editTitle") : t("finance.accounts.addTitle")
      }
      description={t("finance.accounts.formHint")}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="acc-name">{t("finance.accounts.name")}</Label>
          <Input
            id="acc-name"
            {...register("name")}
            placeholder={t("finance.accounts.namePlaceholder")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="acc-kind">{t("finance.accounts.kindLabel")}</Label>
            <select
              id="acc-kind"
              {...register("kind")}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {ACCOUNT_KINDS.map((option) => (
                <option key={option.kind} value={option.kind}>
                  {t(`finance.accounts.kind.${option.kind}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-currency">{t("finance.currency")}</Label>
            <Input
              id="acc-currency"
              {...register("currency")}
              disabled={isEdit}
              list="currency-options"
              placeholder="TMT"
              className="uppercase"
            />
            <datalist id="currency-options">
              {[...COMMON_CURRENCIES, "BTC", "ETH", "USDT", "USDC"].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {isEdit ? (
              <p className="text-xs text-muted-foreground">
                {t("finance.accounts.currencyLocked")}
              </p>
            ) : (
              errors.currency && (
                <p className="text-xs text-destructive">
                  {errors.currency.message}
                </p>
              )
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="acc-mode">{t("finance.accounts.mode")}</Label>
          <select
            id="acc-mode"
            {...register("valuationMode")}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="TRACKED">
              {t("finance.accounts.modeTracked")}
            </option>
            <option value="VALUED">{t("finance.accounts.modeValued")}</option>
          </select>
          <p className="text-xs text-muted-foreground">
            {valuationMode === "VALUED"
              ? t("finance.accounts.modeValuedHint")
              : t("finance.accounts.modeTrackedHint")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="acc-opening">
              {t("finance.accounts.openingBalance")}
            </Label>
            <Input id="acc-opening" {...register("openingBalance")} />
            {errors.openingBalance && (
              <p className="text-xs text-destructive">
                {errors.openingBalance.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("finance.accounts.openingBalanceHint")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="acc-opening-date">
              {t("finance.accounts.openingDate")}
            </Label>
            <Input
              id="acc-opening-date"
              type="date"
              {...register("openingDate")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="acc-institution">
            {t("finance.accounts.institution")}
          </Label>
          <Input
            id="acc-institution"
            {...register("institution")}
            placeholder={t("finance.accounts.institutionPlaceholder")}
          />
        </div>

        {isDebt && (
          <div className="space-y-4 rounded-lg border border-border/70 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("finance.accounts.debtDetails")}
            </p>
            <div className="space-y-2">
              <Label htmlFor="acc-counterparty">
                {t("finance.accounts.counterparty")}
              </Label>
              <Input
                id="acc-counterparty"
                {...register("counterparty")}
                placeholder={t("finance.accounts.counterpartyPlaceholder")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="acc-limit">
                  {t("finance.accounts.creditLimit")}
                </Label>
                <Input id="acc-limit" {...register("creditLimit")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-rate">
                  {t("finance.accounts.interestRate")}
                </Label>
                <Input id="acc-rate" {...register("interestRate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-due">{t("finance.accounts.dueDate")}</Label>
                <Input id="acc-due" type="date" {...register("dueDate")} />
              </div>
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            {...register("excludeFromNetWorth")}
            className="h-4 w-4 rounded border-input"
          />
          {t("finance.accounts.excludeFromNetWorth")}
        </label>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          {isEdit ? (
            <Button
              type="button"
              variant="outline"
              onClick={onDelete}
              className="min-h-[44px] text-destructive"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {t("common.delete")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-[44px]"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy} className="min-h-[44px]">
              {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

export function ValuationModal({
  account,
  onClose,
}: {
  account: FinanceAccount;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [createValuation, { isLoading }] = useCreateValuationMutation();

  const schema = useMemo(
    () =>
      z.object({
        value: z
          .string()
          .regex(/^-?\d+(\.\d{1,8})?$/, t("finance.invalidAmount")),
        valuedAt: z.string().min(1, t("finance.dateRequired")),
        remark: z.string().max(500).optional(),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      value: "",
      valuedAt: toDateInputValue(new Date().toISOString()),
      remark: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createValuation({
        accountId: account.id,
        data: {
          value: values.value,
          valuedAt: new Date(values.valuedAt).toISOString(),
          remark: values.remark || undefined,
        },
      }).unwrap();
      toast.success(t("finance.accounts.valuationSaved"));
      onClose();
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? t("finance.accounts.saveError"));
    }
  });

  return (
    <ModalShell
      title={t("finance.accounts.updateValueFor", { name: account.name })}
      description={t("finance.accounts.valuationHint")}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="val-value">
            {t("finance.accounts.currentValue", {
              currency: account.currency,
            })}
          </Label>
          <Input id="val-value" {...register("value")} inputMode="decimal" />
          {errors.value && (
            <p className="text-xs text-destructive">{errors.value.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="val-date">{t("finance.accounts.valuedAt")}</Label>
          <Input id="val-date" type="date" {...register("valuedAt")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="val-remark">{t("finance.remark")}</Label>
          <Input id="val-remark" {...register("remark")} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="min-h-[44px]"
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading} className="min-h-[44px]">
            {isLoading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
