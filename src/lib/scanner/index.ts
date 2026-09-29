import { runChecks } from "./checks";
import { fetchHeaders, type FetchOptions } from "./fetcher";
import type { CheckResult, FetchResult, ScanReport, Status } from "./types";

const FACTOR: Record<Status, number> = { pass: 1, warn: 0.5, fail: 0, info: 0 };

export function computeScore(checks: CheckResult[]): number {
  const scored = checks.filter((c) => c.status !== "info" && c.weight > 0);
  const total = scored.reduce((s, c) => s + c.weight, 0);
  if (total === 0) return 0;
  const earned = scored.reduce((s, c) => s + c.weight * FACTOR[c.status], 0);
  return Math.round((earned / total) * 100);
}

export function gradeFor(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function buildReport(input: string, r: FetchResult): ScanReport {
  const checks = runChecks(r);
  const score = computeScore(checks);
  const counts: Record<Status, number> = { pass: 0, warn: 0, fail: 0, info: 0 };
  for (const c of checks) counts[c.status]++;

  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(r.headers)) {
    if (v !== undefined) headers[k] = Array.isArray(v) ? v.join("\n") : v;
  }

  return {
    url: input,
    finalUrl: r.finalUrl,
    status: r.status,
    scannedAt: new Date().toISOString(),
    durationMs: r.durationMs,
    score,
    grade: gradeFor(score),
    counts,
    checks,
    headers,
    redirects: r.redirects,
    tls: r.tls,
  };
}

export async function scan(input: string, options?: FetchOptions): Promise<ScanReport> {
  const result = await fetchHeaders(input, options);
  return buildReport(input, result);
}

export { TargetError } from "./ssrf";
export type * from "./types";
