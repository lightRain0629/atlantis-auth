import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store";
import { setCredentials, clearCredentials } from "@/features/auth/authSlice";
import { getDeviceId } from "@/lib/device-id";

export type TokensResponse = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  id: string;
  email: string;
  roles: string[];
  agent: string;
  deviceId?: string | null;
};

export type UserDto = {
  id: string;
  email: string;
  roles: string[];
  provider?: string | null;
  isVerified?: boolean;
  updatedAt?: string;
};

export type SessionInfo = {
  sessionId: string;
  device: string | null;
  userAgent: string | null;
  ip?: string | null;
  deviceId?: string | null;
  createdAt: string;
  exp: string;
  isCurrent: boolean;
};

export type TodoDto = {
  id: string;
  title: string;
  isCompleted: boolean;
  isDeleted: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type Pagination<T> = {
  count: number;
  current_page: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type ListParams = {
  page?: number;
  limit?: number;
  query?: string;
};

export const API_BASE_URL = "http://localhost:3000/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("Authorization", token);
    }
    const deviceId = getDeviceId();
    if (deviceId) {
      headers.set("x-device-id", deviceId);
    }
    headers.set("Accept", "application/json");
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    const refreshResult = await rawBaseQuery(
      { url: "/auth/refresh-tokens", method: "GET" },
      api,
      extraOptions
    );
    if (refreshResult.data && typeof refreshResult.data === "object") {
      const tokens = refreshResult.data as TokensResponse;
      api.dispatch(setCredentials(tokens));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "Session", "Todo", "User", "Profile"],
  endpoints: (builder) => ({
    login: builder.mutation<
      TokensResponse,
      { email: string; password: string }
    >({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body: { ...body, deviceId: getDeviceId() },
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          /* noop */
        }
      },
    }),
    register: builder.mutation<
      UserDto,
      { email: string; password: string; passwordRepeat: string }
    >({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body: { ...body, deviceId: getDeviceId() },
      }),
    }),
    verifyEmail: builder.mutation<
      { message: string },
      { email: string; code: string }
    >({
      query: (body) => ({
        url: "/auth/verify-email",
        method: "POST",
        body,
      }),
    }),
    resendOtp: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body,
      }),
    }),
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation<
      { message: string },
      { token: string; password: string; passwordRepeat: string }
    >({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),
    listSessions: builder.query<{ sessions: SessionInfo[] }, void>({
      query: () => ({ url: "/auth/sessions", method: "GET" }),
      providesTags: ["Session"],
    }),
    logoutCurrent: builder.mutation<{ revoked?: number }, void>({
      query: () => ({ url: "/auth/logout", method: "GET" }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearCredentials());
          dispatch(api.util.resetApiState());
        }
      },
    }),
    logoutOthers: builder.mutation<{ revoked: number }, void>({
      query: () => ({ url: "/auth/sessions/others", method: "DELETE" }),
      invalidatesTags: ["Session"],
    }),
    logoutAll: builder.mutation<{ revoked: number }, void>({
      query: () => ({ url: "/auth/sessions", method: "DELETE" }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearCredentials());
          dispatch(api.util.resetApiState());
        }
      },
    }),
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
      providesTags: (_result, _err, idOrEmail) => [
        { type: "User", id: idOrEmail },
      ],
    }),
    updateUser: builder.mutation<UserDto, Partial<UserDto>>({
      query: (body) => ({ url: "/user", method: "PUT", body }),
      invalidatesTags: ["User", "Profile"],
    }),
    deleteUser: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/user/${id}`, method: "DELETE" }),
      invalidatesTags: ["User"],
    }),
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
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useListSessionsQuery,
  useLogoutCurrentMutation,
  useLogoutOthersMutation,
  useLogoutAllMutation,
  useMeQuery,
  useGetUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} = api;
