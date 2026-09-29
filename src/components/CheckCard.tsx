"use client";

import { useState } from "react";
import type { CheckResult } from "@/lib/scanner/types";
import { STATUS_BG, STATUS_LABEL, STATUS_TEXT, StatusIcon } from "./StatusIcon";

export function CheckCard({ check }: { check: CheckResult }) {
  const [open, setOpen] = useState(check.status === "fail");
  const [copied, setCopied] = useState(false);
  const hasBody = check.details.length > 0 || check.recommendation || check.value || check.example;

  async function copyExample() {
    if (!check.example) return;
    await navigator.clipboard.writeText(check.example);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <li className="rounded-xl border border-line bg-panel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left hover:bg-panel-2 rounded-xl transition-colors"
      >
        <StatusIcon status={check.status} className="size-5 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-medium">{check.title}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_BG[check.status]} ${STATUS_TEXT[check.status]}`}>
              {STATUS_LABEL[check.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{check.summary}</p>
        </div>
        {hasBody && (
          <svg
            className={`size-4 mt-1.5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
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

      {open && hasBody && (
        <div className="space-y-4 border-t border-line px-4 pb-4 pt-3 pl-12 text-sm">
          {check.value && (
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-muted">Observed value</div>
              <code className="block break-all rounded-md bg-bg px-3 py-2 font-mono text-xs text-ink/90">
                {check.value}
              </code>
            </div>
          )}
          {check.details.length > 0 && (
            <ul className="list-disc space-y-1 pl-4 text-ink/85 marker:text-muted">
              {check.details.map((d, i) => (
                <li key={i} className="break-words">
                  {d}
                </li>
              ))}
            </ul>
          )}
          {check.recommendation && (
            <div className="rounded-md border border-accent/25 bg-accent/5 px-3 py-2">
              <span className="font-medium text-accent">How to fix: </span>
              {check.recommendation}
            </div>
          )}
          {check.example && check.status !== "pass" && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wide text-muted">
                <span>Example</span>
                <button type="button" onClick={copyExample} className="normal-case tracking-normal hover:text-ink">
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <code className="block break-all rounded-md bg-bg px-3 py-2 font-mono text-xs text-accent">
                {check.example}
              </code>
            </div>
          )}
          <a
            href={check.reference}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-info hover:underline"
          >
            Learn more ↗
          </a>
        </div>
      )}
    </li>
  );
}
