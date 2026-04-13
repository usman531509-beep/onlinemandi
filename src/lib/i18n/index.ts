"use client";

import { createContext, useContext } from "react";
import en from "./en";
import ur from "./ur";

export type Lang = "en" | "ur";

const translations: Record<Lang, Record<string, string>> = { en, ur };

export type I18nContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string>) => string;
  dir: "ltr" | "rtl";
};

export const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
  dir: "ltr",
});

export function translate(lang: Lang, key: string, vars?: Record<string, string>): string {
  let text = translations[lang]?.[key] || translations.en[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

export function useTranslation() {
  return useContext(I18nContext);
}
