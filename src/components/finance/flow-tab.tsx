import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  RefreshCw,
  TrendingDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetCashflowQuery } from "@/services/api";
import type { CashflowInterval, FlowLeg } from "@/services/types";
import {
  CHART_INK,
  COMMON_CURRENCIES,
  MAX_CHART_SLICES,
  formatMoney,
  formatMoneyCompact,
  monthsAgo,
  toDateInputValue,
} from "@/lib/finance-utils";
import { useIsMobile } from "@/lib/use-media-query";
import { ChartCard, ShareBreakdown, TooltipShell } from "./chart-parts";
import type { ShareRow } from "./chart-parts";

const compact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof ArrowUpRight;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-[#006300]"
      : tone === "negative"
        ? "text-[#d03b3b]"
        : "";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${toneClass}`}>
          {value}
        </p>
        {hint && (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

function toShareRows(legs: FlowLeg[], currency: string): ShareRow[] {
  return legs.map((leg, index) => ({
    id: leg.id ?? `${leg.name}-${index}`,
    filterId: leg.id,
    name: leg.name,
    color: leg.color,
    total: leg.total,
    percentage: leg.percentage,
    currency,
  }));
}

export type DrillDown = {
  articleId?: string;
  accountId?: string;
  type?: "INCOME" | "EXPENSE";
  from?: string;
  to?: string;
  label: string;
};

export default function FlowTab({
  baseCurrency,
  onBaseCurrencyChange,
  onDrillDown,
}: {
  baseCurrency: string;
  onBaseCurrencyChange: (currency: string) => void;
  onDrillDown: (drill: DrillDown) => void;
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [from, setFrom] = useState(() => toDateInputValue(monthsAgo(5)));
  const [to, setTo] = useState(() =>
    toDateInputValue(new Date().toISOString()),
  );
  const [interval, setInterval] = useState<CashflowInterval>("month");

  const currency = baseCurrency || "USD";

  const { data, isLoading, isFetching, refetch } = useGetCashflowQuery({
    from: new Date(from).toISOString(),
    to: new Date(to).toISOString(),
    interval,
    baseCurrency: currency,
  });

  const series = useMemo(
    () =>
      (data?.points ?? []).map((point, index, all) => {
        const next = all[index + 1];
        const end = next
          ? new Date(new Date(next.date).getTime() - 1)
          : new Date(to);
        return {
          label: point.label,
          income: parseFloat(point.income),
          // Expenses plot downward so the baseline separates in from out.
          expense: -parseFloat(point.expense),
          net: parseFloat(point.net),
          from: point.date,
          to: end.toISOString(),
        };
      }),
    [data, to],
  );

  const presets: { label: string; months: number }[] = [
    { label: t("finance.flow.last3"), months: 2 },
    { label: t("finance.flow.last6"), months: 5 },
    { label: t("finance.flow.last12"), months: 11 },
  ];

  return (
    <div className="space-y-6">
      {/* Filters live in one row above everything they scope. */}
      <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
        <div className="col-span-2 sm:col-auto flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="min-h-[40px] flex-1 sm:flex-none"
              onClick={() => {
                setFrom(toDateInputValue(monthsAgo(preset.months)));
                setTo(toDateInputValue(new Date().toISOString()));
                setInterval("month");
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("finance.from")}</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("finance.to")}</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("finance.flow.groupBy")}</Label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as CashflowInterval)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10 sm:w-auto"
          >
            <option value="day">{t("finance.flow.byDay")}</option>
            <option value="week">{t("finance.flow.byWeek")}</option>
            <option value="month">{t("finance.flow.byMonth")}</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("finance.baseCurrency")}</Label>
          <select
            value={currency}
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
        <Button
          variant="outline"
          size="sm"
          className="col-span-2 sm:col-auto min-h-[40px]"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {t("common.refresh")}
        </Button>
      </div>

      {data && data.missingRates.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-start gap-3 py-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <span className="text-amber-900">
              {t("finance.accounts.missingRatesBody", {
                pairs: data.missingRates
                  .map((r) => `${r.from}/${r.to}`)
                  .join(", "),
              })}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Refetch keeps the frame: dim rather than swap in a skeleton. */}
      <div
        className={
          isFetching && !isLoading ? "opacity-60 transition-opacity" : undefined
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={t("finance.flow.moneyIn")}
            value={
              data ? formatMoneyCompact(data.totalIncome, currency) : "—"
            }
            icon={ArrowDownLeft}
            tone="positive"
          />
          <StatTile
            label={t("finance.flow.moneyOut")}
            value={
              data ? formatMoneyCompact(data.totalExpense, currency) : "—"
            }
            hint={
              data
                ? t("finance.flow.perPeriod", {
                    amount: formatMoney(data.averageExpense, currency),
                  })
                : undefined
            }
            icon={ArrowUpRight}
            tone="negative"
          />
          <StatTile
            label={t("finance.flow.netFlow")}
            value={data ? formatMoneyCompact(data.netFlow, currency) : "—"}
            icon={TrendingDown}
            tone={
              data && parseFloat(data.netFlow) >= 0 ? "positive" : "negative"
            }
          />
          <StatTile
            label={t("finance.flow.savingsRate")}
            value={
              data?.savingsRate !== null && data?.savingsRate !== undefined
                ? `${data.savingsRate}%`
                : "—"
            }
            hint={t("finance.flow.savingsRateHint")}
            icon={PiggyBank}
            tone={
              data?.savingsRate != null && data.savingsRate >= 0
                ? "positive"
                : "negative"
            }
          />
        </div>

        <div className="mt-6 grid min-w-0 gap-6">
          <ChartCard
            title={t("finance.flow.inOutTitle")}
            description={t("finance.flow.inOutDescription", { currency })}
            isLoading={isLoading}
            isEmpty={series.length === 0}
            emptyLabel={t("finance.noData")}
          >
            <div className="h-[280px] sm:h-[320px] touch-pan-y">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={series}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                  barGap={2}
                  onClick={(state) => {
                    const index = state?.activeTooltipIndex;
                    const point =
                      typeof index === "number" ? series[index] : undefined;
                    if (!point) return;
                    onDrillDown({
                      from: point.from,
                      to: point.to,
                      label: point.label,
                    });
                  }}
                >
                  <CartesianGrid
                    stroke={CHART_INK.grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: CHART_INK.axis }}
                    tick={{ fill: CHART_INK.muted, fontSize: 12 }}
                    minTickGap={12}
                  />
                  <YAxis
                    width={isMobile ? 40 : 56}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: CHART_INK.muted, fontSize: 12 }}
                    tickFormatter={(value: number) => compact(Math.abs(value))}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(11,11,11,0.04)" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0]
                        .payload as (typeof series)[number];
                      return (
                        <TooltipShell
                          title={String(label)}
                          rows={[
                            {
                              label: t("finance.flow.moneyIn"),
                              value: formatMoney(
                                String(point.income),
                                currency,
                              ),
                              color: CHART_INK.positive,
                            },
                            {
                              label: t("finance.flow.moneyOut"),
                              value: formatMoney(
                                String(Math.abs(point.expense)),
                                currency,
                              ),
                              color: CHART_INK.liability,
                            },
                            {
                              label: t("finance.flow.netFlow"),
                              value: formatMoney(String(point.net), currency),
                              color: CHART_INK.netWorth,
                            },
                          ]}
                        />
                      );
                    }}
                  />
                  <Bar
                    dataKey="income"
                    fill={CHART_INK.positive}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="expense"
                    fill={CHART_INK.liability}
                    radius={[0, 0, 4, 4]}
                    maxBarSize={28}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke={CHART_INK.netWorth}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#ffffff" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
              {[
                { label: t("finance.flow.moneyIn"), color: CHART_INK.positive },
                {
                  label: t("finance.flow.moneyOut"),
                  color: CHART_INK.liability,
                },
                {
                  label: t("finance.flow.netFlow"),
                  color: CHART_INK.netWorth,
                },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: item.color }}
                    aria-hidden
                  />
                  <span className="text-muted-foreground">{item.label}</span>
                </li>
              ))}
            </ul>
          </ChartCard>

          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <ChartCard
              title={t("finance.flow.whereItWent")}
              description={t("finance.flow.byCategory")}
              isLoading={isLoading}
              isEmpty={!data?.expenseByCategory.length}
              emptyLabel={t("finance.noData")}
            >
              {data && (
                <ShareBreakdown
                  rows={toShareRows(data.expenseByCategory, currency)}
                  maxSlices={MAX_CHART_SLICES}
                  totalLabel={t("finance.flow.moneyOut")}
                  total={data.totalExpense}
                  currency={currency}
                  onSelect={(row) =>
                    onDrillDown({
                      articleId: row.id ?? undefined,
                      type: "EXPENSE",
                      from: new Date(from).toISOString(),
                      to: new Date(to).toISOString(),
                      label: row.name,
                    })
                  }
                />
              )}
            </ChartCard>

            <ChartCard
              title={t("finance.flow.whereItCameFrom")}
              description={t("finance.flow.byCategory")}
              isLoading={isLoading}
              isEmpty={!data?.incomeByCategory.length}
              emptyLabel={t("finance.noData")}
            >
              {data && (
                <ShareBreakdown
                  rows={toShareRows(data.incomeByCategory, currency)}
                  maxSlices={MAX_CHART_SLICES}
                  totalLabel={t("finance.flow.moneyIn")}
                  total={data.totalIncome}
                  currency={currency}
                  onSelect={(row) =>
                    onDrillDown({
                      articleId: row.id ?? undefined,
                      type: "INCOME",
                      from: new Date(from).toISOString(),
                      to: new Date(to).toISOString(),
                      label: row.name,
                    })
                  }
                />
              )}
            </ChartCard>
          </div>

          <ChartCard
            title={t("finance.flow.spendByAccount")}
            description={t("finance.flow.spendByAccountHint")}
            isLoading={isLoading}
            isEmpty={!data?.expenseByAccount.length}
            emptyLabel={t("finance.noData")}
          >
            {data && (
              <div className="h-[240px] touch-pan-y">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={data.expenseByAccount.slice(0, 8).map((leg) => ({
                      id: leg.id,
                      name: leg.name,
                      value: parseFloat(leg.total),
                    }))}
                    margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      stroke={CHART_INK.grid}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={{ stroke: CHART_INK.axis }}
                      tick={{ fill: CHART_INK.muted, fontSize: 12 }}
                      tickFormatter={compact}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={isMobile ? 82 : 110}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: CHART_INK.muted, fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(11,11,11,0.04)" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0].payload as {
                          name: string;
                          value: number;
                        };
                        return (
                          <TooltipShell
                            title={point.name}
                            rows={[
                              {
                                label: t("finance.flow.moneyOut"),
                                value: formatMoney(
                                  String(point.value),
                                  currency,
                                ),
                              },
                            ]}
                          />
                        );
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill={CHART_INK.netWorth}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={22}
                      cursor="pointer"
                      onClick={(bar: { payload?: { id: string | null; name: string } }) => {
                        if (!bar.payload?.id) return;
                        onDrillDown({
                          accountId: bar.payload.id,
                          type: "EXPENSE",
                          from: new Date(from).toISOString(),
                          to: new Date(to).toISOString(),
                          label: bar.payload.name,
                        });
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
