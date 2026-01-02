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
  ListRatesParams,
  LatestRateParams,
  LatestRateResponse,
  CurrencyConversion,
  CreateConversionDto,
  ListConversionsParams,
  SummaryParams,
  SummaryResponse,
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
        { type: "Summary", id: "LIST" },
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
        { type: "Summary", id: "LIST" },
      ],
    }),

    deleteRecord: builder.mutation<FinanceRecord, string>({
      query: (id) => ({ url: `/finance/records/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Record", id },
        { type: "Record", id: "LIST" },
        { type: "Summary", id: "LIST" },
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
          { type: "Summary", id: "LIST" },
        ],
      }
    ),

    deleteConversion: builder.mutation<CurrencyConversion, string>({
      query: (id) => ({ url: `/finance/conversions/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Conversion", id },
        { type: "Conversion", id: "LIST" },
        { type: "Summary", id: "LIST" },
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
  }),
});

export const {
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
  // Conversions
  useGetConversionsQuery,
  useGetConversionQuery,
  useCreateConversionMutation,
  useDeleteConversionMutation,
  // Summary
  useGetSummaryQuery,
} = financeApi;
