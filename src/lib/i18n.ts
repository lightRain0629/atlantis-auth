import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

export const supportedLocales = ["en", "ru", "tk"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

type Loader = () => Promise<{ default: Record<string, unknown> } | Record<string, unknown>>;

const translationLoaders: Record<SupportedLocale, Loader> = {
  en: () => import("../locales/en/translation.json"),
  ru: () => import("../locales/ru/translation.json"),
  tk: () => import("../locales/tk/translation.json"),
};

const backend = {
  type: "backend" as const,
  init: () => {},
  read(language: string, _namespace: string, callback: (error: unknown, resources: unknown | null) => void) {
    const normalized = (language?.split("-")[0] ?? "en") as SupportedLocale;
    const loader = translationLoaders[normalized];

    if (!loader) {
      callback(new Error(`Unsupported language: ${language}`), null);
      return;
    }

    loader()
      .then((resources) => callback(null, (resources as any).default ?? resources))
      .catch((error) => callback(error, null));
  },
  create: () => {},
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(backend)
  .init({
    fallbackLng: "en",
    supportedLngs: supportedLocales,
    load: "languageOnly",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
