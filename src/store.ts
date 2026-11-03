import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { api } from "./services/api";
import authReducer from "./features/auth/authSlice";
import localeReducer from "./features/locale/localeSlice";
import privacyReducer, {
  persistAmountsHidden,
} from "./features/privacy/privacySlice";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    locale: localeReducer,
    privacy: privacyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

// Persist outside the reducer so the slice stays pure.
let lastAmountsHidden = store.getState().privacy.amountsHidden;
store.subscribe(() => {
  const { amountsHidden } = store.getState().privacy;
  if (amountsHidden === lastAmountsHidden) return;
  lastAmountsHidden = amountsHidden;
  persistAmountsHidden(amountsHidden);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
