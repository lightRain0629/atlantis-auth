import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetTransactionsQuery,
  useGetArticlesQuery,
  useGetAccountsQuery,
  useCreateRecordMutation,
  useUpdateRecordMutation,
  useDeleteRecordMutation,
  useDeleteConversionMutation,
} from "@/services/api";
import type {
  CurrencyConversion,
  FinanceRecord,
  TransactionKind,
} from "@/services/types";
import {
  getEndOfMonth,
  getStartOfMonth,
  monthsAgo,
  toDateInputValue,
} from "@/lib/finance-utils";
import { useDebouncedValue } from "@/lib/use-debounce";
import RecordFormModal, { type RecordFormValues } from "./record-form-modal";
import TransferModal from "./transfer-modal";
import { RecordRow, TransferRow } from "./transaction-rows";
import type { DrillDown } from "./flow-tab";

const SELECT =
  "h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10";

const KIND_TABS: Array<{ value: TransactionKind | ""; label: string }> = [
  { value: "", label: "finance.allTypes" },
  { value: "INCOME", label: "finance.income" },
  { value: "EXPENSE", label: "finance.expense" },
  { value: "TRANSFER", label: "finance.transfers.tab" },
];

/**
 * One timeline of everything that moved money: expenses, incomes and transfers
 * together, in date order. Transfers used to land in a separate tab, so making
 * one from here meant it vanished from the list you were looking at.
 */
export default function RecordsTab({
  drill,
  baseCurrency,
  onClearDrill,
}: {
  drill: DrillDown | null;
  baseCurrency: string;
  onClearDrill: () => void;
}) {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<TransactionKind | "">("");
  const [accountFilter, setAccountFilter] = useState("");
  const [articleFilter, setArticleFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const limit = 10;

  // A drill-down from a chart arrives as a filter set; adopt it wholesale so the
  // list shows exactly the entries behind the number that was tapped. Adjusted
  // during render rather than in an effect: an effect would paint the old
  // filters first and then cascade a second render over the top.
  // Starts null, not at `drill`: the tab mounts fresh when a chart drills into
  // it, and seeding from the prop would swallow the very filter set it arrived
  // with.
  const [appliedDrill, setAppliedDrill] = useState<DrillDown | null>(null);
  if (drill !== appliedDrill) {
    setAppliedDrill(drill);
    if (drill) {
      setKind(drill.type ?? "");
      setArticleFilter(drill.articleId ?? "");
      setAccountFilter(drill.accountId ?? "");
      setFromDate(drill.from ? toDateInputValue(drill.from) : "");
      setToDate(drill.to ? toDateInputValue(drill.to) : "");
      setSearch("");
      setPage(1);
    }
  }

  const { data, isLoading, isFetching, refetch } = useGetTransactionsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    kind: kind || undefined,
    accountId: accountFilter || undefined,
    articleId: articleFilter || undefined,
    from: fromDate ? new Date(fromDate).toISOString() : undefined,
    to: toDate ? new Date(`${toDate}T23:59:59.999`).toISOString() : undefined,
    sortOrder: "desc",
  });

  const { data: articles } = useGetArticlesQuery();
  const { data: accounts } = useGetAccountsQuery({ includeArchived: true });

  const [createRecord, { isLoading: isCreating }] = useCreateRecordMutation();
  const [updateRecord, { isLoading: isUpdating }] = useUpdateRecordMutation();
  const [deleteRecord] = useDeleteRecordMutation();
  const [deleteConversion] = useDeleteConversionMutation();

  const [recordFormOpen, setRecordFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] =
    useState<CurrencyConversion | null>(null);

  // Filtering by category has no transfers to show, so the filter and the tab
  // would contradict each other; the tab wins and clears the category.
  const selectKind = (next: TransactionKind | "") => {
    setKind(next);
    if (next === "TRANSFER") setArticleFilter("");
    setPage(1);
  };

  const activeFilterCount =
    (kind ? 1 : 0) +
    (accountFilter ? 1 : 0) +
    (articleFilter ? 1 : 0) +
    (fromDate || toDate ? 1 : 0) +
    (search ? 1 : 0);

  const resetFilters = () => {
    setKind("");
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

  const closeRecordForm = () => {
    setRecordFormOpen(false);
    setEditingRecord(null);
  };

  const saveRecord = async (values: RecordFormValues) => {
    try {
      if (editingRecord) {
        await updateRecord({
          id: editingRecord.id,
          data: {
            type: values.type,
            amount: values.amount,
            currency: values.currency,
            articleId: values.articleId,
            accountId: values.accountId,
            // null clears the note; undefined would leave the old one in place.
            remark: values.remark,
            operationDate: values.operationDate,
            baseCurrency: values.baseCurrency,
            baseRate: values.baseRate,
          },
        }).unwrap();
        toast.success(t("finance.recordUpdated"));
      } else {
        await createRecord({
          type: values.type,
          amount: values.amount,
          currency: values.currency,
          articleId: values.articleId ?? undefined,
          accountId: values.accountId ?? undefined,
          remark: values.remark ?? undefined,
          operationDate: values.operationDate,
          baseCurrency: values.baseCurrency ?? undefined,
          baseRate: values.baseRate ?? undefined,
        }).unwrap();
        toast.success(t("finance.recordCreated"));
      }
      closeRecordForm();
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(
        message ??
          t(
            editingRecord
              ? "finance.recordUpdateError"
              : "finance.recordCreateError",
          ),
      );
    }
  };

  const removeRecord = async (id: string) => {
    if (!window.confirm(t("finance.rec.deleteConfirm"))) return;
    try {
      await deleteRecord(id).unwrap();
      toast.info(t("finance.recordDeleted"));
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? t("finance.recordDeleteError"));
    }
  };

  const removeTransfer = async (id: string) => {
    if (!window.confirm(t("finance.transfers.deleteConfirm"))) return;
    try {
      await deleteConversion(id).unwrap();
      toast.info(t("finance.transfers.deleted"));
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? t("finance.transfers.deleteError"));
    }
  };

  const entries = data?.results ?? [];
  const hasPrev = Boolean(data?.previous);
  const hasNext = Boolean(data?.next);
  const accountList = useMemo(() => accounts ?? [], [accounts]);

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
          <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
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
            <Button
              size="sm"
              onClick={() => {
                setEditingRecord(null);
                setRecordFormOpen(true);
              }}
              className="min-h-[40px]"
            >
              <Plus className="mr-1 h-4 w-4 text-white" />
              {t("finance.addRecord")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingTransfer(null);
                setTransferOpen(true);
              }}
              className="min-h-[40px]"
            >
              <ArrowRightLeft className="mr-1 h-4 w-4" />
              {t("finance.transfers.openButton")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="min-h-[40px]"
              aria-label={t("common.refresh")}
            >
              <RefreshCw className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t("common.refresh")}</span>
            </Button>
          </div>
        </div>

        {/* The kind lives above the list as a segmented control rather than in
            the filter row: it is the one people reach for constantly. */}
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          {KIND_TABS.map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => selectKind(option.value)}
              className={`min-h-[40px] flex-shrink-0 rounded-md border px-3 text-sm font-medium transition-colors ${
                kind === option.value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-border/70 bg-background hover:bg-muted"
              }`}
            >
              {t(option.label)}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {t("finance.rec.searchHint")}
        </p>

        {/* Filters sit in one row above the list they scope. */}
        <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("finance.account")}</Label>
            <select
              value={accountFilter}
              onChange={(e) => {
                setAccountFilter(e.target.value);
                setPage(1);
              }}
              className={`${SELECT} sm:w-auto sm:max-w-[180px]`}
            >
              <option value="">{t("finance.rec.allAccounts")}</option>
              {accountList.map((account) => (
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
                // A category filter cannot match a transfer, so showing the
                // transfers tab alongside it would guarantee an empty list.
                if (e.target.value && kind === "TRANSFER") setKind("");
                setPage(1);
              }}
              className={`${SELECT} sm:w-auto sm:max-w-[180px]`}
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

          <div className="col-span-2 flex flex-wrap gap-2 sm:col-auto">
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
        {entries.map((entry) =>
          entry.kind === "TRANSFER" ? (
            <TransferRow
              key={`transfer-${entry.id}`}
              transfer={entry.transfer}
              accounts={accountList}
              onEdit={() => {
                setEditingTransfer(entry.transfer);
                setTransferOpen(true);
              }}
              onDelete={() => removeTransfer(entry.id)}
            />
          ) : (
            <RecordRow
              key={`record-${entry.id}`}
              record={entry.record}
              baseCurrency={baseCurrency}
              onEdit={() => {
                setEditingRecord(entry.record);
                setRecordFormOpen(true);
              }}
              onDelete={() => removeRecord(entry.id)}
            />
          ),
        )}
        {entries.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground">
            {t("finance.noRecords")}
          </p>
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
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("common.prev")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || isFetching}
          >
            {t("common.next")}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {recordFormOpen && (
        <RecordFormModal
          record={editingRecord ?? undefined}
          articles={articles ?? []}
          accounts={accountList}
          baseCurrency={baseCurrency}
          isSaving={isCreating || isUpdating}
          onSave={saveRecord}
          onClose={closeRecordForm}
        />
      )}

      {transferOpen && (
        <TransferModal
          accounts={accountList}
          transfer={editingTransfer ?? undefined}
          onClose={() => {
            setTransferOpen(false);
            setEditingTransfer(null);
          }}
        />
      )}
    </div>
  );
}
