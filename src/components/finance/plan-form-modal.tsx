import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/ui/modal";
import {
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useGetArticlesQuery,
  useGetAccountsQuery,
} from "@/services/api";
import type {
  FinancePlan,
  FinancePlanKind,
  FinancePlanPeriod,
} from "@/services/types";
import { COMMON_CURRENCIES, toDateInputValue } from "@/lib/finance-utils";

const KINDS: FinancePlanKind[] = ["LIMIT", "GOAL", "SAVING"];
const PERIODS: FinancePlanPeriod[] = ["MONTH", "QUARTER", "YEAR", "CUSTOM"];

const SELECT =
  "h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10";

export default function PlanFormModal({
  plan,
  baseCurrency,
  onClose,
}: {
  plan: FinancePlan | null;
  baseCurrency: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [createPlan, { isLoading: isCreating }] = useCreatePlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdatePlanMutation();
  const { data: articles } = useGetArticlesQuery({ kind: "EXPENSE" });
  const { data: accounts } = useGetAccountsQuery();

  const [kind, setKind] = useState<FinancePlanKind>(plan?.kind ?? "LIMIT");
  const [name, setName] = useState(plan?.name ?? "");
  const [amount, setAmount] = useState(plan?.amount ?? "");
  const [currency, setCurrency] = useState(
    plan?.currency ?? baseCurrency ?? "USD",
  );
  const [period, setPeriod] = useState<FinancePlanPeriod>(
    plan?.period ?? "MONTH",
  );
  const [startDate, setStartDate] = useState(
    toDateInputValue(plan?.startDate ?? new Date().toISOString()),
  );
  const [endDate, setEndDate] = useState(
    plan?.endDate ? toDateInputValue(plan.endDate) : "",
  );
  const [articleId, setArticleId] = useState(plan?.articleId ?? "");
  const [accountId, setAccountId] = useState(plan?.accountId ?? "");

  const busy = isCreating || isUpdating;
  const amountValid = /^\d+(\.\d{1,8})?$/.test(amount) && parseFloat(amount) > 0;

  // Mirrors the server: each kind needs the thing it measures against.
  const missingCategory = kind === "LIMIT" && !articleId;
  const missingAccount = kind === "GOAL" && !accountId;
  const missingEnd = period === "CUSTOM" && !endDate;
  const canSubmit =
    name.trim().length > 0 &&
    amountValid &&
    !missingCategory &&
    !missingAccount &&
    !missingEnd &&
    !busy;

  const submit = async () => {
    const payload = {
      kind,
      name: name.trim(),
      amount,
      currency,
      period,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      articleId: kind === "LIMIT" ? articleId : undefined,
      accountId: kind === "GOAL" ? accountId : undefined,
    };

    try {
      if (plan) {
        await updatePlan({ id: plan.id, data: payload }).unwrap();
        toast.success(t("finance.plans.updated"));
      } else {
        await createPlan(payload).unwrap();
        toast.success(t("finance.plans.created"));
      }
      onClose();
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(
        message ??
          t(plan ? "finance.plans.updateError" : "finance.plans.createError"),
      );
    }
  };

  return (
    <Modal
      title={t(plan ? "finance.plans.editTitle" : "finance.plans.newTitle")}
      description={t(`finance.plans.kind${kind}Hint`)}
      onClose={onClose}
    >
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="plan-kind">{t("finance.plans.kind")}</Label>
          <select
            id="plan-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as FinancePlanKind)}
            className={SELECT}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`finance.plans.kind${k}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan-name">{t("finance.name")}</Label>
          <Input
            id="plan-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {kind === "LIMIT" && (
          <div className="space-y-2">
            <Label htmlFor="plan-article">{t("finance.plans.category")}</Label>
            <select
              id="plan-article"
              value={articleId}
              onChange={(e) => setArticleId(e.target.value)}
              className={SELECT}
            >
              <option value="">—</option>
              {articles?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {missingCategory && (
              <p className="text-sm text-red-500">
                {t("finance.plans.needCategory")}
              </p>
            )}
          </div>
        )}

        {kind === "GOAL" && (
          <div className="space-y-2">
            <Label htmlFor="plan-account">{t("finance.plans.account")}</Label>
            <select
              id="plan-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={SELECT}
            >
              <option value="">—</option>
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.currency}
                </option>
              ))}
            </select>
            {missingAccount && (
              <p className="text-sm text-red-500">
                {t("finance.plans.needAccount")}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="plan-amount">{t("finance.plans.amount")}</Label>
            <Input
              id="plan-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-currency">{t("finance.currency")}</Label>
            <select
              id="plan-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
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
        {amount.length > 0 && !amountValid && (
          <p className="text-sm text-red-500">{t("finance.invalidAmount")}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="plan-period">{t("finance.plans.period")}</Label>
          <select
            id="plan-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as FinancePlanPeriod)}
            className={SELECT}
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {t(`finance.plans.period${p}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="plan-start">{t("finance.plans.startDate")}</Label>
            <Input
              id="plan-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-end">{t("finance.plans.endDate")}</Label>
            <Input
              id="plan-end"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {missingEnd && (
              <p className="text-sm text-red-500">
                {t("finance.dateRequired")}
              </p>
            )}
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
