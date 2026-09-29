"use client";

import Link from "next/link";
import { REPO_URL } from "@/lib/site";
import { useI18n } from "./I18nProvider";
import { LanguageToggle } from "./LanguageToggle";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 2.5 4.5 7v8.2c0 6.6 4.7 12 11.5 14.3 6.8-2.3 11.5-7.7 11.5-14.3V7L16 2.5Z"
        className="fill-accent/10 stroke-accent"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="15.5" r="5.2" className="stroke-accent" strokeWidth="1.6" />
      <path d="M16 8.2v3M16 20v3M8.7 15.5h3M20.3 15.5h3" className="stroke-accent" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="15.5" r="1.3" className="fill-accent" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function SiteHeader() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-30 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-ink"
      >
        {t("nav.skip")}
      </a>
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-md">
          <LogoMark />
          <span className="text-[15px] font-semibold tracking-tight">
            Header<span className="text-accent">Scope</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("nav.sourceLabel")}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-sm text-muted transition-colors duration-200 hover:bg-panel-2 hover:text-ink"
          >
            <GitHubIcon />
            <span className="hidden sm:inline">{t("nav.source")}</span>
          </a>
          <LanguageToggle />
        </nav>
      </div>
    </header>
  );
}

export function Hero() {
  const { t } = useI18n();
  return (
    <div className="mb-8 sm:mb-10">
      <p className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-line bg-panel/80 py-1 pl-2.5 pr-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
        <span className="size-1.5 animate-pulse-dot rounded-full bg-accent" aria-hidden />
        {t("hero.eyebrow")}
      </p>
      <h1 className="max-w-3xl text-balance text-[2.35rem] font-semibold leading-[1.06] tracking-[-0.03em] sm:text-6xl">
        {t("hero.titleBefore")}{" "}
        <span className="relative whitespace-nowrap text-accent">
          {t("hero.titleAccent")}
          <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-accent/0 via-accent/70 to-accent/0" aria-hidden />
        </span>
        {t("hero.titleAfter")}
      </h1>
      <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted sm:text-lg">{t("hero.subtitle")}</p>
    </div>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-xs leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-xl">{t("footer.ethics")}</p>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted/90">{t("footer.practice")}</p>
      </div>
    </footer>
  );
}
