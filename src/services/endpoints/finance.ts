import { api } from "../baseApi";
import type { Pagination } from "../types";
import type {
  FinanceArticle,
  CreateArticleDto,
  UpdateArticleDto,
  ListArticlesParams,
  FinanceRecord,
  CreateRecordDto,
  UpdateRecordDto,
  ListRecordsParams,
  CurrencyRate,
  CreateRateDto,
  FinancePlan,
  CreatePlanDto,
  UpdatePlanDto,
  ListPlansParams,
  PlanProgressParams,
  PlanProgress,
  UpdateRateDto,
  ListRatesParams,
  LatestRateParams,
  LatestRateResponse,
  CurrencyConversion,
  CreateConversionDto,
  UpdateConversionDto,
  ListConversionsParams,
  FinanceTransaction,
  ListTransactionsParams,
  SummaryParams,
  SummaryResponse,
  ChartQueryParams,
  ChartResponse,
  FinanceAccount,
  CreateAccountDto,
  UpdateAccountDto,
  ListAccountsParams,
  BalancesParams,
  BalancesResponse,
  NetWorthHistoryParams,
  NetWorthHistoryResponse,
  DebtsResponse,
  AccountValuation,
  CreateValuationDto,
  CashflowParams,
  CashflowResponse,
} from "../types/finance";

export const financeApi = api.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    // ============ Articles ============
    getArticles: builder.query<FinanceArticle[], ListArticlesParams | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.kind) search.set("kind", params.kind);
        if (params?.includeArchived)
          search.set("includeArchived", String(params.includeArchived));
        const qs = search.toString();
        return { url: `/finance/articles${qs ? `?${qs}` : ""}`, method: "GET" };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Article" as const, id })),
              { type: "Article" as const, id: "LIST" },
            ]
          : [{ type: "Article" as const, id: "LIST" }],
    }),

    getArticle: builder.query<FinanceArticle, string>({
      query: (id) => ({ url: `/finance/articles/${id}`, method: "GET" }),
      providesTags: (_result, _err, id) => [{ type: "Article", id }],
    }),

    createArticle: builder.mutation<FinanceArticle, CreateArticleDto>({
      query: (body) => ({ url: "/finance/articles", method: "POST", body }),
      invalidatesTags: [{ type: "Article", id: "LIST" }],
    }),

    updateArticle: builder.mutation<
      FinanceArticle,
      { id: string; data: UpdateArticleDto }
    >({
      query: ({ id, data }) => ({
        url: `/finance/articles/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Article", id },
        { type: "Article", id: "LIST" },
      ],
    }),

    deleteArticle: builder.mutation<FinanceArticle, string>({
      query: (id) => ({ url: `/finance/articles/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Article", id },
        { type: "Article", id: "LIST" },
      ],
    }),

    // ============ Records ============
    getRecords: builder.query<
      Pagination<FinanceRecord>,
      ListRecordsParams | void
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.type) search.set("type", params.type);
        if (params?.currency) search.set("currency", params.currency);
        if (params?.articleId) search.set("articleId", params.articleId);
        if (params?.accountId) search.set("accountId", params.accountId);
        if (params?.from) search.set("from", params.from);
        if (params?.to) search.set("to", params.to);
        if (params?.search) search.set("search", params.search);
        if (params?.page) search.set("page", String(params.page));
        if (params?.limit) search.set("limit", String(params.limit));
        if (params?.sortBy) search.set("sortBy", params.sortBy);
        if (params?.sortOrder) search.set("sortOrder", params.sortOrder);
        const qs = search.toString();
        return { url: `/finance/records${qs ? `?${qs}` : ""}`, method: "GET" };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({
                type: "Record" as const,
                id,
              })),
              { type: "Record" as const, id: "LIST" },
            ]
          : [{ type: "Record" as const, id: "LIST" }],
    }),

    getRecord: builder.query<FinanceRecord, string>({
      query: (id) => ({ url: `/finance/records/${id}`, method: "GET" }),
      providesTags: (_result, _err, id) => [{ type: "Record", id }],
    }),

    createRecord: builder.mutation<FinanceRecord, CreateRecordDto>({
      query: (body) => ({ url: "/finance/records", method: "POST", body }),
      invalidatesTags: [
        { type: "Record", id: "LIST" },
        { type: "Transaction", id: "LIST" },
        { type: "Summary", id: "LIST" },
        { type: "Balance", id: "LIST" },
      ],
    }),

    updateRecord: builder.mutation<
      FinanceRecord,
      { id: string; data: UpdateRecordDto }
    >({
      query: ({ id, data }) => ({
        url: `/finance/records/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Record", id },
        { type: "Record", id: "LIST" },
        { type: "Transaction", id: "LIST" },
        { type: "Summary", id: "LIST" },
        { type: "Balance", id: "LIST" },
      ],
    }),

    deleteRecord: builder.mutation<FinanceRecord, string>({
      query: (id) => ({ url: `/finance/records/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Record", id },
        { type: "Record", id: "LIST" },
        { type: "Transaction", id: "LIST" },
        { type: "Summary", id: "LIST" },
        { type: "Balance", id: "LIST" },
      ],
    }),

    // ============ Rates ============
    getRates: builder.query<CurrencyRate[], ListRatesParams | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.base) search.set("base", params.base);
        if (params?.quote) search.set("quote", params.quote);
        if (params?.from) search.set("from", params.from);
        if (params?.to) search.set("to", params.to);
        const qs = search.toString();
        return { url: `/finance/rates${qs ? `?${qs}` : ""}`, method: "GET" };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Rate" as const, id })),
              { type: "Rate" as const, id: "LIST" },
            ]
          : [{ type: "Rate" as const, id: "LIST" }],
    }),

    getLatestRate: builder.query<LatestRateResponse, LatestRateParams>({
      query: (params) => {
        const search = new URLSearchParams();
        search.set("base", params.base);
        search.set("quote", params.quote);
        if (params.asOf) search.set("asOf", params.asOf);
        return {
          url: `/finance/rates/latest?${search.toString()}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Rate", id: "LATEST" }],
    }),

    createRate: builder.mutation<CurrencyRate, CreateRateDto>({
      query: (body) => ({ url: "/finance/rates", method: "POST", body }),
      invalidatesTags: [
        { type: "Rate", id: "LIST" },
        { type: "Rate", id: "LATEST" },
        { type: "Balance", id: "LIST" },
        { type: "Summary", id: "LIST" },
      ],
    }),

    updateRate: builder.mutation<
      CurrencyRate,
      { id: string; data: UpdateRateDto }
    >({
      query: ({ id, data }) => ({
        url: `/finance/rates/${id}`,
        method: "PATCH",
        body: data,
      }),
      // A corrected rate re-values balances and every conversion that reads it.
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Rate", id },
        { type: "Rate", id: "LIST" },
        { type: "Rate", id: "LATEST" },
        { type: "Conversion", id: "LIST" },
        { type: "Balance", id: "LIST" },
        { type: "Summary", id: "LIST" },
      ],
    }),

    deleteRate: builder.mutation<CurrencyRate, string>({
      query: (id) => ({ url: `/finance/rates/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Rate", id },
        { type: "Rate", id: "LIST" },
        { type: "Rate", id: "LATEST" },
        { type: "Conversion", id: "LIST" },
        { type: "Balance", id: "LIST" },
        { type: "Summary", id: "LIST" },
      ],
    }),

    // ============ Plans ============
    getPlans: builder.query<FinancePlan[], ListPlansParams | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.kind) search.set("kind", params.kind);
        if (params?.includeArchived) search.set("includeArchived", "true");
        const qs = search.toString();
        return { url: `/finance/plans${qs ? `?${qs}` : ""}`, method: "GET" };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Plan" as const, id })),
              { type: "Plan" as const, id: "LIST" },
            ]
          : [{ type: "Plan" as const, id: "LIST" }],
    }),

    getPlanProgress: builder.query<PlanProgress[], PlanProgressParams | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.from) search.set("from", params.from);
        if (params?.to) search.set("to", params.to);
        if (params?.baseCurrency) search.set("baseCurrency", params.baseCurrency);
        const qs = search.toString();
        return {
          url: `/finance/plans/progress${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Plan", id: "PROGRESS" }],
    }),

    createPlan: builder.mutation<FinancePlan, CreatePlanDto>({
      query: (body) => ({ url: "/finance/plans", method: "POST", body }),
      invalidatesTags: [
        { type: "Plan", id: "LIST" },
        { type: "Plan", id: "PROGRESS" },
      ],
    }),

    updatePlan: builder.mutation<
      FinancePlan,
      { id: string; data: UpdatePlanDto }
    >({
      query: ({ id, data }) => ({
        url: `/finance/plans/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Plan", id },
        { type: "Plan", id: "LIST" },
        { type: "Plan", id: "PROGRESS" },
      ],
    }),

    deletePlan: builder.mutation<FinancePlan, string>({
      query: (id) => ({ url: `/finance/plans/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Plan", id },
        { type: "Plan", id: "LIST" },
        { type: "Plan", id: "PROGRESS" },
      ],
    }),

    // ============ Conversions ============
    getConversions: builder.query<
      Pagination<CurrencyConversion>,
      ListConversionsParams | void
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.fromCurrency)
          search.set("fromCurrency", params.fromCurrency);
        if (params?.toCurrency) search.set("toCurrency", params.toCurrency);
        if (params?.from) search.set("from", params.from);
        if (params?.to) search.set("to", params.to);
        if (params?.page) search.set("page", String(params.page));
        if (params?.limit) search.set("limit", String(params.limit));
        const qs = search.toString();
        return {
          url: `/finance/conversions${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({
                type: "Conversion" as const,
                id,
              })),
              { type: "Conversion" as const, id: "LIST" },
            ]
          : [{ type: "Conversion" as const, id: "LIST" }],
    }),

    getConversion: builder.query<CurrencyConversion, string>({
      query: (id) => ({ url: `/finance/conversions/${id}`, method: "GET" }),
      providesTags: (_result, _err, id) => [{ type: "Conversion", id }],
    }),

    createConversion: builder.mutation<CurrencyConversion, CreateConversionDto>(
      {
        query: (body) => ({
          url: "/finance/conversions",
          method: "POST",
          body,
        }),
        invalidatesTags: [
          { type: "Conversion", id: "LIST" },
          { type: "Transaction", id: "LIST" },
          { type: "Summary", id: "LIST" },
          { type: "Balance", id: "LIST" },
        ],
      }
    ),

    updateConversion: builder.mutation<
      CurrencyConversion,
      { id: string; data: UpdateConversionDto }
    >({
      query: ({ id, data }) => ({
        url: `/finance/conversions/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Conversion", id },
        { type: "Conversion", id: "LIST" },
        { type: "Transaction", id: "LIST" },
        { type: "Summary", id: "LIST" },
        { type: "Balance", id: "LIST" },
      ],
    }),

    deleteConversion: builder.mutation<CurrencyConversion, string>({
      query: (id) => ({ url: `/finance/conversions/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Conversion", id },
        { type: "Conversion", id: "LIST" },
        { type: "Transaction", id: "LIST" },
        { type: "Summary", id: "LIST" },
        { type: "Balance", id: "LIST" },
      ],
    }),


    // ============ Transactions (the unified timeline) ============
    getTransactions: builder.query<
      Pagination<FinanceTransaction>,
      ListTransactionsParams | void
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.kind) search.set("kind", params.kind);
        if (params?.currency) search.set("currency", params.currency);
        if (params?.articleId) search.set("articleId", params.articleId);
        if (params?.accountId) search.set("accountId", params.accountId);
        if (params?.from) search.set("from", params.from);
        if (params?.to) search.set("to", params.to);
        if (params?.search) search.set("search", params.search);
        if (params?.page) search.set("page", String(params.page));
        if (params?.limit) search.set("limit", String(params.limit));
        if (params?.sortOrder) search.set("sortOrder", params.sortOrder);
        const qs = search.toString();
        return {
          url: `/finance/transactions${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      // Ids are only unique within a kind, so the tag carries both.
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((entry) => ({
                type: "Transaction" as const,
                id: `${entry.kind}:${entry.id}`,
              })),
              { type: "Transaction" as const, id: "LIST" },
            ]
          : [{ type: "Transaction" as const, id: "LIST" }],
    }),

    // ============ Accounts ============
    getAccounts: builder.query<FinanceAccount[], ListAccountsParams | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.kind) search.set("kind", params.kind);
        if (params?.includeArchived)
          search.set("includeArchived", String(params.includeArchived));
        const qs = search.toString();
        return { url: `/finance/accounts${qs ? `?${qs}` : ""}`, method: "GET" };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Account" as const, id })),
              { type: "Account" as const, id: "LIST" },
            ]
          : [{ type: "Account" as const, id: "LIST" }],
    }),

    getAccount: builder.query<FinanceAccount, string>({
      query: (id) => ({ url: `/finance/accounts/${id}`, method: "GET" }),
      providesTags: (_result, _err, id) => [{ type: "Account", id }],
    }),

    createAccount: builder.mutation<FinanceAccount, CreateAccountDto>({
      query: (body) => ({ url: "/finance/accounts", method: "POST", body }),
      invalidatesTags: [
        { type: "Account", id: "LIST" },
        { type: "Balance", id: "LIST" },
      ],
    }),

    updateAccount: builder.mutation<
      FinanceAccount,
      { id: string; data: UpdateAccountDto }
    >({
      query: ({ id, data }) => ({
        url: `/finance/accounts/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Account", id },
        { type: "Account", id: "LIST" },
        { type: "Balance", id: "LIST" },
      ],
    }),

    deleteAccount: builder.mutation<FinanceAccount, string>({
      query: (id) => ({ url: `/finance/accounts/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Account", id },
        { type: "Account", id: "LIST" },
        { type: "Balance", id: "LIST" },
        { type: "Record", id: "LIST" },
      ],
    }),

    // ============ Balances & net worth ============
    getBalances: builder.query<BalancesResponse, BalancesParams | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.asOf) search.set("asOf", params.asOf);
        if (params?.baseCurrency)
          search.set("baseCurrency", params.baseCurrency);
        if (params?.includeArchived)
          search.set("includeArchived", String(params.includeArchived));
        if (params?.excludeReceivables) search.set("excludeReceivables", "true");
        const qs = search.toString();
        return {
          url: `/finance/accounts/balances${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Balance", id: "LIST" }],
    }),

    getNetWorthHistory: builder.query<
      NetWorthHistoryResponse,
      NetWorthHistoryParams
    >({
      query: (params) => {
        const search = new URLSearchParams();
        search.set("from", params.from);
        search.set("to", params.to);
        if (params.interval) search.set("interval", params.interval);
        if (params.baseCurrency)
          search.set("baseCurrency", params.baseCurrency);
        if (params.excludeReceivables) search.set("excludeReceivables", "true");
        return {
          url: `/finance/accounts/net-worth/history?${search.toString()}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Balance", id: "LIST" }],
    }),

    getDebts: builder.query<DebtsResponse, BalancesParams | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.asOf) search.set("asOf", params.asOf);
        if (params?.baseCurrency)
          search.set("baseCurrency", params.baseCurrency);
        if (params?.includeArchived)
          search.set("includeArchived", String(params.includeArchived));
        const qs = search.toString();
        return {
          url: `/finance/accounts/debts${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Balance", id: "DEBTS" }, { type: "Balance", id: "LIST" }],
    }),

    // ============ Valuations ============
    getValuations: builder.query<AccountValuation[], string>({
      query: (accountId) => ({
        url: `/finance/accounts/${accountId}/valuations`,
        method: "GET",
      }),
      providesTags: (_result, _err, accountId) => [
        { type: "Valuation", id: accountId },
      ],
    }),

    createValuation: builder.mutation<
      AccountValuation,
      { accountId: string; data: CreateValuationDto }
    >({
      query: ({ accountId, data }) => ({
        url: `/finance/accounts/${accountId}/valuations`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _err, { accountId }) => [
        { type: "Valuation", id: accountId },
        { type: "Balance", id: "LIST" },
      ],
    }),

    deleteValuation: builder.mutation<
      AccountValuation,
      { accountId: string; valuationId: string }
    >({
      query: ({ accountId, valuationId }) => ({
        url: `/finance/accounts/${accountId}/valuations/${valuationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _err, { accountId }) => [
        { type: "Valuation", id: accountId },
        { type: "Balance", id: "LIST" },
      ],
    }),

    // ============ Summary ============
    getSummary: builder.query<SummaryResponse, SummaryParams>({
      query: (params) => {
        const search = new URLSearchParams();
        search.set("from", params.from);
        search.set("to", params.to);
        if (params.baseCurrency)
          search.set("baseCurrency", params.baseCurrency);
        return {
          url: `/finance/summary?${search.toString()}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Summary", id: "LIST" }],
    }),

    // ============ Cashflow ============
    getCashflow: builder.query<CashflowResponse, CashflowParams>({
      query: (params) => {
        const search = new URLSearchParams();
        search.set("from", params.from);
        search.set("to", params.to);
        if (params.interval) search.set("interval", params.interval);
        if (params.baseCurrency)
          search.set("baseCurrency", params.baseCurrency);
        return {
          url: `/finance/summary/cashflow?${search.toString()}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Summary", id: "LIST" }],
    }),

    // ============ Charts ============
    getExpenseChart: builder.query<ChartResponse, ChartQueryParams>({
      query: (params) => {
        const search = new URLSearchParams();
        search.set("from", params.from);
        search.set("to", params.to);
        if (params.baseCurrency)
          search.set("baseCurrency", params.baseCurrency);
        return {
          url: `/finance/summary/chart/expenses?${search.toString()}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Summary", id: "LIST" }],
    }),

    getIncomeChart: builder.query<ChartResponse, ChartQueryParams>({
      query: (params) => {
        const search = new URLSearchParams();
        search.set("from", params.from);
        search.set("to", params.to);
        if (params.baseCurrency)
          search.set("baseCurrency", params.baseCurrency);
        return {
          url: `/finance/summary/chart/income?${search.toString()}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Summary", id: "LIST" }],
    }),
  }),
});

export const {
  // Accounts
  useGetAccountsQuery,
  useGetAccountQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  // Balances & net worth
  useGetBalancesQuery,
  useGetNetWorthHistoryQuery,
  useGetDebtsQuery,
  // Valuations
  useGetValuationsQuery,
  useCreateValuationMutation,
  useDeleteValuationMutation,
  // Articles
  useGetArticlesQuery,
  useGetArticleQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
  // Records
  useGetRecordsQuery,
  useGetRecordQuery,
  useCreateRecordMutation,
  useUpdateRecordMutation,
  useDeleteRecordMutation,
  // Rates
  useGetRatesQuery,
  useGetLatestRateQuery,
  useCreateRateMutation,
  useGetPlansQuery,
  useGetPlanProgressQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useUpdateRateMutation,
  useDeleteRateMutation,
  // Transactions
  useGetTransactionsQuery,
  // Conversions
  useGetConversionsQuery,
  useGetConversionQuery,
  useCreateConversionMutation,
  useUpdateConversionMutation,
  useDeleteConversionMutation,
  // Summary
  useGetSummaryQuery,
  useGetCashflowQuery,
  // Charts
  useGetExpenseChartQuery,
  useGetIncomeChartQuery,
} = financeApi;
