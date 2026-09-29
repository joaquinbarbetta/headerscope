"use client";

import { useMemo, useState } from "react";
import type { ScanReport, Status } from "@/lib/scanner/types";
import { CheckCard } from "./CheckCard";
import { STATUS_LABEL, STATUS_TEXT, StatusIcon } from "./StatusIcon";

const ORDER: Record<Status, number> = { fail: 0, warn: 1, pass: 2, info: 3 };

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-pass";
  if (grade === "B") return "text-accent";
  if (grade === "C") return "text-warn";
  return "text-fail";
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto size-36 shrink-0 sm:mx-0">
      <svg viewBox="0 0 120 120" className={`size-36 -rotate-90 ${gradeColor(grade)}`} aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-line)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-bold ${gradeColor(grade)}`}>{grade}</span>
        <span className="text-sm text-muted">{score}/100</span>
      </div>
    </div>
  );
}

type Filter = Status | "all";

export function Report({ report }: { report: ScanReport }) {
  const [filter, setFilter] = useState<Filter>("all");
  const checks = useMemo(
    () =>
      [...report.checks]
        .sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.weight - a.weight)
        .filter((c) => filter === "all" || c.status === filter),
    [report.checks, filter],
  );
  const host = new URL(report.finalUrl).host;

  function downloadJson() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `headerscope-${host}-${report.scannedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const filters: Filter[] = ["all", "fail", "warn", "pass", "info"];

  return (
    <section className="mt-10 space-y-6" aria-live="polite">
      {/* Summary */}
      <div className="flex flex-col gap-6 rounded-2xl border border-line bg-panel p-6 sm:flex-row sm:items-center">
        <ScoreRing score={report.score} grade={report.grade} />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="truncate text-2xl font-semibold">{host}</h2>
            <p className="truncate font-mono text-xs text-muted" title={report.finalUrl}>
              {report.finalUrl}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["fail", "warn", "pass"] as Status[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-bg px-3 py-1 text-sm">
                <StatusIcon status={s} className="size-4" />
                <span className={STATUS_TEXT[s]}>{report.counts[s]}</span>
                <span className="text-muted">{STATUS_LABEL[s].toLowerCase()}</span>
              </span>
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted">Status</dt>
              <dd className="font-mono">{report.status}</dd>
            </div>
            <div>
              <dt className="text-muted">Redirects</dt>
              <dd className="font-mono">{report.redirects.length}</dd>
            </div>
            <div>
              <dt className="text-muted">TLS</dt>
              <dd className="font-mono">{report.tls?.protocol ?? "none"}</dd>
            </div>
            <div>
              <dt className="text-muted">Time</dt>
              <dd className="font-mono">{report.durationMs} ms</dd>
            </div>
          </dl>
        </div>
      </div>

      {report.redirects.length > 0 && (
        <div className="rounded-xl border border-line bg-panel px-4 py-3 text-sm">
          <div className="mb-2 text-xs uppercase tracking-wide text-muted">Redirect chain</div>
          <ol className="space-y-1 font-mono text-xs">
            {report.redirects.map((h, i) => (
              <li key={i} className="break-all">
                <span className="text-warn">{h.status}</span> {h.url}
              </li>
            ))}
            <li className="break-all">
              <span className="text-pass">{report.status}</span> {report.finalUrl}
            </li>
          </ol>
        </div>
      )}

      {/* Checks */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-panel p-1" role="tablist">
            {filters.map((f) => {
              const n = f === "all" ? report.checks.length : report.counts[f];
              if (f !== "all" && n === 0) return null;
              return (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1 text-sm transition-colors ${
                    filter === f ? "bg-panel-2 text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {f === "all" ? "All" : STATUS_LABEL[f]} <span className="text-muted">{n}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={downloadJson}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-ink"
          >
            Download JSON
          </button>
        </div>
        <ul className="space-y-2">
          {checks.map((c) => (
            <CheckCard key={c.id} check={c} />
          ))}
        </ul>
      </div>

      {/* Raw headers */}
      <details className="group rounded-xl border border-line bg-panel">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm text-muted hover:text-ink">
          Raw response headers ({Object.keys(report.headers).length})
        </summary>
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full text-left font-mono text-xs">
            <tbody>
              {Object.entries(report.headers)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => (
                  <tr key={k} className="border-b border-line/60 last:border-0 align-top">
                    <th scope="row" className="whitespace-nowrap px-4 py-2 font-medium text-accent">
                      {k}
                    </th>
                    <td className="whitespace-pre-wrap break-all px-4 py-2 text-ink/85">{v}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
