import { api } from "../baseApi";
import type { JwtPayload, ListParams, Pagination, UserDto } from "../types";

export const usersApi = api.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    me: builder.query<JwtPayload, void>({
      query: () => ({ url: "/user", method: "GET" }),
      providesTags: ["Profile"],
    }),
    getUsers: builder.query<Pagination<UserDto>, ListParams | void>({
      query: (params) => {
        const { page = 1, limit = 10, query } = params ?? {};
        const search = new URLSearchParams();
        search.set("page", String(page));
        search.set("limit", String(limit));
        if (query) search.set("query", query);
        const qs = search.toString();
        return { url: `/user/all${qs ? `?${qs}` : ""}`, method: "GET" };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: "User" as const, id })),
              { type: "User" as const, id: "LIST" },
            ]
          : [{ type: "User" as const, id: "LIST" }],
    }),
    getUser: builder.query<UserDto, string>({
      query: (idOrEmail) => ({ url: `/user/${idOrEmail}`, method: "GET" }),
      providesTags: (_result, _err, idOrEmail) => [{ type: "User", id: idOrEmail }],
    }),
    updateUser: builder.mutation<UserDto, Partial<UserDto>>({
      query: (body) => ({ url: "/user", method: "PUT", body }),
      invalidatesTags: ["User", "Profile"],
    }),
    deleteUser: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/user/${id}`, method: "DELETE" }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useMeQuery,
  useGetUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
