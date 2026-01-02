import { api } from "../baseApi";
import type { ListParams, Pagination, TodoDto } from "../types";

export const todosApi = api.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getTodos: builder.query<Pagination<TodoDto>, ListParams | void>({
      query: (params) => {
        const { page = 1, limit = 10, query } = params ?? {};
        const search = new URLSearchParams();
        search.set("page", String(page));
        search.set("limit", String(limit));
        if (query) search.set("query", query);
        const qs = search.toString();
        return { url: `/todos${qs ? `?${qs}` : ""}`, method: "GET" };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({
                type: "Todo" as const,
                id,
              })),
              { type: "Todo" as const, id: "LIST" },
            ]
          : [{ type: "Todo" as const, id: "LIST" }],
    }),
    createTodo: builder.mutation<TodoDto, { title: string }>({
      query: (body) => ({ url: "/todos", method: "POST", body }),
      invalidatesTags: [{ type: "Todo", id: "LIST" }],
    }),
    updateTodo: builder.mutation<
      TodoDto,
      { id: string; data: Partial<TodoDto> }
    >({
      query: ({ id, data }) => ({
        url: `/todos/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Todo", id },
        { type: "Todo", id: "LIST" },
      ],
    }),
    deleteTodo: builder.mutation<TodoDto, string>({
      query: (id) => ({ url: `/todos/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Todo", id },
        { type: "Todo", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} = todosApi;
