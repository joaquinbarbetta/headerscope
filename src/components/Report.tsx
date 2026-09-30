"use client";

import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { MessageKey } from "@/lib/i18n";
import type { ScanReport, Status } from "@/lib/scanner/types";
import { GROUPS, GROUP_KEY, GROUP_OF, GroupIcon, groupScore, scoreColor, type Group } from "./categories";
import { CheckCard } from "./CheckCard";
import { useI18n } from "./I18nProvider";
import { WindowBar } from "./ScanStates";
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
    <div className="relative size-44 shrink-0" role="img" aria-label={t("report.scoreAria", { grade, score })}>
      <svg viewBox="0 0 120 120" className={`relative size-44 -rotate-90 ${gradeColor(grade)}`} aria-hidden>
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
        <circle cx="60" cy="60" r={RING_R} fill="none" stroke="var(--color-panel-3)" strokeWidth="8" />
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
        <span className={`font-display text-6xl font-bold tracking-tight ${gradeColor(grade)}`}>{grade}</span>
        <span className="mt-0.5 font-mono text-xs tabular-nums text-muted">{score}/100</span>
      </div>
    </div>
  );
}

type Tab = Group | "all";
type Filter = Status | "all";

const TABS: Tab[] = ["all", ...GROUPS];
const STATUSES: Status[] = ["fail", "warn", "pass", "info"];

export function Report({ report }: { report: ScanReport }) {
  const { locale, t } = useI18n();
  const [tab, setTab] = useState<Tab>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  const sorted = useMemo(
    () => [...report.checks].sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.weight - a.weight),
    [report.checks],
  );
  const byGroup = useMemo(() => {
    const map = Object.fromEntries(GROUPS.map((g) => [g, [] as typeof sorted])) as Record<Group, typeof sorted>;
    for (const c of sorted) map[GROUP_OF[c.category]].push(c);
    return map;
  }, [sorted]);

  const inTab = tab === "all" ? sorted : byGroup[tab];
  const checks = inTab.filter((c) => filter === "all" || c.status === filter);
  const host = new URL(report.finalUrl).host;
  const scannedAt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(report.scannedAt),
  );

  function downloadJson() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `headerscope-${host}-${report.scannedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function selectTab(next: Tab) {
    setTab(next);
    setFilter("all");
  }

  function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const i = TABS.indexOf(tab);
    const next =
      e.key === "ArrowRight"
        ? TABS[(i + 1) % TABS.length]
        : e.key === "ArrowLeft"
          ? TABS[(i - 1 + TABS.length) % TABS.length]
          : e.key === "Home"
            ? TABS[0]
            : e.key === "End"
              ? TABS[TABS.length - 1]
              : null;
    if (!next) return;
    e.preventDefault();
    selectTab(next);
    tabRefs.current[next]?.focus();
  }

  const meta: [MetaKey, string][] = [
    ["report.meta.status", String(report.status)],
    ["report.meta.redirects", String(report.redirects.length)],
    ["report.meta.tls", report.tls?.protocol ?? t("report.meta.none")],
    ["report.meta.time", `${report.durationMs} ms`],
  ];

  return (
    <section className="space-y-8" aria-labelledby="report-heading">
      <h2 id="report-heading" className="sr-only">
        {t("report.heading")}
      </h2>

      {/* Dashboard */}
      <div className="surface animate-fade-up overflow-hidden rounded-3xl">
        <WindowBar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs text-ink/90" title={report.finalUrl}>
              {report.finalUrl}
            </p>
            <p className="truncate font-mono text-[11px] text-muted">{t("report.scanned", { date: scannedAt })}</p>
          </div>
          <button
            type="button"
            onClick={downloadJson}
            className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-line-strong bg-panel px-3 text-sm font-medium text-ink transition-colors duration-200 hover:border-accent/60 hover:bg-panel-3"
          >
            <svg className="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
              <path d="M10 3v10m0 0-4-4m4 4 4-4M4 16h12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">{t("report.downloadJson")}</span>
            <span className="sm:hidden">JSON</span>
          </button>
        </WindowBar>

        <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-2 lg:grid-cols-[1.15fr_0.9fr_1.2fr]">
          {/* Grade */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-panel-2 p-5 text-center sm:flex-row sm:text-left md:col-span-2 lg:col-span-1 lg:flex-col lg:text-center">
            <ScoreRing score={report.score} grade={report.grade} />
            <div className="min-w-0">
              <p className="truncate font-display text-2xl font-bold tracking-tight sm:text-3xl" title={host}>
                {host}
              </p>
              <p className={`mt-2 text-sm font-medium ${gradeColor(report.grade)}`}>
                {t(`report.verdict.${report.grade}` as VerdictKey)}
              </p>
            </div>
          </div>

          {/* Status counts */}
          <ul className="grid grid-cols-2 gap-3">
            {STATUSES.map((s, i) => (
              <li
                key={s}
                style={{ animationDelay: `${120 + i * 60}ms` }}
                className="flex animate-fade-up flex-col justify-between rounded-2xl border border-line bg-panel-2 p-4"
              >
                <StatusIcon status={s} className="size-5" decorative />
                <span>
                  <span className={`block font-display text-4xl font-bold tabular-nums ${STATUS_TEXT[s]}`}>
                    {report.counts[s]}
                  </span>
                  <span className="text-sm text-muted">{t(STATUS_KEY[s])}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* Category breakdown */}
          <div className="rounded-2xl border border-line bg-panel-2 p-5">
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{t("report.breakdown")}</h3>
            <ul className="mt-4 space-y-4">
              {GROUPS.map((g, i) => {
                const score = groupScore(byGroup[g]);
                if (score === null) return null;
                return (
                  <li key={g} aria-label={t("report.categoryScore", { category: t(GROUP_KEY[g]), score })}>
                    <div className="mb-1.5 flex items-center justify-between text-sm" aria-hidden>
                      <span className="flex items-center gap-2">
                        <GroupIcon group={g} className="size-4 text-muted" />
                        {t(GROUP_KEY[g])}
                      </span>
                      <span className="font-mono tabular-nums text-muted">{score}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-panel-3" aria-hidden>
                      <div
                        className={`h-full origin-left animate-grow rounded-full ${scoreColor(score)}`}
                        style={{ width: `${Math.max(score, 2)}%`, animationDelay: `${200 + i * 90}ms` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
          {meta.map(([label, value], i) => (
            <div
              key={label}
              className={`px-5 py-4 ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}
            >
              <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">{t(label)}</dt>
              <dd className="mt-1 truncate font-mono text-sm tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {report.redirects.length > 0 && (
        <div className="surface animate-fade-up rounded-2xl px-5 py-4 text-sm">
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

      {/* Findings, organized in category tabs */}
      <div>
        <h3 className="mb-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">{t("report.findings")}</h3>

        <div className="mb-4 flex flex-col gap-3">
          <div
            role="tablist"
            aria-label={t("report.tabsLabel")}
            className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 py-1.5 [mask-image:linear-gradient(to_right,black_88%,transparent)] sm:mx-0 sm:px-1 sm:[mask-image:none]"
          >
            {TABS.map((x) => {
              const active = tab === x;
              const list = x === "all" ? sorted : byGroup[x];
              const fails = list.filter((c) => c.status === "fail").length;
              return (
                <button
                  key={x}
                  ref={(el) => {
                    tabRefs.current[x] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${x}`}
                  aria-selected={active}
                  aria-controls="findings-panel"
                  tabIndex={active ? 0 : -1}
                  onClick={() => selectTab(x)}
                  onKeyDown={onTabKeyDown}
                  className={`relative inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors duration-200 after:absolute after:inset-x-3 after:-bottom-[7px] after:h-0.5 after:origin-center after:rounded-full after:bg-accent after:transition-transform after:duration-300 ${
                    active
                      ? "bg-panel-3 text-ink after:scale-x-100"
                      : "text-muted after:scale-x-0 hover:bg-panel-2 hover:text-ink"
                  }`}
                >
                  {x !== "all" && <GroupIcon group={x} className="size-4" />}
                  {t(x === "all" ? "category.all" : GROUP_KEY[x])}
                  <span className="rounded-md bg-bg/60 px-1.5 font-mono text-xs tabular-nums text-muted">{list.length}</span>
                  {fails > 0 && <span className="size-1.5 rounded-full bg-fail" aria-hidden />}
                </button>
              );
            })}
          </div>

          <div role="group" aria-label={t("report.filterLabel")} className="flex flex-wrap gap-1.5">
            {(["all", ...STATUSES] as Filter[]).map((f) => {
              const n = f === "all" ? inTab.length : inTab.filter((c) => c.status === f).length;
              if (f !== "all" && n === 0) return null;
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f)}
                  className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-200 ${
                    active
                      ? "border-accent/50 bg-accent/10 text-ink"
                      : "border-line text-muted hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {f !== "all" && <StatusIcon status={f} className="size-3.5" decorative />}
                  {f === "all" ? t("report.filterAll") : t(STATUS_KEY[f])}
                  <span className="font-mono tabular-nums text-muted">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div role="tabpanel" id="findings-panel" aria-labelledby={`tab-${tab}`} tabIndex={-1} className="outline-none">
          {checks.length > 0 ? (
            <ul key={`${tab}-${filter}`} className="space-y-2.5">
              {checks.map((c, i) => (
                <CheckCard key={c.id} check={c} index={i} />
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
              {t("report.noChecks")}
            </p>
          )}
        </div>
      </div>

      {/* Raw headers */}
      <details className="surface group rounded-2xl">
        <summary className="flex min-h-13 cursor-pointer select-none items-center gap-2 rounded-2xl px-5 text-sm font-medium text-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
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
                    <th scope="row" className="whitespace-nowrap px-5 py-2 font-medium text-accent">
                      {k}
                    </th>
                    <td className="whitespace-pre-wrap break-all px-5 py-2 text-ink/85">{v}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
