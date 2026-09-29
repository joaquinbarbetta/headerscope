"use client";

import { useEffect, useState } from "react";
import { CHECK_CATALOG } from "@/lib/scanner/catalog";
import { useI18n } from "./I18nProvider";

const STEPS = [
  "loading.step.validate",
  "loading.step.dns",
  "loading.step.tls",
  "loading.step.request",
  "loading.step.redirects",
  "loading.step.audit",
] as const;

/** Paces the step list; the last step stays active until the response arrives. */
const STEP_MS = 420;

function Radar() {
  return (
    <div className="relative mx-auto size-28 shrink-0 sm:mx-0 sm:size-40" aria-hidden>
      <div className="absolute inset-0 rounded-full border border-line-strong" />
      <div className="absolute inset-[18%] rounded-full border border-line" />
      <div className="absolute inset-[36%] rounded-full border border-line" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
      <div className="absolute inset-0 animate-sweep rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_280deg,color-mix(in_oklab,var(--color-accent)_45%,transparent)_360deg)]" />
      <div className="absolute left-[64%] top-[30%] size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
      <div className="absolute left-[28%] top-[62%] size-1 rounded-full bg-accent/70" />
    </div>
  );
}

export function ScanProgress({ host }: { host: string }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="animate-fade-up rounded-2xl border border-line bg-panel/90 p-5 sm:p-7" role="status" aria-live="polite">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <Radar />
        <div className="min-w-0 flex-1">
          <p className="truncate text-center text-lg font-semibold tracking-tight sm:text-left">
            {t("loading.title", { host })}
            <span className="ml-0.5 animate-blink text-accent" aria-hidden>
              _
            </span>
          </p>
          <ol className="mt-4 space-y-2 font-mono text-[13px]">
            {STEPS.map((key, i) => {
              const state = i < step ? "done" : i === step ? "active" : "pending";
              return (
                <li
                  key={key}
                  className={`flex items-center gap-2.5 transition-opacity duration-300 ${state === "pending" ? "opacity-35" : "opacity-100"}`}
                  aria-hidden={state === "pending"}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden>
                    {state === "done" && (
                      <svg className="size-4 text-accent" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.2}>
                        <path d="m5 10.5 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {state === "active" && (
                      <svg className="size-3.5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
                        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    )}
                    {state === "pending" && <span className="size-1 rounded-full bg-muted" />}
                  </span>
                  <span className={state === "active" ? "text-ink" : "text-muted"}>{t(key)}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

export function CheckOverview() {
  const { t } = useI18n();
  const max = Math.max(...CHECK_CATALOG.map((c) => c.weight));

  return (
    <section aria-labelledby="overview-heading" className="animate-fade-up">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 id="overview-heading" className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-ink">
          {t("empty.title")}
        </h2>
        <p className="text-sm text-muted">{t("empty.subtitle")}</p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {CHECK_CATALOG.map((c, i) => (
          <li
            key={c.id}
            style={{ animationDelay: `${i * 30}ms` }}
            className="group animate-fade-up rounded-xl border border-line bg-panel/70 px-4 py-3 transition-colors duration-200 hover:border-line-strong hover:bg-panel"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium tracking-tight">{t(`check.${c.id}.title`)}</span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
                {c.weight > 0 ? t("empty.weight", { weight: c.weight }) : t("empty.info")}
              </span>
            </div>
            <p className="mt-0.5 text-sm leading-snug text-muted">{t(`check.${c.id}.about`)}</p>
            <div className="mt-2.5 h-0.5 overflow-hidden rounded-full bg-line" aria-hidden>
              <div
                className="h-full rounded-full bg-accent/70 transition-colors group-hover:bg-accent"
                style={{ width: `${c.weight > 0 ? (c.weight / max) * 100 : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
