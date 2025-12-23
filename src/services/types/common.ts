export type Pagination<T> = {
  count: number;
  current_page: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ListParams = {
  page?: number;
  limit?: number;
  query?: string;
};
