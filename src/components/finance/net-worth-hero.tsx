import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type {
  BalancesResponse,
  NetWorthHistoryResponse,
} from "@/services/types";
import {
  CHART_INK,
  formatMoney,
  formatMoneyCompact,
  formatMonth,
} from "@/lib/finance-utils";

function DeltaBadge({
  change,
  changePercent,
  currency,
}: {
  change: string;
  changePercent: number | null;
  currency: string;
}) {
  const { t } = useTranslation();
  const value = parseFloat(change);
  const flat = Math.abs(value) < 0.005;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  const tone = flat
    ? "text-muted-foreground"
    : value > 0
      ? "text-[#006300]"
      : "text-[#d03b3b]";

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${tone}`}>
      <Icon className="h-4 w-4" aria-hidden />
      <span>
        {value > 0 ? "+" : ""}
        {formatMoney(change, currency)}
      </span>
      {changePercent !== null && !flat && (
        <span className="text-muted-foreground">
          ({changePercent > 0 ? "+" : ""}
          {changePercent}%)
        </span>
      )}
      <span className="sr-only">{t("finance.accounts.overWindow")}</span>
    </span>
  );
}

/**
 * The one number the page leads with, plus the trend behind it. A hero figure
 * rather than a chart: a single current value is not a one-bar bar chart.
 */
export default function NetWorthHero({
  balances,
  history,
  baseCurrency,
  windowStart,
}: {
  balances: BalancesResponse;
  history: NetWorthHistoryResponse | undefined;
  baseCurrency: string;
  /** Set when the trend starts at the first account rather than 12 months back. */
  windowStart: string | null;
}) {
  const { t } = useTranslation();

  const series = useMemo(
    () =>
      (history?.points ?? []).map((point) => ({
        label: formatMonth(point.date),
        date: point.date,
        netWorth: parseFloat(point.netWorth),
        assets: parseFloat(point.assets),
        liabilities: parseFloat(point.liabilities),
      })),
    [history],
  );

  const currency = baseCurrency || balances.baseCurrency || "";
  const hasBase = Boolean(currency);

  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-center">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("finance.accounts.netWorth")}
              </p>
              <p className="mt-1 text-4xl sm:text-5xl font-semibold tracking-tight">
                {hasBase
                  ? formatMoneyCompact(balances.netWorth, currency)
                  : t("finance.accounts.pickBase")}
              </p>
              {hasBase && history && (
                <div className="mt-2">
                  <DeltaBadge
                    change={history.change}
                    changePercent={history.changePercent}
                    currency={currency}
                  />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {windowStart
                      ? t("finance.accounts.sinceDate", {
                          date: formatMonth(windowStart),
                        })
                      : t("finance.accounts.last12Months")}
                  </span>
                </div>
              )}
            </div>

            {/* One column on a phone: two 7-figure totals do not fit side by side. */}
            <dl className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              <div className="rounded-lg border border-border/70 px-3 py-2.5">
                <dt className="text-xs font-medium text-muted-foreground">
                  {t("finance.accounts.assets")}
                </dt>
                <dd className="mt-0.5 break-words text-lg font-semibold tabular-nums">
                  {hasBase ? formatMoney(balances.totalAssets, currency) : "—"}
                </dd>
              </div>
              <div className="rounded-lg border border-border/70 px-3 py-2.5">
                <dt className="text-xs font-medium text-muted-foreground">
                  {t("finance.accounts.liabilities")}
                </dt>
                <dd className="mt-0.5 break-words text-lg font-semibold tabular-nums text-[#d03b3b]">
                  {hasBase
                    ? formatMoney(balances.totalLiabilities, currency)
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {series.length > 1 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {t("finance.accounts.trendTitle", { currency })}
              </p>
              <div className="h-[200px] sm:h-[220px] -ml-2 touch-pan-y">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={series}
                    margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="nw-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={CHART_INK.netWorth}
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="100%"
                          stopColor={CHART_INK.netWorth}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke={CHART_INK.grid}
                      strokeDasharray="0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={{ stroke: CHART_INK.axis }}
                      tick={{ fill: CHART_INK.muted, fontSize: 12 }}
                      minTickGap={16}
                    />
                    <YAxis
                      width={56}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: CHART_INK.muted, fontSize: 12 }}
                      tickFormatter={(value: number) =>
                        new Intl.NumberFormat("en-US", {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        }).format(value)
                      }
                    />
                    <Tooltip
                      // A vertical hairline so a finger aims at a month, not a 2px line.
                      cursor={{ stroke: CHART_INK.axis, strokeWidth: 1 }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0]
                          .payload as (typeof series)[number];
                        return (
                          <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-md">
                            <p className="text-xs text-muted-foreground">
                              {label}
                            </p>
                            <p className="mt-0.5 text-base font-semibold tabular-nums">
                              {formatMoney(String(point.netWorth), currency)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                              {t("finance.accounts.assets")}{" "}
                              {formatMoney(String(point.assets), currency)}
                              {point.liabilities > 0 && (
                                <>
                                  {" · "}
                                  {t("finance.accounts.liabilities")}{" "}
                                  {formatMoney(
                                    String(point.liabilities),
                                    currency,
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="netWorth"
                      stroke={CHART_INK.netWorth}
                      strokeWidth={2}
                      fill="url(#nw-fill)"
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "#ffffff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            hasBase && (
              <p className="text-sm text-muted-foreground">
                {t("finance.accounts.trendEmpty")}
              </p>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
