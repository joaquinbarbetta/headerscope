"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { LOCALE_COOKIE, translate, translator, type Locale, type Message, type Translator } from "@/lib/i18n";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a key: t("form.submit"), t("loading.title", { host }). */
  t: Translator;
  /** Translate a serialized message, e.g. one that came from the API. */
  tm: (message: Message) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const ONE_YEAR = 60 * 60 * 24 * 365;

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    // Remembered in a cookie so the server renders the right language (and <html lang>) on the next visit.
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
    document.documentElement.lang = next;
    document.title = translate(next, { key: "meta.title" });
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t: translator(locale), tm: (m) => translate(locale, m) }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
