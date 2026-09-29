"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { MessageKey } from "@/lib/i18n";
import type { ScanReport, Status } from "@/lib/scanner/types";
import { CheckCard } from "./CheckCard";
import { useI18n } from "./I18nProvider";
import { STATUS_KEY, STATUS_TEXT, StatusIcon } from "./StatusIcon";

type MetaKey = Extract<MessageKey, `report.meta.${string}`>;
type VerdictKey = Extract<MessageKey, `report.verdict.${string}`>;

const ORDER: Record<Status, number> = { fail: 0, warn: 1, pass: 2, info: 3 };

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-pass";
  if (grade === "B") return "text-accent";
  if (grade === "C") return "text-warn";
  return "text-fail";
}

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const { t } = useI18n();
  return (
    <div
      className="relative mx-auto size-40 shrink-0 sm:mx-0"
      role="img"
      aria-label={t("report.scoreAria", { grade, score })}
    >
      <svg viewBox="0 0 120 120" className={`size-40 -rotate-90 ${gradeColor(grade)}`} aria-hidden>
        {/* Tick marks: the "gauge" look. */}
        {Array.from({ length: 40 }, (_, i) => (
          <line
            key={i}
            x1="60"
            y1="2"
            x2="60"
            y2={i % 5 === 0 ? "6" : "4"}
            stroke="var(--color-line-strong)"
            strokeWidth="1"
            transform={`rotate(${i * 9} 60 60)`}
          />
        ))}
        <circle cx="60" cy="60" r={RING_R} fill="none" stroke="var(--color-line)" strokeWidth="8" />
        <circle
          key={score}
          cx="60"
          cy="60"
          r={RING_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - score / 100)}
          className="animate-ring drop-shadow-[0_0_6px_currentColor]"
          style={{ "--ring-circumference": RING_C } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className={`text-5xl font-semibold tracking-tight ${gradeColor(grade)}`}>{grade}</span>
        <span className="mt-0.5 font-mono text-xs tabular-nums text-muted">{score}/100</span>
      </div>
    </div>
  );
}

type Filter = Status | "all";

export function Report({ report }: { report: ScanReport }) {
  const { t } = useI18n();
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
  const meta: [MetaKey, string][] = [
    ["report.meta.status", String(report.status)],
    ["report.meta.redirects", String(report.redirects.length)],
    ["report.meta.tls", report.tls?.protocol ?? t("report.meta.none")],
    ["report.meta.time", `${report.durationMs} ms`],
  ];

  return (
    <section className="space-y-5" aria-labelledby="report-heading">
      <h2 id="report-heading" className="sr-only">
        {t("report.heading")}
      </h2>

      {/* Summary */}
      <div className="animate-fade-up rounded-2xl border border-line bg-panel/90 p-5 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <ScoreRing score={report.score} grade={report.grade} />
          <div className="min-w-0 flex-1 space-y-4">
            <div className="text-center sm:text-left">
              <p className="truncate text-2xl font-semibold tracking-tight sm:text-3xl" title={host}>
                {host}
              </p>
              <p className="mt-1 truncate font-mono text-xs text-muted" title={report.finalUrl}>
                {report.finalUrl}
              </p>
              <p className={`mt-3 text-sm font-medium ${gradeColor(report.grade)}`}>
                {t(`report.verdict.${report.grade}` as VerdictKey)}
              </p>
            </div>
            <ul className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {(["fail", "warn", "pass"] as Status[]).map((s) => (
                <li key={s} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg/70 px-2.5 py-1 text-sm">
                  <StatusIcon status={s} className="size-4" decorative />
                  <span className={`font-mono font-medium tabular-nums ${STATUS_TEXT[s]}`}>{report.counts[s]}</span>
                  <span className="text-muted">{t(STATUS_KEY[s])}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
          {meta.map(([label, value]) => (
            <div key={label} className="bg-panel px-4 py-3">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">{t(label)}</dt>
              <dd className="mt-0.5 truncate font-mono text-sm tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {report.redirects.length > 0 && (
        <div className="animate-fade-up rounded-xl border border-line bg-panel px-4 py-3.5 text-sm">
          <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">{t("report.redirectChain")}</h3>
          <ol className="space-y-1.5 font-mono text-xs">
            {report.redirects.map((h, i) => (
              <li key={i} className="flex gap-2 break-all">
                <span className="shrink-0 text-warn">{h.status}</span>
                <span className="text-ink/85">{h.url}</span>
              </li>
            ))}
            <li className="flex gap-2 break-all">
              <span className="shrink-0 text-pass">{report.status}</span>
              <span className="text-ink/85">{report.finalUrl}</span>
            </li>
          </ol>
        </div>
      )}

      {/* Checks */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label={t("report.filterLabel")} className="flex flex-wrap gap-1 rounded-xl border border-line bg-panel p-1">
            {filters.map((f) => {
              const n = f === "all" ? report.checks.length : report.counts[f];
              if (f !== "all" && n === 0) return null;
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f)}
                  className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm transition-colors duration-200 ${
                    active ? "bg-panel-2 text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)]" : "text-muted hover:text-ink"
                  }`}
                >
                  {f === "all" ? t("report.filterAll") : t(STATUS_KEY[f])}
                  <span className="font-mono text-xs tabular-nums text-muted">{n}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={downloadJson}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-line px-3.5 text-sm text-muted transition-colors duration-200 hover:border-accent/60 hover:text-ink"
          >
            <svg className="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
              <path d="M10 3v10m0 0-4-4m4 4 4-4M4 16h12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("report.downloadJson")}
          </button>
        </div>
        {checks.length > 0 ? (
          <ul className="space-y-2">
            {checks.map((c, i) => (
              <CheckCard key={c.id} check={c} index={i} />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">{t("report.noChecks")}</p>
        )}
      </div>

      {/* Raw headers */}
      <details className="group rounded-xl border border-line bg-panel">
        <summary className="flex min-h-12 cursor-pointer select-none items-center gap-2 px-4 text-sm text-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
          <svg className="size-4 transition-transform duration-200 group-open:rotate-90" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="m8 5 5 5-5 5" />
          </svg>
          {t("report.rawHeaders", { count: Object.keys(report.headers).length })}
        </summary>
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full text-left font-mono text-xs">
            <tbody>
              {Object.entries(report.headers)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => (
                  <tr key={k} className="border-b border-line/60 align-top last:border-0">
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
