import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** Per-browser memory of the "hide amounts" toggle. */
export const AMOUNTS_HIDDEN_STORAGE_KEY = "finance.amountsHidden";

type PrivacyState = {
  /** Every money figure renders as a mask while this is on. */
  amountsHidden: boolean;
};

// Storage can be missing or throw (private mode, blocked site data); the
// toggle then simply starts with amounts shown.
const readStoredAmountsHidden = (): boolean => {
  try {
    return localStorage.getItem(AMOUNTS_HIDDEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

export const persistAmountsHidden = (hidden: boolean): void => {
  try {
    if (hidden) localStorage.setItem(AMOUNTS_HIDDEN_STORAGE_KEY, "1");
    else localStorage.removeItem(AMOUNTS_HIDDEN_STORAGE_KEY);
  } catch {
    // Not remembered across reloads, but the toggle still works for this tab.
  }
};

const initialState: PrivacyState = {
  amountsHidden: readStoredAmountsHidden(),
};

const privacySlice = createSlice({
  name: "privacy",
  initialState,
  reducers: {
    toggleAmountsHidden: (state) => {
      state.amountsHidden = !state.amountsHidden;
    },
    setAmountsHidden: (state, action: PayloadAction<boolean>) => {
      state.amountsHidden = action.payload;
    },
  },
});

export const { toggleAmountsHidden, setAmountsHidden } = privacySlice.actions;
export default privacySlice.reducer;
