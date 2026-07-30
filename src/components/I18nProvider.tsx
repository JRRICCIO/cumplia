"use client";

import { createContext, useContext } from "react";
import { getDict, LOCALE_COOKIE, type Dict, type Locale } from "@/lib/core/i18n";

interface I18nValue {
  locale: Locale;
  t: Dict;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  function setLocale(l: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  return (
    <I18nContext.Provider value={{ locale, t: getDict(locale), setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n debe usarse dentro de I18nProvider");
  return ctx;
}
