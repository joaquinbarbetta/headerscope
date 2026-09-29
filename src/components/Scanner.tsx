"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Message } from "@/lib/i18n";
import type { ScanReport } from "@/lib/scanner/types";
import { useI18n } from "./I18nProvider";
import { Report } from "./Report";
import { CheckOverview, ScanProgress } from "./ScanStates";

const EXAMPLES = ["github.com", "owasp.org", "example.com", "wikipedia.org"];

/** Best-effort host for the loading title; the server does the real validation. */
function displayHost(input: string): string {
  const trimmed = input.trim();
  try {
    return new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).host || trimmed;
  } catch {
    return trimmed;
  }
}

export function Scanner() {
  const { locale, t, tm } = useI18n();
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<Message | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const loading = pending !== null;

  // Keep progress and fresh results in view on small screens, where they start below the fold.
  useEffect(() => {
    if (loading || report || error) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [loading, report, error]);

  async function runScan(target: string) {
    if (!target.trim() || loading) return;
    setPending(displayHost(target));
    setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target, lang: locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? { key: "error.generic" });
        setReport(null);
        inputRef.current?.focus();
      } else {
        setReport(data as ScanReport);
      }
    } catch {
      setError({ key: "error.network" });
    } finally {
      setPending(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    runScan(url);
  }

  return (
    <div>
      <form onSubmit={onSubmit} noValidate>
        <label htmlFor="url" className="sr-only">
          {t("form.label")}
        </label>
        <div className="group flex flex-col gap-2 rounded-2xl border border-line-strong bg-panel/90 p-2 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] transition-[border-color,box-shadow] duration-200 focus-within:border-accent/70 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-accent)_14%,transparent)] sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center">
            <span className="select-none pl-3 pr-1 font-mono text-base text-accent" aria-hidden>
              ›
            </span>
            <input
              ref={inputRef}
              id="url"
              type="text"
              inputMode="url"
              autoComplete="url"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={t("form.placeholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "scan-error" : "scan-hint"}
              className="min-h-12 min-w-0 flex-1 bg-transparent px-2 font-mono text-base text-ink outline-none placeholder:text-muted/60 focus-visible:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            aria-busy={loading}
            className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-6 font-semibold text-accent-ink transition-[transform,filter,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 [&:disabled:not([aria-busy=true])]:opacity-45"
          >
            {loading ? (
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                <circle cx="9" cy="9" r="5.5" />
                <path d="m13 13 4 4" strokeLinecap="round" />
              </svg>
            )}
            {loading ? t("form.scanning") : t("form.submit")}
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="font-mono text-[11px] uppercase tracking-wider">{t("form.try")}:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={loading}
              onClick={() => {
                setUrl(ex);
                runScan(ex);
              }}
              className="min-h-9 cursor-pointer rounded-lg border border-line px-2.5 font-mono text-xs text-muted transition-colors duration-200 hover:border-accent/60 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
        <p id="scan-hint" className="font-mono text-[11px] text-muted">
          {t("form.hint")}
        </p>
      </div>

      <div ref={resultRef} className="mt-10 scroll-mt-20">
        {error && !loading && (
          <div
            id="scan-error"
            role="alert"
            className="mb-6 flex animate-fade-up items-start gap-3 rounded-xl border border-fail/35 bg-fail/[0.08] px-4 py-3 text-sm text-fail"
          >
            <svg className="mt-0.5 size-4 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <circle cx="10" cy="10" r="8" />
              <path d="M10 6v5M10 14v.01" strokeLinecap="round" />
            </svg>
            <span>{tm(error)}</span>
          </div>
        )}
        {loading ? <ScanProgress host={pending} /> : report ? <Report report={report} /> : <CheckOverview />}
      </div>
    </div>
  );
}
