import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal, ModalFooter } from "@/components/ui/modal";
import {
  useGetArticlesQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
  useGetAccountsQuery,
  useGetRecordsQuery,
  useCreateRecordMutation,
  useUpdateRecordMutation,
  useDeleteRecordMutation,
  useGetRatesQuery,
  useCreateRateMutation,
  useUpdateRateMutation,
  useDeleteRateMutation,
  useGetConversionsQuery,
  useCreateConversionMutation,
  useDeleteConversionMutation,
  useGetSummaryQuery,
  useGetExpenseChartQuery,
  useGetIncomeChartQuery,
} from "@/services/api";
import type {
  FinanceArticle,
  FinanceAccount,
  FinanceRecord,
  FinanceArticleKind,
  FinanceRecordType,
  ChartItem,
  CurrencyRate,
  UpdateRateDto,
} from "@/services/types";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Pencil,
  Archive,
  DollarSign,
  PieChart,
  BarChart3,
  Wallet,
  Activity,
  CalendarRange,
  X,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/lib/use-debounce";
import { useTranslation } from "react-i18next";
import {
  formatMoney,
  toAmountString,
  toDateInputValue,
  formatDate,
  getStartOfMonth,
  getEndOfMonth,
  monthsAgo,
  accountColor,
  COMMON_CURRENCIES,
} from "@/lib/finance-utils";
import AccountsTab from "@/components/finance/accounts-tab";
import FlowTab from "@/components/finance/flow-tab";
import type { DrillDown } from "@/components/finance/flow-tab";

// ============ Summary Tab ============
function SummaryTab() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(() => toDateInputValue(getStartOfMonth()));
  const [to, setTo] = useState(() => toDateInputValue(getEndOfMonth()));
  const [baseCurrency, setBaseCurrency] = useState("");

  const { data: summary, isLoading, refetch } = useGetSummaryQuery({
    from: new Date(from).toISOString(),
    to: new Date(to).toISOString(),
    baseCurrency: baseCurrency || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap sm:gap-4">
        <div className="space-y-2">
          <Label>{t("finance.from")}</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("finance.to")}</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <div className="space-y-2">
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10 sm:w-auto"
          >
            <option value="">{t("finance.noCurrency")}</option>
            {COMMON_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          className="col-span-2 sm:col-auto"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {t("common.refresh")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t("finance.loading")}</span>
        </div>
      ) : summary ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                {t("finance.income")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(summary.income).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(summary.income).map(([currency, amount]) => (
                    <div key={currency} className="text-lg font-semibold text-green-600">
                      {formatMoney(amount, currency)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{t("finance.noData")}</p>
              )}
              {summary.incomeBaseCurrency && (
                <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                  {t("finance.totalIn")} {baseCurrency}: {formatMoney(summary.incomeBaseCurrency, baseCurrency)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                {t("finance.expense")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(summary.expense).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(summary.expense).map(([currency, amount]) => (
                    <div key={currency} className="text-lg font-semibold text-red-600">
                      {formatMoney(amount, currency)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{t("finance.noData")}</p>
              )}
              {summary.expenseBaseCurrency && (
                <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                  {t("finance.totalIn")} {baseCurrency}: {formatMoney(summary.expenseBaseCurrency, baseCurrency)}
                </div>
              )}
            </CardContent>
          </Card>

          {summary.netBaseCurrency && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t("finance.netBalance")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    parseFloat(summary.netBaseCurrency) >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatMoney(summary.netBaseCurrency, baseCurrency)}
                </div>
              </CardContent>
            </Card>
          )}

          {summary.conversionFees && Object.entries(summary.conversionFees).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  {t("finance.conversionFees")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(summary.conversionFees).map(([currency, amount]) => (
                    <div key={currency} className="text-sm text-muted-foreground">
                      {formatMoney(amount, currency)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">{t("finance.noData")}</p>
      )}
    </div>
  );
}

// ============ Records Tab ============
function RecordsTab({
  drill,
  onClearDrill,
}: {
  drill: DrillDown | null;
  onClearDrill: () => void;
}) {
  const { t } = useTranslation();
  const recordSchema = useMemo(
    () =>
      z.object({
        type: z.enum(["EXPENSE", "INCOME"]),
        amount: z.string().min(1, t("finance.amountRequired")).regex(/^\d+(\.\d{1,4})?$/, t("finance.invalidAmount")),
        currency: z.string().length(3, t("finance.invalidCurrency")),
        articleId: z.string().optional(),
        accountId: z.string().optional(),
        remark: z.string().max(500).optional(),
        operationDate: z.string().min(1, t("finance.dateRequired")),
      }),
    [t]
  );

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FinanceRecordType | "">("");
  const [accountFilter, setAccountFilter] = useState("");
  const [articleFilter, setArticleFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const limit = 10;

  // A drill-down from a chart arrives as a filter set; adopt it wholesale so the
  // list shows exactly the records behind the number that was tapped.
  useEffect(() => {
    if (!drill) return;
    setTypeFilter(drill.type ?? "");
    setArticleFilter(drill.articleId ?? "");
    setAccountFilter(drill.accountId ?? "");
    setFromDate(drill.from ? toDateInputValue(drill.from) : "");
    setToDate(drill.to ? toDateInputValue(drill.to) : "");
    setSearch("");
    setPage(1);
  }, [drill]);

  const { data, isLoading, isFetching, refetch } = useGetRecordsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    type: typeFilter || undefined,
    accountId: accountFilter || undefined,
    articleId: articleFilter || undefined,
    from: fromDate ? new Date(fromDate).toISOString() : undefined,
    to: toDate ? new Date(`${toDate}T23:59:59.999`).toISOString() : undefined,
    sortBy: "operationDate",
    sortOrder: "desc",
  });

  const { data: articles } = useGetArticlesQuery();
  const { data: accounts } = useGetAccountsQuery();

  const activeFilterCount =
    (typeFilter ? 1 : 0) +
    (accountFilter ? 1 : 0) +
    (articleFilter ? 1 : 0) +
    (fromDate || toDate ? 1 : 0) +
    (search ? 1 : 0);

  const resetFilters = () => {
    setTypeFilter("");
    setAccountFilter("");
    setArticleFilter("");
    setFromDate("");
    setToDate("");
    setSearch("");
    setPage(1);
    onClearDrill();
  };

  const applyRange = (months: number) => {
    setFromDate(toDateInputValue(monthsAgo(months)));
    setToDate(toDateInputValue(new Date().toISOString()));
    setPage(1);
  };
  const [createRecord, { isLoading: isCreating }] = useCreateRecordMutation();
  const [updateRecord, { isLoading: isUpdating }] = useUpdateRecordMutation();
  const [deleteRecord] = useDeleteRecordMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      type: "EXPENSE" as FinanceRecordType,
      amount: "",
      currency: "TMT",
      articleId: "",
      accountId: "",
      remark: "",
      operationDate: toDateInputValue(new Date().toISOString()),
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);

  const selectedType = watch("type");
  const selectedCurrency = watch("currency");
  const filteredArticles = articles?.filter((a) => a.kind === selectedType) ?? [];
  // A record must sit in an account of the same currency, so only offer those.
  const eligibleAccounts =
    accounts?.filter(
      (a) => a.valuationMode === "TRACKED" && a.currency === selectedCurrency,
    ) ?? [];

  const openCreate = () => {
    reset({
      type: "EXPENSE",
      amount: "",
      currency: "TMT",
      articleId: "",
      accountId: "",
      remark: "",
      operationDate: toDateInputValue(new Date().toISOString()),
    });
    setCreateOpen(true);
  };

  const closeCreate = () => {
    reset();
    setCreateOpen(false);
  };

  const onSubmit = async (values: z.infer<typeof recordSchema>) => {
    try {
      await createRecord({
        type: values.type,
        amount: toAmountString(parseFloat(values.amount)),
        currency: values.currency.toUpperCase(),
        articleId: values.articleId || undefined,
        accountId: values.accountId || undefined,
        remark: values.remark || undefined,
        operationDate: new Date(values.operationDate).toISOString(),
      }).unwrap();
      toast.success(t("finance.recordCreated"));
      closeCreate();
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("finance.recordCreateError"));
    }
  };

  const openEdit = (record: FinanceRecord) => {
    setEditingRecord(record);
  };

  const closeEdit = () => {
    setEditingRecord(null);
  };

  const saveEdit = async (values: Partial<FinanceRecord>) => {
    if (!editingRecord) return;
    try {
      await updateRecord({
        id: editingRecord.id,
        data: {
          type: values.type as FinanceRecordType,
          amount: values.amount,
          currency: values.currency,
          articleId: values.articleId ?? undefined,
          accountId: values.accountId ?? null,
          remark: values.remark ?? undefined,
          operationDate: values.operationDate,
        },
      }).unwrap();
      toast.success(t("finance.recordUpdated"));
      closeEdit();
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("finance.recordUpdateError"));
    }
  };

  const removeRecord = async (id: string) => {
    try {
      await deleteRecord(id).unwrap();
      toast.info(t("finance.recordDeleted"));
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("finance.recordDeleteError"));
    }
  };

  const records = data?.results ?? [];
  const hasPrev = Boolean(data?.previous);
  const hasNext = Boolean(data?.next);

  return (
    <div className="space-y-4">
      {drill && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
          <CalendarRange className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">
            {t("finance.rec.showingFor")}
          </span>
          <span className="font-medium">{drill.label}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto min-h-[36px]"
            onClick={resetFilters}
          >
            <X className="mr-1 h-4 w-4" />
            {t("finance.rec.clearFilters")}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] sm:max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
              inputMode="search"
              placeholder={t("finance.rec.searchPlaceholder")}
            />
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">
            <Button size="sm" onClick={openCreate} className="min-h-[40px]">
              <Plus className="mr-1 h-4 w-4 text-white" />
              {t("finance.addRecord")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="min-h-[40px]"
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              {t("common.refresh")}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {t("finance.rec.searchHint")}
        </p>

        {/* Filters sit in one row above the list they scope. */}
        <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("finance.type")}</Label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as FinanceRecordType | "");
                setPage(1);
              }}
              className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10 sm:w-auto"
            >
              <option value="">{t("finance.allTypes")}</option>
              <option value="INCOME">{t("finance.income")}</option>
              <option value="EXPENSE">{t("finance.expense")}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("finance.account")}</Label>
            <select
              value={accountFilter}
              onChange={(e) => {
                setAccountFilter(e.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10 sm:max-w-[180px]"
            >
              <option value="">{t("finance.rec.allAccounts")}</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("finance.category")}</Label>
            <select
              value={articleFilter}
              onChange={(e) => {
                setArticleFilter(e.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10 sm:max-w-[180px]"
            >
              <option value="">{t("finance.rec.allCategories")}</option>
              {articles?.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("finance.from")}</Label>
            <Input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("finance.to")}</Label>
            <Input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-40"
            />
          </div>

          <div className="col-span-2 sm:col-auto flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[40px] flex-1 sm:flex-none"
              onClick={() => {
                setFromDate(toDateInputValue(getStartOfMonth()));
                setToDate(toDateInputValue(getEndOfMonth()));
                setPage(1);
              }}
            >
              {t("finance.rec.thisMonth")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[40px]"
              onClick={() => applyRange(2)}
            >
              {t("finance.flow.last3")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[40px]"
              onClick={() => applyRange(11)}
            >
              {t("finance.flow.last12")}
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[40px]"
                onClick={resetFilters}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                {t("finance.rec.clearFilters")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {(isLoading || isFetching) && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t("finance.loading")}</span>
        </div>
      )}

      <div className="grid gap-3">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 rounded-lg border border-border/70 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={`p-1.5 rounded-full flex-shrink-0 ${
                    record.type === "INCOME" ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {record.type === "INCOME" ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <span
                  className={`font-semibold ${
                    record.type === "INCOME" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {record.type === "INCOME" ? "+" : "-"}
                  {formatMoney(record.amount, record.currency)}
                </span>
                {record.article && (
                  <span
                    className="px-2 py-0.5 text-xs rounded-full"
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
                  <span className="flex items-center gap-1.5 rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted-foreground">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: accountColor(
                          record.account.color,
                          record.account.kind,
                        ),
                      }}
                      aria-hidden
                    />
                    {record.account.name}
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                    {t("finance.rec.unassigned")}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(record.operationDate)}
                {record.remark && ` · ${record.remark}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-11 w-11 flex-shrink-0 p-0 sm:h-9 sm:w-9"
                onClick={() => openEdit(record)}
                aria-label={t("common.edit")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-11 w-11 flex-shrink-0 p-0 sm:h-9 sm:w-9"
                onClick={() => removeRecord(record.id)}
                aria-label={t("common.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {records.length === 0 && !isLoading && (
          <p className="text-muted-foreground text-sm">{t("finance.noRecords")}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          {t("common.pageOf", {
            current: data?.current_page ?? 1,
            total: data?.total_pages ?? 1,
          })}{" "}
          · {t("common.total", { count: data?.count ?? 0 })}
        </div>
        <div className="flex items-center gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!hasPrev || isFetching}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("common.prev")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || isFetching}
          >
            {t("common.next")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Create Record Modal */}
      {createOpen && (
        <Modal
          title={t("finance.newRecord")}
          description={t("finance.newRecordDesc")}
          onClose={closeCreate}
        >
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("finance.type")}</Label>
                <select
                  {...register("type")}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="EXPENSE">{t("finance.expense")}</option>
                  <option value="INCOME">{t("finance.income")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("finance.currency")}</Label>
                <select
                  {...register("currency")}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              <Label>{t("finance.amount")}</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("amount")}
                disabled={isCreating}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("finance.category")}</Label>
              <select
                {...register("articleId")}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              <Label>{t("finance.account")}</Label>
              <select
                {...register("accountId")}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                  ? t("finance.rec.noAccountForCurrency", {
                      currency: selectedCurrency,
                    })
                  : t("finance.rec.accountHint")}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t("finance.date")}</Label>
              <Input type="date" {...register("operationDate")} disabled={isCreating} />
              {errors.operationDate && (
                <p className="text-sm text-red-500">{errors.operationDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("finance.remark")}</Label>
              <Input placeholder={t("finance.remarkPlaceholder")} {...register("remark")} disabled={isCreating} />
            </div>
            <ModalFooter>
              <Button variant="outline" type="button" onClick={closeCreate} disabled={isCreating}>
                {t("common.close")}
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* Edit Record Modal */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          articles={articles ?? []}
          accounts={accounts ?? []}
          onClose={closeEdit}
          onSave={saveEdit}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
}

function EditRecordModal({
  record,
  articles,
  accounts,
  onClose,
  onSave,
  isUpdating,
}: {
  record: FinanceRecord;
  articles: FinanceArticle[];
  accounts: FinanceAccount[];
  onClose: () => void;
  onSave: (values: Partial<FinanceRecord>) => void;
  isUpdating: boolean;
}) {
  const { t } = useTranslation();
  const [type, setType] = useState<FinanceRecordType>(record.type);
  const [amount, setAmount] = useState(record.amount);
  const [currency, setCurrency] = useState(record.currency);
  const [articleId, setArticleId] = useState(record.articleId ?? "");
  const [accountId, setAccountId] = useState(record.accountId ?? "");
  const [remark, setRemark] = useState(record.remark ?? "");
  const [operationDate, setOperationDate] = useState(toDateInputValue(record.operationDate));

  const filteredArticles = articles.filter((a) => a.kind === type);
  const eligibleAccounts = useMemo(
    () =>
      accounts.filter(
        (a) => a.valuationMode === "TRACKED" && a.currency === currency,
      ),
    [accounts, currency],
  );

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
  };

  const handleSave = () => {
    onSave({
      type,
      amount: toAmountString(parseFloat(amount)),
      currency: currency.toUpperCase(),
      articleId: articleId || undefined,
      accountId: accountId || null,
      remark: remark || undefined,
      operationDate: new Date(operationDate).toISOString(),
    });
  };

  return (
    <Modal
      title={t("finance.editRecord")}
      description={t("finance.editRecordDesc")}
      onClose={onClose}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t("finance.type")}</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FinanceRecordType)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="EXPENSE">{t("finance.expense")}</option>
              <option value="INCOME">{t("finance.income")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>{t("finance.currency")}</Label>
            <select
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
          <Label>{t("finance.amount")}</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("finance.category")}</Label>
          <select
            value={articleId}
            onChange={(e) => setArticleId(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
          <Label>{t("finance.account")}</Label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t("finance.rec.noAccount")}</option>
            {eligibleAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>{t("finance.date")}</Label>
          <Input
            type="date"
            value={operationDate}
            onChange={(e) => setOperationDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("finance.remark")}</Label>
          <Input
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder={t("finance.remarkPlaceholder")}
          />
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            {t("common.close")}
          </Button>
          <Button onClick={handleSave} disabled={isUpdating || !amount}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

function EditCategoryModal({
  article,
  onClose,
  onSave,
  isUpdating,
}: {
  article: FinanceArticle;
  onClose: () => void;
  onSave: (values: {
    name: string;
    color: string;
    isArchived: boolean;
  }) => void;
  isUpdating: boolean;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(article.name);
  const [color, setColor] = useState(article.color ?? "#94a3b8");
  const [isArchived, setIsArchived] = useState(article.isArchived);

  return (
    <Modal
      title={t("finance.cats.editTitle")}
      description={
        article.kind === "INCOME" ? t("finance.income") : t("finance.expense")
      }
      onClose={onClose}
    >
      <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">{t("finance.name")}</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-color">{t("finance.color")}</Label>
            <Input
              id="cat-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-20"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isArchived}
              onChange={(e) => setIsArchived(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            {t("finance.cats.archivedFlag")}
          </label>

        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => onSave({ name, color, isArchived })}
            disabled={isUpdating || !name.trim()}
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

// ============ Categories Tab ============
function CategoriesTab() {
  const { t } = useTranslation();
  const articleSchema = useMemo(
    () =>
      z.object({
        kind: z.enum(["EXPENSE", "INCOME"]),
        name: z.string().min(1, t("finance.nameRequired")).max(100),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal("")),
      }),
    [t]
  );

  const [kindFilter, setKindFilter] = useState<FinanceArticleKind | "">("");
  const [showAll, setShowAll] = useState(false);
  const { data: articles, isLoading, refetch } = useGetArticlesQuery({
    kind: kindFilter || undefined,
    includeArchived: showAll,
  });
  const [createArticle, { isLoading: isCreating }] = useCreateArticleMutation();
  const [updateArticle, { isLoading: isUpdating }] = useUpdateArticleMutation();
  const [deleteArticle] = useDeleteArticleMutation();
  const [editing, setEditing] = useState<FinanceArticle | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      kind: "EXPENSE" as FinanceArticleKind,
      name: "",
      color: "",
    },
  });

  const [createOpen, setCreateOpen] = useState(false);

  const openCreate = () => {
    reset({ kind: "EXPENSE", name: "", color: "" });
    setCreateOpen(true);
  };

  const closeCreate = () => {
    reset();
    setCreateOpen(false);
  };

  const onSubmit = async (values: z.infer<typeof articleSchema>) => {
    try {
      await createArticle({
        kind: values.kind,
        name: values.name,
        color: values.color || undefined,
      }).unwrap();
      toast.success(t("finance.categoryCreated"));
      closeCreate();
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("finance.categoryCreateError"));
    }
  };

  const removeArticle = async (id: string) => {
    try {
      const result = await deleteArticle(id).unwrap();
      toast.info(
        result.isArchived
          ? t("finance.cats.archivedToast")
          : t("finance.categoryDeleted"),
      );
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("finance.categoryDeleteError"));
    }
  };

  const saveEdit = async (values: {
    name: string;
    color: string;
    isArchived: boolean;
  }) => {
    if (!editing) return;
    try {
      await updateArticle({
        id: editing.id,
        data: {
          name: values.name,
          color: values.color || undefined,
          isArchived: values.isArchived,
        },
      }).unwrap();
      toast.success(t("finance.cats.updated"));
      setEditing(null);
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? t("finance.cats.updateError"));
    }
  };

  const restoreArticle = async (article: FinanceArticle) => {
    try {
      await updateArticle({
        id: article.id,
        data: { isArchived: false },
      }).unwrap();
      toast.success(t("finance.cats.restored"));
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? t("finance.cats.updateError"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as FinanceArticleKind | "")}
            className="h-11 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10 sm:flex-none"
          >
            <option value="">{t("finance.allKinds")}</option>
            <option value="INCOME">{t("finance.income")}</option>
            <option value="EXPENSE">{t("finance.expense")}</option>
          </select>
          <label className="flex min-h-[40px] items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            {t("finance.cats.showAll")}
          </label>
        </div>
        <div className="flex items-center gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1 text-white" />
            {t("finance.addCategory")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {t("common.refresh")}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t("finance.loading")}</span>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {articles?.map((article) => (
          <div
            key={article.id}
            className={`flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-white px-4 py-3 shadow-sm ${
              article.isArchived ? "opacity-60" : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="h-4 w-4 flex-shrink-0 rounded-full"
                style={{ backgroundColor: article.color || "#94a3b8" }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{article.name}</span>
                  {article.isArchived && (
                    <span className="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {t("finance.cats.archived")}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {article.kind === "INCOME" ? t("finance.income") : t("finance.expense")}
                </div>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[40px] min-w-[40px] px-2"
                onClick={() => setEditing(article)}
                title={t("common.edit")}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">{t("common.edit")}</span>
              </Button>
              {article.isArchived ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[40px] min-w-[40px] px-2"
                  onClick={() => restoreArticle(article)}
                  title={t("finance.cats.restore")}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="sr-only">{t("finance.cats.restore")}</span>
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  className="min-h-[40px] min-w-[40px] px-2"
                  onClick={() => removeArticle(article.id)}
                  title={t("finance.cats.archive")}
                >
                  <Archive className="h-4 w-4" />
                  <span className="sr-only">{t("finance.cats.archive")}</span>
                </Button>
              )}
            </div>
          </div>
        ))}
        {(!articles || articles.length === 0) && !isLoading && (
          <p className="text-muted-foreground text-sm col-span-full">{t("finance.noCategories")}</p>
        )}
      </div>

      {editing && (
        <EditCategoryModal
          article={editing}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
          isUpdating={isUpdating}
        />
      )}

      {/* Create Category Modal */}
      {createOpen && (
        <Modal
          title={t("finance.newCategory")}
          description={t("finance.newCategoryDesc")}
          onClose={closeCreate}
        >
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label>{t("finance.kind")}</Label>
              <select
                {...register("kind")}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="EXPENSE">{t("finance.expense")}</option>
                <option value="INCOME">{t("finance.income")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("finance.name")}</Label>
              <Input placeholder={t("finance.categoryNamePlaceholder")} {...register("name")} disabled={isCreating} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("finance.color")}</Label>
              <Input type="color" {...register("color")} disabled={isCreating} className="h-10 w-20" />
            </div>
            <ModalFooter>
              <Button variant="outline" type="button" onClick={closeCreate} disabled={isCreating}>
                {t("common.close")}
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
}

function EditRateModal({
  rate,
  onClose,
  onSave,
  isUpdating,
}: {
  rate: CurrencyRate;
  onClose: () => void;
  onSave: (values: UpdateRateDto) => void;
  isUpdating: boolean;
}) {
  const { t } = useTranslation();
  const [baseCurrency, setBaseCurrency] = useState(rate.baseCurrency);
  const [quoteCurrency, setQuoteCurrency] = useState(rate.quoteCurrency);
  const [value, setValue] = useState(rate.rate);
  const [source, setSource] = useState(rate.source ?? "");
  const [effectiveAt, setEffectiveAt] = useState(
    toDateInputValue(rate.effectiveAt),
  );

  // Mirrors the API contract: a positive decimal, up to 8 places.
  const valid = /^\d+(\.\d{1,8})?$/.test(value) && parseFloat(value) > 0;

  return (
    <Modal
      title={t("finance.rates.editTitle")}
      description={t("finance.rates.editDesc")}
      onClose={onClose}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="rate-base">{t("finance.baseCurrency")}</Label>
            <select
              id="rate-base"
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10"
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate-quote">{t("finance.quoteCurrency")}</Label>
            <select
              id="rate-quote"
              value={quoteCurrency}
              onChange={(e) => setQuoteCurrency(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10"
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
          <Label htmlFor="rate-value">{t("finance.rate")}</Label>
          <Input
            id="rate-value"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          {!valid && value.length > 0 && (
            <p className="text-sm text-red-500">{t("finance.invalidRate")}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate-date">{t("finance.effectiveDate")}</Label>
          <Input
            id="rate-date"
            type="date"
            value={effectiveAt}
            onChange={(e) => setEffectiveAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate-source">{t("finance.rates.source")}</Label>
          <Input
            id="rate-source"
            value={source}
            placeholder={t("finance.rates.sourcePlaceholder")}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() =>
              onSave({
                baseCurrency,
                quoteCurrency,
                rate: value,
                source: source.trim() || undefined,
                effectiveAt: new Date(effectiveAt).toISOString(),
              })
            }
            disabled={isUpdating || !valid || !effectiveAt}
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

// ============ Conversions Tab ============
function ConversionsTab() {
  const { t } = useTranslation();
  const rateSchema = useMemo(
    () =>
      z.object({
        baseCurrency: z.string().length(3, t("finance.invalidCurrency")),
        quoteCurrency: z.string().length(3, t("finance.invalidCurrency")),
        rate: z.string().min(1, t("finance.rateRequired")).regex(/^\d+(\.\d+)?$/, t("finance.invalidRate")),
        effectiveAt: z.string().min(1, t("finance.dateRequired")),
      }),
    [t]
  );

  const conversionSchema = useMemo(
    () =>
      z.object({
        fromAmount: z.string().min(1, t("finance.amountRequired")).regex(/^\d+(\.\d{1,8})?$/, t("finance.invalidAmount")),
        fromCurrency: z.string().regex(/^[A-Za-z0-9]{2,10}$/, t("finance.invalidCurrency")),
        toCurrency: z.string().regex(/^[A-Za-z0-9]{2,10}$/, t("finance.invalidCurrency")),
        fromAccountId: z.string().optional(),
        toAccountId: z.string().optional(),
        operationDate: z.string().min(1, t("finance.dateRequired")),
        remark: z.string().max(500).optional(),
      }),
    [t]
  );

  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: conversionsData, isLoading, isFetching, refetch } = useGetConversionsQuery({ page, limit });
  const { data: rates } = useGetRatesQuery();
  const { data: accounts } = useGetAccountsQuery();
  const [createRate, { isLoading: isCreatingRate }] = useCreateRateMutation();
  const [updateRate, { isLoading: isUpdatingRate }] = useUpdateRateMutation();
  const [deleteRate] = useDeleteRateMutation();
  const [createConversion, { isLoading: isCreatingConversion }] = useCreateConversionMutation();
  const [deleteConversion] = useDeleteConversionMutation();

  const [rateOpen, setRateOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<CurrencyRate | null>(null);
  const [conversionOpen, setConversionOpen] = useState(false);

  const saveRate = async (values: UpdateRateDto) => {
    if (!editingRate) return;
    try {
      await updateRate({ id: editingRate.id, data: values }).unwrap();
      toast.success(t("finance.rates.updated"));
      setEditingRate(null);
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? t("finance.rates.updateError"));
    }
  };

  const removeRate = async (id: string) => {
    if (!window.confirm(t("finance.rates.deleteConfirm"))) return;
    try {
      await deleteRate(id).unwrap();
      toast.info(t("finance.rates.deleted"));
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? t("finance.rates.deleteError"));
    }
  };

  const rateForm = useForm({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      baseCurrency: "USD",
      quoteCurrency: "TMT",
      rate: "",
      effectiveAt: toDateInputValue(new Date().toISOString()),
    },
  });

  const conversionForm = useForm({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      fromAmount: "",
      fromCurrency: "USD",
      toCurrency: "TMT",
      fromAccountId: "",
      toAccountId: "",
      operationDate: toDateInputValue(new Date().toISOString()),
      remark: "",
    },
  });

  const watchedFromCurrency = conversionForm.watch("fromCurrency");
  const watchedToCurrency = conversionForm.watch("toCurrency");
  // Same currency on both legs is a plain transfer and needs no FX rate.
  const sameCurrency = watchedFromCurrency === watchedToCurrency;
  const trackedAccounts =
    accounts?.filter((a) => a.valuationMode === "TRACKED") ?? [];
  const fromAccounts = trackedAccounts.filter(
    (a) => a.currency === watchedFromCurrency,
  );
  const toAccounts = trackedAccounts.filter(
    (a) => a.currency === watchedToCurrency,
  );

  const onSubmitRate = async (values: z.infer<typeof rateSchema>) => {
    try {
      await createRate({
        baseCurrency: values.baseCurrency.toUpperCase(),
        quoteCurrency: values.quoteCurrency.toUpperCase(),
        rate: values.rate,
        effectiveAt: new Date(values.effectiveAt).toISOString(),
      }).unwrap();
      toast.success(t("finance.rateCreated"));
      setRateOpen(false);
      rateForm.reset();
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("finance.rateCreateError"));
    }
  };

  const onSubmitConversion = async (values: z.infer<typeof conversionSchema>) => {
    try {
      await createConversion({
        fromAmount: toAmountString(parseFloat(values.fromAmount)),
        fromCurrency: values.fromCurrency.toUpperCase(),
        toCurrency: values.toCurrency.toUpperCase(),
        fromAccountId: values.fromAccountId || undefined,
        toAccountId: values.toAccountId || undefined,
        operationDate: new Date(values.operationDate).toISOString(),
        remark: values.remark || undefined,
      }).unwrap();
      toast.success(t("finance.conversionCreated"));
      setConversionOpen(false);
      conversionForm.reset();
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("finance.conversionCreateError"));
    }
  };

  const removeConversion = async (id: string) => {
    try {
      await deleteConversion(id).unwrap();
      toast.info(t("finance.conversionDeleted"));
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("finance.conversionDeleteError"));
    }
  };

  const conversions = conversionsData?.results ?? [];
  const hasPrev = Boolean(conversionsData?.previous);
  const hasNext = Boolean(conversionsData?.next);

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Button size="sm" onClick={() => setRateOpen(true)}>
          <Plus className="h-4 w-4 mr-1 text-white" />
          {t("finance.addRate")}
        </Button>
        <Button size="sm" onClick={() => setConversionOpen(true)}>
          <ArrowRightLeft className="h-4 w-4 mr-1 text-white" />
          {t("finance.convertCurrency")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="col-span-2 sm:col-auto"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {t("common.refresh")}
        </Button>
      </div>

      {/* Recent Rates */}
      <div>
        <h4 className="mb-2 text-sm font-medium">{t("finance.recentRates")}</h4>
        {!rates || rates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("finance.rates.empty")}
          </p>
        ) : (
          <div className="grid gap-2">
            {rates.slice(0, 5).map((rate) => (
              <div
                key={rate.id}
                className="flex items-center justify-between gap-3 rounded-md bg-slate-100 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-medium tabular-nums">
                    {rate.baseCurrency}/{rate.quoteCurrency}: {rate.rate}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({formatDate(rate.effectiveAt)}
                    {rate.source ? ` · ${rate.source}` : ""})
                  </span>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 w-11 flex-shrink-0 p-0 sm:h-9 sm:w-9"
                    onClick={() => setEditingRate(rate)}
                    aria-label={t("common.edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-11 w-11 flex-shrink-0 p-0 sm:h-9 sm:w-9"
                    onClick={() => removeRate(rate.id)}
                    aria-label={t("common.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversions List */}
      <div>
        <h4 className="text-sm font-medium mb-2">{t("finance.conversionHistory")}</h4>
        {(isLoading || isFetching) && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("finance.loading")}</span>
          </div>
        )}
        <div className="grid gap-3">
          {conversions.map((conv) => (
            <div
              key={conv.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex min-w-0 items-start gap-3">
                <ArrowRightLeft className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="break-words font-medium">
                    {formatMoney(conv.fromAmount, conv.fromCurrency)} → {formatMoney(conv.toAmount, conv.toCurrency)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("finance.rate")}: {conv.rateUsed} · {formatDate(conv.operationDate)}
                    {conv.remark && ` · ${conv.remark}`}
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="h-11 w-11 flex-shrink-0 p-0 sm:h-9 sm:w-9"
                onClick={() => removeConversion(conv.id)}
                aria-label={t("common.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {conversions.length === 0 && !isLoading && (
            <p className="text-muted-foreground text-sm">{t("finance.noConversions")}</p>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            {t("common.pageOf", {
              current: conversionsData?.current_page ?? 1,
              total: conversionsData?.total_pages ?? 1,
            })}{" "}
            · {t("common.total", { count: conversionsData?.count ?? 0 })}
          </div>
          <div className="flex items-center gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrev || isFetching}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("common.prev")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext || isFetching}
            >
              {t("common.next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add Rate Modal */}
      {rateOpen && (
        <Modal
          title={t("finance.newRate")}
          description={t("finance.newRateDesc")}
          onClose={() => setRateOpen(false)}
        >
          <form className="space-y-3" onSubmit={rateForm.handleSubmit(onSubmitRate)}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("finance.baseCurrency")}</Label>
                <select
                  {...rateForm.register("baseCurrency")}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("finance.quoteCurrency")}</Label>
                <select
                  {...rateForm.register("quoteCurrency")}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              <Label>{t("finance.rate")}</Label>
              <Input
                type="number"
                step="0.000001"
                placeholder="1.0000"
                {...rateForm.register("rate")}
                disabled={isCreatingRate}
              />
              {rateForm.formState.errors.rate && (
                <p className="text-sm text-red-500">{rateForm.formState.errors.rate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("finance.effectiveDate")}</Label>
              <Input type="date" {...rateForm.register("effectiveAt")} disabled={isCreatingRate} />
            </div>
            <ModalFooter>
              <Button variant="outline" type="button" onClick={() => setRateOpen(false)} disabled={isCreatingRate}>
                {t("common.close")}
              </Button>
              <Button type="submit" disabled={isCreatingRate}>
                {isCreatingRate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* Edit Rate Modal */}
      {editingRate && (
        <EditRateModal
          rate={editingRate}
          onClose={() => setEditingRate(null)}
          onSave={saveRate}
          isUpdating={isUpdatingRate}
        />
      )}

      {/* Convert Currency Modal */}
      {conversionOpen && (
        <Modal
          title={t("finance.convertCurrency")}
          description={t("finance.convertDesc")}
          onClose={() => setConversionOpen(false)}
        >
          <form className="space-y-3" onSubmit={conversionForm.handleSubmit(onSubmitConversion)}>
            <div className="space-y-2">
              <Label>{t("finance.fromAmount")}</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="100.00"
                {...conversionForm.register("fromAmount")}
                disabled={isCreatingConversion}
              />
              {conversionForm.formState.errors.fromAmount && (
                <p className="text-sm text-red-500">{conversionForm.formState.errors.fromAmount.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("finance.fromCurrency")}</Label>
                <select
                  {...conversionForm.register("fromCurrency")}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("finance.toCurrency")}</Label>
                <select
                  {...conversionForm.register("toCurrency")}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("finance.transfers.fromAccount")}</Label>
                <select
                  {...conversionForm.register("fromAccountId")}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">{t("finance.transfers.noAccount")}</option>
                  {fromAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("finance.transfers.toAccount")}</Label>
                <select
                  {...conversionForm.register("toAccountId")}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">{t("finance.transfers.noAccount")}</option>
                  {toAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("finance.transfers.accountsHint")}
            </p>
            <div className="space-y-2">
              <Label>{t("finance.date")}</Label>
              <Input type="date" {...conversionForm.register("operationDate")} disabled={isCreatingConversion} />
            </div>
            <div className="space-y-2">
              <Label>{t("finance.remark")}</Label>
              <Input placeholder={t("finance.remarkPlaceholder")} {...conversionForm.register("remark")} disabled={isCreatingConversion} />
            </div>
            <ModalFooter>
              <Button variant="outline" type="button" onClick={() => setConversionOpen(false)} disabled={isCreatingConversion}>
                {t("common.close")}
              </Button>
              <Button type="submit" disabled={isCreatingConversion}>
                {isCreatingConversion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {sameCurrency ? t("finance.transfers.transfer") : t("finance.convert")}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============ Charts Tab ============

function ChartPieCard({
  title,
  items,
  total,
  isLoading,
  noDataLabel,
}: {
  title: string;
  items: ChartItem[] | undefined;
  total: Record<string, string> | undefined;
  isLoading: boolean;
  noDataLabel: string;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("finance.loading")}</span>
          </div>
        ) : !items || items.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            {noDataLabel}
          </p>
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={items}
                  dataKey="value"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                >
                  {items.map((item, index) => (
                    <Cell key={index} fill={item.categoryColor} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    formatMoney(String(value ?? 0), items[0]?.currency ?? ""),
                    name,
                  ]}
                />
              </RechartsPieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.categoryColor }}
                    />
                    <span className="truncate">{item.categoryName}</span>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3 text-right">
                    <span className="font-medium tabular-nums">
                      {formatMoney(item.total, item.currency)}
                    </span>
                    <span className="text-muted-foreground w-14 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {total && (
              <div className="mt-3 pt-3 border-t">
                {Object.entries(total).map(([currency, amount]) => (
                  <div
                    key={currency}
                    className="flex justify-between text-sm font-semibold"
                  >
                    <span>{t("finance.total")}</span>
                    <span>{formatMoney(amount, currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartsTab() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(() => toDateInputValue(getStartOfMonth()));
  const [to, setTo] = useState(() => toDateInputValue(getEndOfMonth()));
  const [baseCurrency, setBaseCurrency] = useState("USD");

  const chartParams = {
    from: new Date(from).toISOString(),
    to: new Date(to).toISOString(),
    baseCurrency: baseCurrency || undefined,
  };

  const {
    data: expenseChart,
    isLoading: expenseLoading,
    refetch: refetchExpense,
  } = useGetExpenseChartQuery(chartParams);

  const {
    data: incomeChart,
    isLoading: incomeLoading,
    refetch: refetchIncome,
  } = useGetIncomeChartQuery(chartParams);

  const expenseItems = expenseChart?.items.map((item) => ({
    ...item,
    value: parseFloat(item.total),
  }));

  const incomeItems = incomeChart?.items.map((item) => ({
    ...item,
    value: parseFloat(item.total),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap sm:gap-4">
        <div className="space-y-2">
          <Label>{t("finance.from")}</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("finance.to")}</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <div className="space-y-2">
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10 sm:w-auto"
          >
            <option value="">{t("finance.noCurrency")}</option>
            {COMMON_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          className="col-span-2 sm:col-auto"
          onClick={() => {
            refetchExpense();
            refetchIncome();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {t("common.refresh")}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartPieCard
          title={t("finance.expensesByCategory")}
          items={expenseItems}
          total={expenseChart?.total}
          isLoading={expenseLoading}
          noDataLabel={t("finance.noChartData")}
        />
        <ChartPieCard
          title={t("finance.incomeByCategory")}
          items={incomeItems}
          total={incomeChart?.total}
          isLoading={incomeLoading}
          noDataLabel={t("finance.noChartData")}
        />
      </div>
    </div>
  );
}

// ============ Main Finance Page ============
export default function FinancePage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("accounts");
  const [drill, setDrill] = useState<DrillDown | null>(null);

  // One base currency for the whole page, remembered between visits so the
  // totals do not reset to "pick a currency" every time.
  const [baseCurrency, setBaseCurrency] = useState(
    () => localStorage.getItem("finance.baseCurrency") ?? "TMT",
  );

  const changeBaseCurrency = (currency: string) => {
    setBaseCurrency(currency);
    localStorage.setItem("finance.baseCurrency", currency);
  };

  /** Any chart can hand us a filter set; we switch to the records behind it. */
  const drillInto = (next: DrillDown) => {
    setDrill(next);
    setTab("records");
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            {t("finance.title")}
          </CardTitle>
          <CardDescription>{t("finance.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            {/* A phone scrolls the strip sideways with the labels intact; seven
                unlabelled icons on two squashed rows told nobody anything. */}
            <TabsList className="no-scrollbar mb-6 flex w-full justify-start gap-1 overflow-x-auto sm:grid sm:grid-cols-7">
              <TabsTrigger value="accounts" className="flex-shrink-0">
                <Wallet className="mr-1.5 h-4 w-4 flex-shrink-0" />
                {t("finance.accounts.tab")}
              </TabsTrigger>
              <TabsTrigger value="flow" className="flex-shrink-0">
                <Activity className="mr-1.5 h-4 w-4 flex-shrink-0" />
                {t("finance.flow.tab")}
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex-shrink-0">
                <PieChart className="mr-1.5 h-4 w-4 flex-shrink-0" />
                {t("finance.summary")}
              </TabsTrigger>
              <TabsTrigger value="charts" className="flex-shrink-0">
                <BarChart3 className="mr-1.5 h-4 w-4 flex-shrink-0" />
                {t("finance.charts")}
              </TabsTrigger>
              <TabsTrigger value="records" className="flex-shrink-0">
                <DollarSign className="mr-1.5 h-4 w-4 flex-shrink-0" />
                {t("finance.records")}
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex-shrink-0">
                <Archive className="mr-1.5 h-4 w-4 flex-shrink-0" />
                {t("finance.categories")}
              </TabsTrigger>
              <TabsTrigger value="conversions" className="flex-shrink-0">
                <ArrowRightLeft className="mr-1.5 h-4 w-4 flex-shrink-0" />
                {t("finance.conversions")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="accounts">
              <AccountsTab
                baseCurrency={baseCurrency}
                onBaseCurrencyChange={changeBaseCurrency}
                onDrillDown={(account) =>
                  drillInto({ accountId: account.id, label: account.name })
                }
              />
            </TabsContent>
            <TabsContent value="flow">
              <FlowTab
                baseCurrency={baseCurrency}
                onBaseCurrencyChange={changeBaseCurrency}
                onDrillDown={drillInto}
              />
            </TabsContent>
            <TabsContent value="summary">
              <SummaryTab />
            </TabsContent>
            <TabsContent value="charts">
              <ChartsTab />
            </TabsContent>
            <TabsContent value="records">
              <RecordsTab drill={drill} onClearDrill={() => setDrill(null)} />
            </TabsContent>
            <TabsContent value="categories">
              <CategoriesTab />
            </TabsContent>
            <TabsContent value="conversions">
              <ConversionsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
