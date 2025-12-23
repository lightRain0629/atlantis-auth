import { clearCredentials, setCredentials } from "@/features/auth/authSlice";
import { getDeviceId } from "@/lib/device-id";
import { api } from "../baseApi";
import type { TokensResponse, UserDto } from "../types";

export const authApi = api.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    login: builder.mutation<TokensResponse, { email: string; password: string }>({
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
    register: builder.mutation<UserDto, { email: string; password: string; passwordRepeat: string }>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body: { ...body, deviceId: getDeviceId() },
      }),
    }),
    verifyEmail: builder.mutation<{ message: string }, { email: string; code: string }>({
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
    resetPassword: builder.mutation<{ message: string }, { token: string; password: string; passwordRepeat: string }>({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
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
} = authApi;
