import { clearCredentials } from "@/features/auth/authSlice";
import { api } from "../baseApi";
import type { SessionInfo } from "../types";

export const sessionsApi = api.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
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
  }),
});

export const {
  useListSessionsQuery,
  useLogoutCurrentMutation,
  useLogoutOthersMutation,
  useLogoutAllMutation,
} = sessionsApi;
