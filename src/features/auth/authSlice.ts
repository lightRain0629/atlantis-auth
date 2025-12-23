import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TokensResponse } from "@/services/types";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
};

const getStoredToken = (key: string): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(key);
};

const initialState: AuthState = {
  accessToken: getStoredToken("accessToken"),
  refreshToken: getStoredToken("refreshToken"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<TokensResponse>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("refreshToken", action.payload.refreshToken);
      }
    },
    clearCredentials: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
