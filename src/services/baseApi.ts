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
import type { TokensResponse } from "./types";

const ENV_BASE_URL = import.meta.env?.VITE_API_BASE_URL;
export const API_BASE_URL = (ENV_BASE_URL ??
  "http://localhost:3000/api") as string;

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
> = async (args, apiCtx, extraOptions) => {
  let result = await rawBaseQuery(args, apiCtx, extraOptions);
  if (result.error && result.error.status === 401) {
    const refreshResult = await rawBaseQuery(
      { url: "/auth/refresh-tokens", method: "GET" },
      apiCtx,
      extraOptions
    );
    if (refreshResult.data && typeof refreshResult.data === "object") {
      const tokens = refreshResult.data as TokensResponse;
      apiCtx.dispatch(setCredentials(tokens));
      result = await rawBaseQuery(args, apiCtx, extraOptions);
    } else {
      apiCtx.dispatch(clearCredentials());
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "Session", "Todo", "User", "Profile"],
  endpoints: () => ({}),
});
