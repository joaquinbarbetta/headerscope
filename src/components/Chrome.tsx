"use client";

import Link from "next/link";
import { REPO_URL } from "@/lib/site";
import type { Status } from "@/lib/scanner/types";
import { GROUPS, GROUP_KEY, GroupIcon, scoreColor } from "./categories";
import { useI18n } from "./I18nProvider";
import { LanguageToggle } from "./LanguageToggle";
import { StatusIcon } from "./StatusIcon";

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
    <header className="sticky top-0 z-20 px-2 sm:px-4">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-30 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-ink"
      >
        {t("nav.skip")}
      </a>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 rounded-b-2xl border-x border-b border-line bg-panel/75 px-3 backdrop-blur-xl sm:px-5">
        <Link href="/" className="flex items-center gap-2.5 rounded-md">
          <LogoMark />
          <span className="font-display text-lg font-bold tracking-tight">
            Header<span className="text-accent">Scope</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("nav.sourceLabel")}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted transition-colors duration-200 hover:bg-panel-3 hover:text-ink"
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
      <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-line bg-panel/80 py-1.5 pl-3 pr-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
        <span className="size-1.5 animate-pulse-dot rounded-full bg-accent" aria-hidden />
        {t("hero.eyebrow")}
      </p>
      <h1 className="text-balance font-display text-[2.6rem] font-bold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[4.1rem]">
        {t("hero.titleBefore")} <span className="text-gradient whitespace-nowrap">{t("hero.titleAccent")}</span>
        {t("hero.titleAfter")}
      </h1>
      <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">{t("hero.subtitle")}</p>
    </div>
  );
}

const PREVIEW_ROWS: { id: "hsts" | "csp" | "cookies" | "permissions"; status: Status }[] = [
  { id: "csp", status: "warn" },
  { id: "hsts", status: "pass" },
  { id: "cookies", status: "pass" },
  { id: "permissions", status: "fail" },
];
const PREVIEW_SCORES = [100, 72, 100, 67];

/** Decorative product shot: a miniature report with sample data. Hidden from assistive tech. */
export function HeroPreview() {
  const { t } = useI18n();
  return (
    <div className="relative hidden lg:block" aria-hidden>
      <div className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-violet)_24%,transparent),transparent)] blur-2xl" />
      <div className="surface animate-float overflow-hidden rounded-3xl">
        <div className="flex items-center gap-3 border-b border-line bg-panel-2/70 px-4 py-3">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
          </span>
          <span className="flex-1 truncate rounded-lg border border-line bg-bg/60 px-3 py-1 font-mono text-xs text-muted">
            https://{t("preview.host")}
          </span>
          <span className="rounded-md border border-violet/35 bg-violet/10 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-violet">
            {t("preview.label")}
          </span>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-5 p-5">
          <div className="flex size-28 flex-col items-center justify-center rounded-full border-[7px] border-pass/85 bg-panel-2 shadow-[0_0_30px_-6px_var(--color-pass)]">
            <span className="font-display text-4xl font-bold text-pass">A</span>
            <span className="font-mono text-[11px] text-muted">88/100</span>
          </div>
          <div className="space-y-2.5 self-center">
            {GROUPS.map((g, i) => (
              <div key={g} className="flex items-center gap-2.5 text-xs">
                <span className="flex w-24 items-center gap-1.5 text-muted">
                  <GroupIcon group={g} className="size-3.5" />
                  {t(GROUP_KEY[g])}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-3">
                  <span
                    className={`block h-full origin-left animate-grow rounded-full ${scoreColor(PREVIEW_SCORES[i])}`}
                    style={{ width: `${PREVIEW_SCORES[i]}%`, animationDelay: `${300 + i * 90}ms` }}
                  />
                </span>
                <span className="w-7 text-right font-mono tabular-nums text-muted">{PREVIEW_SCORES[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <ul className="space-y-2 border-t border-line bg-bg/30 p-4">
          {PREVIEW_ROWS.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-xl border border-line bg-panel-2 px-3.5 py-2.5">
              <StatusIcon status={r.status} className="size-4" decorative />
              <span className="flex-1 truncate text-sm font-medium">{t(`check.${r.id}.title`)}</span>
              <span className="h-1.5 w-16 rounded-full bg-panel-3" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-xs leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <LogoMark className="size-6 shrink-0" />
          <p className="max-w-xl">{t("footer.ethics")}</p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-wider">{t("footer.practice")}</p>
      </div>
    </footer>
  );
}
