import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  useGetPlanProgressQuery,
  useDeletePlanMutation,
} from "@/services/api";
import type {
  FinancePlan,
  FinancePlanKind,
  PlanProgress,
} from "@/services/types";
import { COMMON_CURRENCIES, formatMoney } from "@/lib/finance-utils";
import { Meter } from "./chart-parts";
import PlanFormModal from "./plan-form-modal";

const GROUP_ORDER: FinancePlanKind[] = ["LIMIT", "GOAL", "SAVING"];

type Window = "month" | "quarter" | "year";

/** Calendar bounds in UTC, matching how the server slices its windows. */
function windowBounds(window: Window): { from: string; to: string } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  if (window === "year") {
    return {
      from: new Date(Date.UTC(year, 0, 1)).toISOString(),
      to: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)).toISOString(),
    };
  }
  if (window === "quarter") {
    const first = Math.floor(month / 3) * 3;
    return {
      from: new Date(Date.UTC(year, first, 1)).toISOString(),
      to: new Date(Date.UTC(year, first + 3, 0, 23, 59, 59, 999)).toISOString(),
    };
  }
  return {
    from: new Date(Date.UTC(year, month, 1)).toISOString(),
    to: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).toISOString(),
  };
}

function PlanRow({
  row,
  currency,
  onEdit,
  onDelete,
}: {
  row: PlanProgress;
  currency: string;
  onEdit: (plan: FinancePlan) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const remaining = parseFloat(row.remaining);
  const isLimit = row.plan.kind === "LIMIT";

  return (
    <div className="space-y-2 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{row.plan.name}</p>
          <p className="text-xs text-muted-foreground">
            {t(`finance.plans.period${row.plan.period}`)}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-11 w-11 p-0 sm:h-9 sm:w-9"
            onClick={() => onEdit(row.plan)}
            aria-label={t("common.edit")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-11 w-11 p-0 sm:h-9 sm:w-9"
            onClick={() => onDelete(row.plan.id)}
            aria-label={t("common.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Meter
        value={row.progress}
        tone={row.isOverBudget ? "danger" : "default"}
        label={row.plan.name}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <span className="tabular-nums">
          <span className="font-semibold">
            {formatMoney(row.actual, currency)}
          </span>
          <span className="text-muted-foreground">
            {" "}
            {t("finance.plans.of")} {formatMoney(row.planned, currency)}
          </span>
        </span>
        <span
          className={
            row.isOverBudget
              ? "text-xs font-medium text-[#d03b3b]"
              : "text-xs text-muted-foreground"
          }
        >
          {isLimit && remaining < 0
            ? t("finance.plans.over", {
                amount: formatMoney(String(Math.abs(remaining)), currency),
              })
            : row.isAchieved
              ? t("finance.plans.achieved")
              : t("finance.plans.left", {
                  amount: formatMoney(String(Math.max(0, remaining)), currency),
                })}
        </span>
      </div>

      {row.rateMissing && (
        <p className="text-xs text-amber-700">
          {t("finance.plans.rateMissing")}
        </p>
      )}
    </div>
  );
}

export default function PlansTab({
  baseCurrency,
  onBaseCurrencyChange,
}: {
  baseCurrency: string;
  onBaseCurrencyChange: (currency: string) => void;
}) {
  const { t } = useTranslation();
  const [window, setWindow] = useState<Window>("month");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FinancePlan | null>(null);

  const bounds = useMemo(() => windowBounds(window), [window]);
  const { data, isLoading, isFetching, refetch } = useGetPlanProgressQuery({
    ...bounds,
    baseCurrency: baseCurrency || undefined,
  });
  const [deletePlan] = useDeletePlanMutation();

  const grouped = useMemo(() => {
    const map = new Map<FinancePlanKind, PlanProgress[]>();
    for (const row of data ?? []) {
      map.set(row.plan.kind, [...(map.get(row.plan.kind) ?? []), row]);
    }
    return map;
  }, [data]);

  const removePlan = async (id: string) => {
    if (!globalThis.confirm(t("finance.plans.deleteConfirm"))) return;
    try {
      await deletePlan(id).unwrap();
      toast.info(t("finance.plans.deleted"));
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? t("finance.plans.deleteError"));
    }
  };

  const openEdit = (plan: FinancePlan) => {
    setEditing(plan);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="grid w-full grid-cols-2 items-end gap-3 sm:flex sm:w-auto sm:flex-wrap">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("finance.plans.window")}</Label>
            <select
              value={window}
              onChange={(e) => setWindow(e.target.value as Window)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10 sm:w-auto"
            >
              <option value="month">{t("finance.plans.thisMonth")}</option>
              <option value="quarter">{t("finance.plans.thisQuarter")}</option>
              <option value="year">{t("finance.plans.thisYear")}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("finance.baseCurrency")}</Label>
            <select
              value={baseCurrency}
              onChange={(e) => onBaseCurrencyChange(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10 sm:w-auto"
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
          <Button
            size="sm"
            className="min-h-[40px]"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4 text-white" />
            {t("finance.plans.add")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[40px]"
            onClick={() => refetch()}
            aria-label={t("common.refresh")}
          >
            <RefreshCw className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{t("common.refresh")}</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t("finance.loading")}</span>
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-12 text-center">
            <AlertTriangle
              className="mx-auto h-8 w-8 text-muted-foreground"
              aria-hidden
            />
            <p className="text-sm text-muted-foreground">
              {t("finance.plans.empty")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            isFetching ? "grid gap-6 opacity-60 transition-opacity" : "grid gap-6"
          }
        >
          {GROUP_ORDER.map((kind) => {
            const rows = grouped.get(kind) ?? [];
            if (rows.length === 0) return null;
            const overspent = rows.filter((r) => r.isOverBudget).length;
            const done = rows.filter((r) => r.isAchieved).length;

            return (
              <Card key={kind}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm font-medium">
                      {t(`finance.plans.group${kind}`)}
                    </CardTitle>
                    {overspent > 0 ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-[#d03b3b]">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                        {overspent}
                      </span>
                    ) : done > 0 ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-[#006300]">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        {done}
                      </span>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="divide-y divide-border/60 p-0">
                  {rows.map((row) => (
                    <PlanRow
                      key={row.plan.id}
                      row={row}
                      currency={baseCurrency || row.plan.currency}
                      onEdit={openEdit}
                      onDelete={removePlan}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {formOpen && (
        <PlanFormModal
          plan={editing}
          baseCurrency={baseCurrency}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
