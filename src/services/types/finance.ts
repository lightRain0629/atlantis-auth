// Enums
export type FinanceArticleKind = "EXPENSE" | "INCOME";
export type FinanceRecordType = "EXPENSE" | "INCOME";

// ============ Articles ============

export interface FinanceArticle {
  id: string;
  kind: FinanceArticleKind;
  name: string;
  color: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleDto {
  kind: FinanceArticleKind;
  name: string;
  color?: string;
}

export interface UpdateArticleDto {
  name?: string;
  color?: string;
  isArchived?: boolean;
}

export interface ListArticlesParams {
  kind?: FinanceArticleKind;
  includeArchived?: boolean;
}

// ============ Records ============

export interface FinanceRecord {
  id: string;
  type: FinanceRecordType;
  amount: string;
  currency: string;
  articleId: string | null;
  remark: string | null;
  operationDate: string;
  createdAt: string;
  updatedAt: string;
  article: {
    id: string;
    name: string;
    kind: string;
    color: string | null;
  } | null;
}

export interface CreateRecordDto {
  type: FinanceRecordType;
  amount: string;
  currency: string;
  articleId?: string;
  remark?: string;
  operationDate: string;
}

export interface UpdateRecordDto {
  type?: FinanceRecordType;
  amount?: string;
  currency?: string;
  articleId?: string | null;
  remark?: string;
  operationDate?: string;
}

export interface ListRecordsParams {
  type?: FinanceRecordType;
  currency?: string;
  articleId?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "operationDate" | "createdAt" | "amount";
  sortOrder?: "asc" | "desc";
}

// ============ Currency Rates ============

export interface CurrencyRate {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: string;
  source: string | null;
  effectiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRateDto {
  baseCurrency: string;
  quoteCurrency: string;
  rate: string;
  source?: string;
  effectiveAt: string;
}

export interface ListRatesParams {
  base?: string;
  quote?: string;
  from?: string;
  to?: string;
}

export interface LatestRateParams {
  base: string;
  quote: string;
  asOf?: string;
}

export interface LatestRateResponse {
  rate: CurrencyRate;
  effectiveRate: string;
  isInverse: boolean;
}

// ============ Conversions ============

export interface CurrencyConversion {
  id: string;
  fromAmount: string;
  fromCurrency: string;
  toAmount: string;
  toCurrency: string;
  rateUsed: string;
  rateId: string | null;
  feeAmount: string | null;
  feeCurrency: string | null;
  remark: string | null;
  operationDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversionDto {
  fromAmount: string;
  fromCurrency: string;
  toCurrency: string;
  operationDate: string;
  feeAmount?: string;
  feeCurrency?: string;
  remark?: string;
}

export interface ListConversionsParams {
  fromCurrency?: string;
  toCurrency?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

// ============ Summary ============

export interface SummaryParams {
  from: string;
  to: string;
  baseCurrency?: string;
}

export interface SummaryResponse {
  income: Record<string, string>;
  expense: Record<string, string>;
  conversionFees?: Record<string, string>;
  incomeBaseCurrency?: string;
  expenseBaseCurrency?: string;
  netBaseCurrency?: string;
}
