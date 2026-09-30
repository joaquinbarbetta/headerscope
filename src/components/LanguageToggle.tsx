"use client";

import { LOCALES, type Locale } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";

const NAMES: Record<Locale, string> = { en: "English", es: "Español" };

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div role="group" aria-label={t("nav.language")} className="flex rounded-xl border border-line bg-bg/60 p-1">
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            aria-pressed={active}
            aria-label={NAMES[l]}
            onClick={() => setLocale(l)}
            className={`min-h-8 min-w-10 cursor-pointer rounded-lg px-2.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
              active ? "btn-primary" : "text-muted hover:bg-panel-3 hover:text-ink"
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
