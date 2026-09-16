import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney, CHART_INK, OTHER_SLICE_COLOR } from "@/lib/finance-utils";

export function ChartCard({
  title,
  description,
  isLoading,
  isEmpty,
  emptyLabel,
  action,
  children,
}: {
  title: string;
  description?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyLabel: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1 text-xs">
                {description}
              </CardDescription>
            )}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{t("finance.loading")}</span>
          </div>
        ) : isEmpty ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export type ShareRow = {
  id: string;
  /** Null for the "uncategorized" bucket, which has no record filter to drill into. */
  filterId: string | null;
  name: string;
  color: string;
  total: string;
  percentage: number;
  currency: string;
};

/**
 * Part-to-whole as a horizontal stacked bar plus a ranked list. The list is the
 * table view the palette's low-contrast slots require, and it reads far better
 * than a donut legend on a phone.
 */
export function ShareBreakdown({
  rows,
  maxSlices,
  totalLabel,
  total,
  currency,
  onSelect,
}: {
  rows: ShareRow[];
  maxSlices: number;
  totalLabel: string;
  total: string;
  currency: string;
  /** Given, each row becomes a button that drills into the records behind it. */
  onSelect?: (row: { id: string | null; name: string }) => void;
}) {
  const { t } = useTranslation();

  const head = rows.slice(0, maxSlices);
  const tail = rows.slice(maxSlices);
  const tailTotal = tail.reduce((sum, row) => sum + parseFloat(row.total), 0);
  const tailPercent = tail.reduce((sum, row) => sum + row.percentage, 0);

  const slices: ShareRow[] = tail.length
    ? [
        ...head,
        {
          id: "__other__",
          filterId: null,
          name: t("finance.flow.otherCategories", { count: tail.length }),
          color: OTHER_SLICE_COLOR,
          total: String(tailTotal),
          percentage: Math.round(tailPercent * 100) / 100,
          currency,
        },
      ]
    : head;

  return (
    <div className="space-y-4">
      <div
        className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full"
        role="img"
        aria-label={`${totalLabel}: ${formatMoney(total, currency)}`}
      >
        {slices.map((slice) => (
          <span
            key={slice.id}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${Math.max(slice.percentage, 0.5)}%`,
              backgroundColor: slice.color,
            }}
          />
        ))}
      </div>

      <ul className="space-y-1">
        {slices.map((slice) => {
          const drillable =
            Boolean(onSelect) && slice.id !== "__other__";
          const body = (
            <>
              <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden
                />
                <span className="truncate text-sm">{slice.name}</span>
              </span>
              <span className="flex flex-shrink-0 items-center gap-2 pl-5 sm:pl-0">
                <span className="text-sm font-medium tabular-nums">
                  {formatMoney(slice.total, currency)}
                </span>
                <span className="w-11 text-right text-sm tabular-nums text-muted-foreground">
                  {slice.percentage}%
                </span>
                {drillable && (
                  <ChevronRight
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden
                  />
                )}
              </span>
            </>
          );

          return (
            <li key={slice.id}>
              {drillable ? (
                <button
                  type="button"
                  onClick={() =>
                    onSelect?.({ id: slice.filterId, name: slice.name })
                  }
                  title={t("finance.flow.drillDown")}
                  className="flex min-h-[44px] w-full flex-col items-start justify-center gap-0.5 rounded-md px-1 py-1 text-left hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-0"
                >
                  {body}
                </button>
              ) : (
                <div className="flex min-h-[44px] flex-col items-start justify-center gap-0.5 rounded-md px-1 py-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-0">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between border-t pt-3 text-sm font-semibold">
        <span>{totalLabel}</span>
        <span className="tabular-nums">{formatMoney(total, currency)}</span>
      </div>
    </div>
  );
}

/** A single ratio against a limit reads as a meter, never as a two-slice pie. */
export function Meter({
  value,
  tone = "default",
  label,
}: {
  value: number;
  tone?: "default" | "danger";
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span
        className="block h-full rounded-full transition-[width]"
        style={{
          width: `${clamped}%`,
          backgroundColor:
            tone === "danger" ? CHART_INK.liability : CHART_INK.netWorth,
        }}
      />
    </div>
  );
}

export function TooltipShell({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; color?: string }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{title}</p>
      <ul className="mt-1 space-y-0.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-sm">
            {row.color && (
              <span
                className="h-0.5 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
                aria-hidden
              />
            )}
            <span className="font-semibold tabular-nums">{row.value}</span>
            <span className="text-xs text-muted-foreground">{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
