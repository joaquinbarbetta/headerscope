"use client";

import { useId, useState } from "react";
import type { CheckResult } from "@/lib/scanner/types";
import { useI18n } from "./I18nProvider";
import { STATUS_BG, STATUS_KEY, STATUS_STRIPE, STATUS_TEXT, StatusIcon } from "./StatusIcon";

export function CheckCard({ check, index = 0 }: { check: CheckResult; index?: number }) {
  const { t, tm } = useI18n();
  const [open, setOpen] = useState(check.status === "fail");
  const [copied, setCopied] = useState(false);
  const panelId = useId();
  const { messages } = check;
  const showExample = Boolean(check.example) && check.status !== "pass";
  const hasBody = messages.details.length > 0 || Boolean(messages.recommendation) || Boolean(check.value) || showExample;

  async function copyExample() {
    if (!check.example) return;
    try {
      await navigator.clipboard.writeText(check.example);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable (permissions, insecure context); the text is still selectable.
    }
  }

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
      className={`relative animate-fade-up overflow-hidden rounded-xl border border-line bg-panel transition-colors duration-200 before:absolute before:inset-y-0 before:left-0 before:w-[3px] ${STATUS_STRIPE[check.status]} ${open ? "border-line-strong" : "hover:border-line-strong"}`}
    >
      <h3>
        <button
          type="button"
          onClick={() => hasBody && setOpen((o) => !o)}
          aria-expanded={hasBody ? open : undefined}
          aria-controls={hasBody ? panelId : undefined}
          disabled={!hasBody}
          className={`flex w-full items-start gap-3 py-4 pl-5 pr-4 text-left transition-colors duration-200 ${hasBody ? "cursor-pointer hover:bg-panel-2/60" : "cursor-default"}`}
        >
          <StatusIcon status={check.status} className="mt-0.5 size-5" decorative />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="font-medium tracking-tight text-ink">{tm(messages.title)}</span>
              <span
                className={`rounded-md border px-1.5 py-px font-mono text-[11px] font-medium uppercase tracking-wider ${STATUS_BG[check.status]} ${STATUS_TEXT[check.status]}`}
              >
                {t(STATUS_KEY[check.status])}
              </span>
              {check.weight > 0 && (
                <span className="font-mono text-[11px] text-muted">{t("empty.weight", { weight: check.weight })}</span>
              )}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-muted">{tm(messages.summary)}</span>
          </span>
          {hasBody && (
            <svg
              className={`mt-1 size-4 shrink-0 text-muted transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path d="m5 8 5 5 5-5" />
            </svg>
          )}
        </button>
      </h3>

      {hasBody && (
        <div
          id={panelId}
          inert={!open}
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 border-t border-line px-5 pb-5 pt-4 text-sm sm:pl-13">
              {check.value && (
                <div>
                  <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">{t("card.observed")}</div>
                  <code className="block break-all rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs leading-relaxed text-ink/90">
                    {check.value}
                  </code>
                </div>
              )}
              {messages.details.length > 0 && (
                <ul className="space-y-1.5 text-ink/85">
                  {messages.details.map((d, i) => (
                    <li key={i} className="flex gap-2 break-words leading-relaxed">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-muted/70" aria-hidden />
                      <span className="min-w-0">{tm(d)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {messages.recommendation && (
                <div className="rounded-lg border border-accent/25 bg-accent/[0.06] px-3.5 py-2.5 leading-relaxed">
                  <span className="font-medium text-accent">{t("card.howToFix")}: </span>
                  {tm(messages.recommendation)}
                </div>
              )}
              {showExample && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{t("card.example")}</span>
                    <button
                      type="button"
                      onClick={copyExample}
                      aria-label={t("card.copyLabel")}
                      className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs text-muted transition-colors duration-200 hover:bg-panel-2 hover:text-ink"
                    >
                      <svg className="size-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                        {copied ? (
                          <path d="m5 10.5 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        ) : (
                          <>
                            <rect x="7" y="7" width="10" height="10" rx="2" />
                            <path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                          </>
                        )}
                      </svg>
                      <span aria-live="polite">{copied ? t("card.copied") : t("card.copy")}</span>
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-lg border border-line bg-bg px-3 py-2.5 font-mono text-xs leading-relaxed text-accent">
                    <code className="whitespace-pre-wrap break-words">{check.example}</code>
                  </pre>
                </div>
              )}
              <a
                href={check.reference}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded text-xs text-info underline-offset-4 hover:underline"
              >
                {t("card.learnMore")}
                <svg className="size-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path d="M7 13 13 7M8 7h5v5" />
                </svg>
                <span className="sr-only">{t("card.newTab")}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
