import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { supportedLocales, type SupportedLocale } from "@/lib/i18n";

type LocaleState = {
  locale: SupportedLocale;
};

const getStoredLocale = (): SupportedLocale => {
  if (typeof window === "undefined") return "en";

  const raw = localStorage.getItem("i18nextLng");
  const base = (raw?.split("-")[0] ?? "en") as SupportedLocale;

  return supportedLocales.includes(base) ? base : "en";
};

const initialState: LocaleState = {
  locale: getStoredLocale(),
};

const localeSlice = createSlice({
  name: "locale",
  initialState,
  reducers: {
    setLocale: (state, action: PayloadAction<SupportedLocale>) => {
      state.locale = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("i18nextLng", action.payload);
      }
    },
  },
});

export const { setLocale } = localeSlice.actions;
export default localeSlice.reducer;
