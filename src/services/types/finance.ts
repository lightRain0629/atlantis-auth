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
  accountId: string | null;
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
  account: {
    id: string;
    name: string;
    kind: string;
    currency: string;
    color: string | null;
  } | null;
}

export interface CreateRecordDto {
  type: FinanceRecordType;
  amount: string;
  currency: string;
  articleId?: string;
  accountId?: string;
  remark?: string;
  operationDate: string;
}

export interface UpdateRecordDto {
  type?: FinanceRecordType;
  amount?: string;
  currency?: string;
  articleId?: string | null;
  accountId?: string | null;
  remark?: string;
  operationDate?: string;
}

export interface ListRecordsParams {
  type?: FinanceRecordType;
  currency?: string;
  articleId?: string;
  accountId?: string;
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
  fromAccountId: string | null;
  toAccountId: string | null;
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
  fromAccountId?: string;
  toAccountId?: string;
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

// ============ Charts ============

export interface ChartQueryParams {
  from: string;
  to: string;
  baseCurrency?: string;
}

export interface ChartItem {
  articleId: string | null;
  categoryName: string;
  categoryColor: string;
  total: string;
  currency: string;
  percentage: number;
}

export interface ChartResponse {
  items: ChartItem[];
  total: Record<string, string>;
}

// ============ Accounts ============

export type FinanceAccountKind =
  | "CASH"
  | "BANK"
  | "CARD"
  | "EWALLET"
  | "CRYPTO"
  | "SAVINGS"
  | "INVESTMENT"
  | "PROPERTY"
  | "RECEIVABLE"
  | "LOAN"
  | "CREDIT_CARD"
  | "OTHER";

/** TRACKED derives the balance from records; VALUED takes the latest manual value. */
export type FinanceAccountValuationMode = "TRACKED" | "VALUED";

export interface FinanceAccount {
  id: string;
  name: string;
  kind: FinanceAccountKind;
  valuationMode: FinanceAccountValuationMode;
  currency: string;
  openingBalance: string;
  openingDate: string;
  institution: string | null;
  color: string | null;
  icon: string | null;
  counterparty: string | null;
  creditLimit: string | null;
  interestRate: string | null;
  dueDate: string | null;
  isArchived: boolean;
  excludeFromNetWorth: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountDto {
  name: string;
  kind: FinanceAccountKind;
  valuationMode?: FinanceAccountValuationMode;
  currency: string;
  openingBalance?: string;
  openingDate?: string;
  institution?: string;
  color?: string;
  icon?: string;
  counterparty?: string;
  creditLimit?: string;
  interestRate?: string;
  dueDate?: string;
  excludeFromNetWorth?: boolean;
  sortOrder?: number;
}

export type UpdateAccountDto = Partial<Omit<CreateAccountDto, "currency">> & {
  isArchived?: boolean;
};

export interface ListAccountsParams {
  kind?: FinanceAccountKind;
  includeArchived?: boolean;
}

export interface BalancesParams {
  asOf?: string;
  baseCurrency?: string;
  includeArchived?: boolean;
}

export interface MissingRate {
  from: string;
  to: string;
}

export interface AccountBalance {
  account: FinanceAccount;
  balance: string;
  balanceInBase: string | null;
  rateUsed: string | null;
  rateMissing: boolean;
  isLiability: boolean;
}

export interface KindBreakdown {
  kind: FinanceAccountKind;
  total: string;
  percentage: number;
  accountCount: number;
}

export interface BalancesResponse {
  accounts: AccountBalance[];
  baseCurrency: string | null;
  asOf: string;
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
  byKind: KindBreakdown[];
  byCurrency: Record<string, string>;
  missingRates: MissingRate[];
}

export type NetWorthInterval = "day" | "week" | "month";

export interface NetWorthHistoryParams {
  from: string;
  to: string;
  interval?: NetWorthInterval;
  baseCurrency?: string;
}

export interface NetWorthPoint {
  date: string;
  assets: string;
  liabilities: string;
  netWorth: string;
}

export interface NetWorthHistoryResponse {
  points: NetWorthPoint[];
  baseCurrency: string;
  change: string;
  changePercent: number | null;
  missingRates: MissingRate[];
}

export interface DebtSummaryItem {
  account: FinanceAccount;
  outstanding: string;
  outstandingInBase: string | null;
  repaid: string;
  progress: number;
  daysUntilDue: number | null;
  isOverdue: boolean;
}

export interface DebtsResponse {
  owed: DebtSummaryItem[];
  lent: DebtSummaryItem[];
  totalOwed: string;
  totalLent: string;
  baseCurrency: string | null;
}

export interface AccountValuation {
  id: string;
  accountId: string;
  value: string;
  remark: string | null;
  valuedAt: string;
  createdAt: string;
}

export interface CreateValuationDto {
  value: string;
  valuedAt: string;
  remark?: string;
}

// ============ Cashflow ============

export type CashflowInterval = "day" | "week" | "month";

export interface CashflowParams {
  from: string;
  to: string;
  interval?: CashflowInterval;
  baseCurrency?: string;
}

export interface CashflowPoint {
  date: string;
  label: string;
  income: string;
  expense: string;
  net: string;
}

export interface FlowLeg {
  name: string;
  id: string | null;
  color: string;
  total: string;
  percentage: number;
}

export interface CashflowResponse {
  points: CashflowPoint[];
  baseCurrency: string;
  totalIncome: string;
  totalExpense: string;
  netFlow: string;
  savingsRate: number | null;
  averageExpense: string;
  incomeByCategory: FlowLeg[];
  expenseByCategory: FlowLeg[];
  expenseByAccount: FlowLeg[];
  missingRates: MissingRate[];
}
