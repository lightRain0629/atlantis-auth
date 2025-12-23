import React from "react";
import { useAppDispatch, useAppSelector } from "@/hooks";
import i18n, { supportedLocales, type SupportedLocale } from "@/lib/i18n";
import { setLocale } from "@/features/locale/localeSlice";
import { useTranslation } from "react-i18next";

const localeLabels: Record<SupportedLocale, string> = {
  en: "English",
  ru: "Русский",
  tk: "Türkmen",
};

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const locale = useAppSelector((state) => state.locale.locale);

  React.useEffect(() => {
    const current = (i18n.language?.split("-")[0] ?? "en") as SupportedLocale;
    if (supportedLocales.includes(current) && current !== locale) {
      dispatch(setLocale(current));
    }
  }, [dispatch, locale]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as SupportedLocale;
    dispatch(setLocale(next));
    void i18n.changeLanguage(next);
  };

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Language selector">
      <span>{t("common.lang")}</span>
      <select
        value={locale}
        onChange={handleChange}
        className="rounded-md border border-input bg-white px-2 py-1 text-xs text-foreground shadow-sm focus:outline-none"
      >
        {supportedLocales.map((lng) => (
          <option key={lng} value={lng}>
            {localeLabels[lng]}
          </option>
        ))}
      </select>
    </label>
  );
}
