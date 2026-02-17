import { useMemo, useState } from "react";
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
import {
  useGetArticlesQuery,
  useCreateArticleMutation,
  useDeleteArticleMutation,
  useGetRecordsQuery,
  useCreateRecordMutation,
  useUpdateRecordMutation,
  useDeleteRecordMutation,
  useGetRatesQuery,
  useCreateRateMutation,
  useGetConversionsQuery,
  useCreateConversionMutation,
  useDeleteConversionMutation,
  useGetSummaryQuery,
  useGetExpenseChartQuery,
  useGetIncomeChartQuery,
} from "@/services/api";
import type {
  FinanceArticle,
  FinanceRecord,
  FinanceArticleKind,
  FinanceRecordType,
  ChartItem,
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
  COMMON_CURRENCIES,
} from "@/lib/finance-utils";

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
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>{t("finance.from")}</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("finance.to")}</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("finance.baseCurrency")}</Label>
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t("finance.noCurrency")}</option>
            {COMMON_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
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
function RecordsTab() {
  const { t } = useTranslation();
  const recordSchema = useMemo(
    () =>
      z.object({
        type: z.enum(["EXPENSE", "INCOME"]),
        amount: z.string().min(1, t("finance.amountRequired")).regex(/^\d+(\.\d{1,4})?$/, t("finance.invalidAmount")),
        currency: z.string().length(3, t("finance.invalidCurrency")),
        articleId: z.string().optional(),
        remark: z.string().max(500).optional(),
        operationDate: z.string().min(1, t("finance.dateRequired")),
      }),
    [t]
  );

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FinanceRecordType | "">("");
  const debouncedSearch = useDebouncedValue(search);
  const limit = 10;

  const { data, isLoading, isFetching, refetch } = useGetRecordsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    type: typeFilter || undefined,
    sortBy: "operationDate",
    sortOrder: "desc",
  });

  const { data: articles } = useGetArticlesQuery();
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
      currency: "USD",
      articleId: "",
      remark: "",
      operationDate: toDateInputValue(new Date().toISOString()),
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);

  const selectedType = watch("type");
  const filteredArticles = articles?.filter((a) => a.kind === selectedType) ?? [];

  const openCreate = () => {
    reset({
      type: "EXPENSE",
      amount: "",
      currency: "USD",
      articleId: "",
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 w-48"
              placeholder={t("finance.searchRecords")}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as FinanceRecordType | "");
              setPage(1);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t("finance.allTypes")}</option>
            <option value="INCOME">{t("finance.income")}</option>
            <option value="EXPENSE">{t("finance.expense")}</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1 text-white" />
            {t("finance.addRecord")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {t("common.refresh")}
          </Button>
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
              <div className="flex items-center gap-2">
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
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(record.operationDate)}
                {record.remark && ` · ${record.remark}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => openEdit(record)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => removeRecord(record.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {records.length === 0 && !isLoading && (
          <p className="text-muted-foreground text-sm">{t("finance.noRecords")}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {t("common.pageOf", {
            current: data?.current_page ?? 1,
            total: data?.total_pages ?? 1,
          })}{" "}
          · {t("common.total", { count: data?.count ?? 0 })}
        </div>
        <div className="flex items-center gap-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-lg font-semibold">{t("finance.newRecord")}</h3>
                <p className="text-sm text-muted-foreground">{t("finance.newRecordDesc")}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={closeCreate} disabled={isCreating}>
                {t("common.cancel")}
              </Button>
            </div>
            <form className="space-y-3 px-4 py-4" onSubmit={handleSubmit(onSubmit)}>
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
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={closeCreate} disabled={isCreating}>
                  {t("common.close")}
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          articles={articles ?? []}
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
  onClose,
  onSave,
  isUpdating,
}: {
  record: FinanceRecord;
  articles: FinanceArticle[];
  onClose: () => void;
  onSave: (values: Partial<FinanceRecord>) => void;
  isUpdating: boolean;
}) {
  const { t } = useTranslation();
  const [type, setType] = useState<FinanceRecordType>(record.type);
  const [amount, setAmount] = useState(record.amount);
  const [currency, setCurrency] = useState(record.currency);
  const [articleId, setArticleId] = useState(record.articleId ?? "");
  const [remark, setRemark] = useState(record.remark ?? "");
  const [operationDate, setOperationDate] = useState(toDateInputValue(record.operationDate));

  const filteredArticles = articles.filter((a) => a.kind === type);

  const handleSave = () => {
    onSave({
      type,
      amount: toAmountString(parseFloat(amount)),
      currency: currency.toUpperCase(),
      articleId: articleId || undefined,
      remark: remark || undefined,
      operationDate: new Date(operationDate).toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="text-lg font-semibold">{t("finance.editRecord")}</h3>
            <p className="text-sm text-muted-foreground">{t("finance.editRecordDesc")}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isUpdating}>
            {t("common.cancel")}
          </Button>
        </div>
        <div className="space-y-3 px-4 py-4">
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
                onChange={(e) => setCurrency(e.target.value)}
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
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isUpdating}>
              {t("common.close")}
            </Button>
            <Button onClick={handleSave} disabled={isUpdating || !amount}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
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
  const { data: articles, isLoading, refetch } = useGetArticlesQuery({
    kind: kindFilter || undefined,
    includeArchived: false,
  });
  const [createArticle, { isLoading: isCreating }] = useCreateArticleMutation();
  const [deleteArticle] = useDeleteArticleMutation();

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
      await deleteArticle(id).unwrap();
      toast.info(t("finance.categoryDeleted"));
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("finance.categoryDeleteError"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as FinanceArticleKind | "")}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t("finance.allKinds")}</option>
            <option value="INCOME">{t("finance.income")}</option>
            <option value="EXPENSE">{t("finance.expense")}</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
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
            className="flex items-center justify-between rounded-lg border border-border/70 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: article.color || "#94a3b8" }}
              />
              <div>
                <div className="font-medium">{article.name}</div>
                <div className="text-xs text-muted-foreground">
                  {article.kind === "INCOME" ? t("finance.income") : t("finance.expense")}
                </div>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => removeArticle(article.id)}>
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {(!articles || articles.length === 0) && !isLoading && (
          <p className="text-muted-foreground text-sm col-span-full">{t("finance.noCategories")}</p>
        )}
      </div>

      {/* Create Category Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-lg font-semibold">{t("finance.newCategory")}</h3>
                <p className="text-sm text-muted-foreground">{t("finance.newCategoryDesc")}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={closeCreate} disabled={isCreating}>
                {t("common.cancel")}
              </Button>
            </div>
            <form className="space-y-3 px-4 py-4" onSubmit={handleSubmit(onSubmit)}>
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
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={closeCreate} disabled={isCreating}>
                  {t("common.close")}
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
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
        fromAmount: z.string().min(1, t("finance.amountRequired")).regex(/^\d+(\.\d{1,4})?$/, t("finance.invalidAmount")),
        fromCurrency: z.string().length(3, t("finance.invalidCurrency")),
        toCurrency: z.string().length(3, t("finance.invalidCurrency")),
        operationDate: z.string().min(1, t("finance.dateRequired")),
        remark: z.string().max(500).optional(),
      }),
    [t]
  );

  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: conversionsData, isLoading, isFetching, refetch } = useGetConversionsQuery({ page, limit });
  const { data: rates } = useGetRatesQuery();
  const [createRate, { isLoading: isCreatingRate }] = useCreateRateMutation();
  const [createConversion, { isLoading: isCreatingConversion }] = useCreateConversionMutation();
  const [deleteConversion] = useDeleteConversionMutation();

  const [rateOpen, setRateOpen] = useState(false);
  const [conversionOpen, setConversionOpen] = useState(false);

  const rateForm = useForm({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      baseCurrency: "USD",
      quoteCurrency: "EUR",
      rate: "",
      effectiveAt: toDateInputValue(new Date().toISOString()),
    },
  });

  const conversionForm = useForm({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      fromAmount: "",
      fromCurrency: "USD",
      toCurrency: "EUR",
      operationDate: toDateInputValue(new Date().toISOString()),
      remark: "",
    },
  });

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
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setRateOpen(true)}>
          <Plus className="h-4 w-4 mr-1 text-white" />
          {t("finance.addRate")}
        </Button>
        <Button size="sm" onClick={() => setConversionOpen(true)}>
          <ArrowRightLeft className="h-4 w-4 mr-1 text-white" />
          {t("finance.convertCurrency")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          {t("common.refresh")}
        </Button>
      </div>

      {/* Recent Rates */}
      {rates && rates.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">{t("finance.recentRates")}</h4>
          <div className="flex flex-wrap gap-2">
            {rates.slice(0, 5).map((rate) => (
              <div
                key={rate.id}
                className="px-3 py-1.5 rounded-md bg-slate-100 text-sm"
              >
                {rate.baseCurrency}/{rate.quoteCurrency}: {rate.rate}
                <span className="text-xs text-muted-foreground ml-2">
                  ({formatDate(rate.effectiveAt)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              className="flex items-center justify-between rounded-lg border border-border/70 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {formatMoney(conv.fromAmount, conv.fromCurrency)} → {formatMoney(conv.toAmount, conv.toCurrency)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("finance.rate")}: {conv.rateUsed} · {formatDate(conv.operationDate)}
                    {conv.remark && ` · ${conv.remark}`}
                  </div>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={() => removeConversion(conv.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {conversions.length === 0 && !isLoading && (
            <p className="text-muted-foreground text-sm">{t("finance.noConversions")}</p>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
          <div>
            {t("common.pageOf", {
              current: conversionsData?.current_page ?? 1,
              total: conversionsData?.total_pages ?? 1,
            })}{" "}
            · {t("common.total", { count: conversionsData?.count ?? 0 })}
          </div>
          <div className="flex items-center gap-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-lg font-semibold">{t("finance.newRate")}</h3>
                <p className="text-sm text-muted-foreground">{t("finance.newRateDesc")}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setRateOpen(false)} disabled={isCreatingRate}>
                {t("common.cancel")}
              </Button>
            </div>
            <form className="space-y-3 px-4 py-4" onSubmit={rateForm.handleSubmit(onSubmitRate)}>
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
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setRateOpen(false)} disabled={isCreatingRate}>
                  {t("common.close")}
                </Button>
                <Button type="submit" disabled={isCreatingRate}>
                  {isCreatingRate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Currency Modal */}
      {conversionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-lg font-semibold">{t("finance.convertCurrency")}</h3>
                <p className="text-sm text-muted-foreground">{t("finance.convertDesc")}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setConversionOpen(false)} disabled={isCreatingConversion}>
                {t("common.cancel")}
              </Button>
            </div>
            <form className="space-y-3 px-4 py-4" onSubmit={conversionForm.handleSubmit(onSubmitConversion)}>
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
              <div className="space-y-2">
                <Label>{t("finance.date")}</Label>
                <Input type="date" {...conversionForm.register("operationDate")} disabled={isCreatingConversion} />
              </div>
              <div className="space-y-2">
                <Label>{t("finance.remark")}</Label>
                <Input placeholder={t("finance.remarkPlaceholder")} {...conversionForm.register("remark")} disabled={isCreatingConversion} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setConversionOpen(false)} disabled={isCreatingConversion}>
                  {t("common.close")}
                </Button>
                <Button type="submit" disabled={isCreatingConversion}>
                  {isCreatingConversion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("finance.convert")}
                </Button>
              </div>
            </form>
          </div>
        </div>
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
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.categoryColor }}
                    />
                    <span className="truncate">{item.categoryName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="font-medium">
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
  const [baseCurrency, setBaseCurrency] = useState("");

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
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>{t("finance.from")}</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("finance.to")}</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("finance.baseCurrency")}</Label>
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="summary">
                <PieChart className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("finance.summary")}</span>
              </TabsTrigger>
              <TabsTrigger value="charts">
                <BarChart3 className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("finance.charts")}</span>
              </TabsTrigger>
              <TabsTrigger value="records">
                <DollarSign className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("finance.records")}</span>
              </TabsTrigger>
              <TabsTrigger value="categories">
                <Archive className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("finance.categories")}</span>
              </TabsTrigger>
              <TabsTrigger value="conversions">
                <ArrowRightLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("finance.conversions")}</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
              <SummaryTab />
            </TabsContent>
            <TabsContent value="charts">
              <ChartsTab />
            </TabsContent>
            <TabsContent value="records">
              <RecordsTab />
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
